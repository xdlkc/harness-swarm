import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildCodexGoalArgv, runCodexGoal, validateCodexGoalNativeArgs } from "../src/codex-goal.js";

function fixture(scenario: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "codex-goal-test-"));
  const executable = path.join(root, "codex-stub.cjs");
  writeFileSync(executable, `#!${process.execPath}
const fs = require('node:fs');
const readline = require('node:readline');
const scenario = ${JSON.stringify(scenario)};
const requests = [];
const goal = (status) => ({threadId:'thread-1',status});
const send = (msg) => process.stdout.write(JSON.stringify(msg)+'\\n');
const event = (method, params) => send({method,params:{threadId:'thread-1',...params}});
fs.writeFileSync('argv.json',JSON.stringify(process.argv.slice(2)));
if(scenario==='timeout') process.on('SIGTERM',()=>{});
readline.createInterface({input:process.stdin}).on('line',(line)=>{
 const msg=JSON.parse(line); requests.push(msg); fs.writeFileSync('requests.json',JSON.stringify(requests));
 if(msg.method==='initialized') return;
 if(msg.method==='initialize') {
   if(scenario==='rpc-error') {send({id:msg.id,error:{code:-32600,message:'unsupported protocol'}});return;}
   if(scenario==='malformed') {process.stdout.write('not json\\n');return;}
   send({id:msg.id,result:{}}); return;
 }
 if(msg.method==='thread/start') {send({id:msg.id,result:{thread:{id:'thread-1'}}});return;}
 if(msg.method==='thread/goal/set') {
   send({id:msg.id,result:{goal:goal('active')}});
   if(scenario==='eof') {process.exit(0);return;}
   if(scenario==='orphan-on-complete') {
     const worker=require('node:child_process').spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});process.send('ready');setInterval(()=>{},1000)"],{stdio:['ignore','ignore','ignore','ipc']});
     fs.writeFileSync('worker.pid',String(worker.pid));
     worker.once('message',()=>event('thread/goal/updated',{goal:goal('complete')}));
     return;
   }
   if(scenario==='timeout') {
     const worker=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
     fs.writeFileSync('worker.pid',String(worker.pid));
     setInterval(()=>{},1000);return;
   }
   if(scenario==='interaction') {send({id:'server-request',method:'item/tool/requestUserInput',params:{}});return;}
   if(scenario==='secret') {process.stderr.write('token='+process.env.TEST_API_KEY.slice(0,4));setTimeout(()=>process.stderr.write(process.env.TEST_API_KEY.slice(4)+'\\n'),10);}
   if(['budgetLimited','usageLimited','blocked','paused'].includes(scenario)) {
     event('thread/goal/updated',{goal:goal(scenario)});return;
   }
   event('turn/started',{turn:{id:'turn-1'}});
   event('turn/completed',{turn:{id:'turn-1',status:'completed'}});
   setTimeout(()=>{
     event('turn/started',{turn:{id:'turn-2'}});
     event('thread/goal/updated',{goal:goal('complete')});
     setTimeout(()=>{
       fs.writeFileSync('finished.txt','last turn actually finished');
       event('turn/completed',{turn:{id:'turn-2',status:'completed'}});
     },60);
   },60);
   return;
 }
 if(msg.method==='thread/goal/get') {send({id:msg.id,result:{goal:goal('active')}});return;}
 if(msg.method==='turn/start') {send({id:msg.id,error:{message:'do not race automatic goal start'}});return;}
});
`);
  chmodSync(executable, 0o755);
  return {
    root,
    opts: { executable, cwd: root, prompt: '完成目标，直到验证通过', model: 'test-model', effort: 'high', tokenBudget: 5000,
      timeoutMs: 3000, logPath: path.join(root, 'run.log'), env: { ...process.env, TEST_API_KEY: 'private-test-credential' } },
    clean: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("goal waits across automatic turns and through the terminal goal's enclosing turn", async () => {
  const f = fixture('complete');
  try {
    const result = await runCodexGoal({ ...f.opts, nativeArgs: ['-c', 'model_provider="local"', '--enable', 'test_feature'] });
    assert.equal(result.exitCode, 0);
    assert.equal(result.goalStatus, 'complete');
    assert.equal(result.timedOut, false);
    assert.ok(existsSync(path.join(f.root, 'finished.txt')));
    const requests = JSON.parse(readFileSync(path.join(f.root, 'requests.json'), 'utf8'));
    assert.deepEqual(requests.slice(0,4).map((x: {method:string}) => x.method), ['initialize','initialized','thread/start','thread/goal/set']);
    assert.equal(requests.some((x: {method:string}) => x.method === 'turn/start'), false);
    assert.equal(requests[0].params.capabilities.experimentalApi, true);
    assert.deepEqual(requests[2].params, {cwd:f.root, ephemeral:false, approvalPolicy:'never', sandbox:'danger-full-access', model:'test-model', config:{model_reasoning_effort:'high'}});
    assert.deepEqual(requests[3].params, {threadId:'thread-1',objective:f.opts.prompt,tokenBudget:5000});
    assert.deepEqual(JSON.parse(readFileSync(path.join(f.root,'argv.json'),'utf8')), ['app-server','-c','model_provider="local"','--enable','test_feature','--enable','goals','--stdio']);
  } finally { f.clean(); }
});

for (const status of ['budgetLimited','usageLimited','blocked','paused']) {
  test(`goal reports ${status} as a confirmed non-success terminal state`, async () => {
    const f=fixture(status);
    try {
      const result=await runCodexGoal(f.opts);
      assert.equal(result.exitCode,1); assert.equal(result.goalStatus,status); assert.equal(result.timedOut,false);
      assert.match(result.stderr,new RegExp(status));
    } finally { f.clean(); }
  });
}

for (const [scenario, message] of [['rpc-error','unsupported protocol'],['malformed','protocol/log error'],['eof','closed before goal completion'],['interaction','unsupported client interaction']]) {
  test(`goal fails on ${scenario} without inventing completion`, async () => {
    const f=fixture(scenario);
    try {
      const result=await runCodexGoal(f.opts);
      assert.equal(result.exitCode,1); assert.notEqual(result.goalStatus,'complete'); assert.equal(result.timedOut,false);
      assert.match(result.stderr,new RegExp(message));
    } finally { f.clean(); }
  });
}

test('timeout kills an app-server that ignores SIGTERM and preserves observed active state', async () => {
  const f=fixture('timeout');
  try {
    const result=await runCodexGoal({...f.opts,timeoutMs:1500});
    assert.equal(result.exitCode,124); assert.equal(result.timedOut,true); assert.equal(result.goalStatus,'active');
    assert.match(readFileSync(f.opts.logPath,'utf8'),/timed out/);
    if (process.platform !== 'win32') {
      const pid=Number(readFileSync(path.join(f.root,'worker.pid'),'utf8'));
      assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});
    }
  } finally { f.clean(); }
});

test('credential fragments across stderr chunks are redacted in logs and returned output', async () => {
  const f=fixture('secret');
  try {
    const result=await runCodexGoal(f.opts);
    assert.equal(result.exitCode,0);
    const log=readFileSync(f.opts.logPath,'utf8');
    assert.ok(!log.includes(f.opts.env.TEST_API_KEY)); assert.ok(!result.stderr.includes(f.opts.env.TEST_API_KEY));
    assert.match(log,/token=\[REDACTED\]/);
  } finally { f.clean(); }
});

test('startup failures and invalid goal options terminate without launching a task', async () => {
  const f=fixture('complete');
  try {
    const result=await runCodexGoal({...f.opts,executable:path.join(f.root,'missing')});
    assert.equal(result.exitCode,1); assert.match(result.stderr,/Cannot start/);
    await assert.rejects(runCodexGoal({...f.opts,prompt:' '}),/1–4000/);
    await assert.rejects(runCodexGoal({...f.opts,tokenBudget:0}),/positive safe integer/);
    await assert.rejects(runCodexGoal({...f.opts,timeoutMs:0}),/timer-safe/);
    assert.ok(!existsSync(path.join(f.root,'requests.json')));
  } finally { f.clean(); }
});

test('native goal argv only permits app-server configuration flags', () => {
  assert.deepEqual(buildCodexGoalArgv('codex',['--config=model="example"','--disable','other','--strict-config']),
    ['codex','app-server','--config=model="example"','--disable','other','--strict-config','--enable','goals','--stdio']);
  for(const args of [['--model','x'],['--listen','ws://0.0.0.0:9'],['--'],['--disable','goals'],['--config','features.goals=false'],['-c','features={goals=false}'],['--enable'],['--config','broken']]) {
    assert.throws(()=>validateCodexGoalNativeArgs(args));
  }
});


test('completed goals kill surviving descendants even after the server exits first', { skip: process.platform === 'win32' }, async () => {
  const f = fixture('orphan-on-complete');
  let workerPid: number | undefined;
  try {
    const result = await runCodexGoal({ ...f.opts, timeoutMs: 5000 });
    assert.equal(result.exitCode, 0);
    assert.equal(result.goalStatus, 'complete');
    workerPid = Number(readFileSync(path.join(f.root, 'worker.pid'), 'utf8'));
    let alive = true;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { process.kill(workerPid, 0); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
        alive = false;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(alive, false, 'goal returned while its SIGTERM-resistant worker survived');
  } finally {
    if (workerPid) { try { process.kill(workerPid, 'SIGKILL'); } catch { /* already cleaned up */ } }
    f.clean();
  }
});
