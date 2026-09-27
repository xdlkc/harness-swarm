"""配乐合成：五声调式，乐器随年代演进，节拍严格取自拍点网格（帧 × 1470 = 采样点）。

用法：python3 music.py  →  out/music.wav
"""
import os
import wave

import numpy as np
import scipy.signal as sg

import timeline as TL

SR = TL.SR
SPF = TL.SPF
OFF = [0, 2, 4, 7, 9]
RNG = np.random.default_rng(2026)


def hz(n, base=261.63):
    o, d = divmod(int(n), 5)
    return base * 2 ** ((12 * o + OFF[d]) / 12)


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def lp(x, fc, order=2):
    b, a = sg.butter(order, min(0.99, fc / (SR / 2)))
    return sg.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = sg.butter(order, fc / (SR / 2), "high")
    return sg.lfilter(b, a, x)


def bp(x, f0, f1, order=2):
    b, a = sg.butter(order, [f0 / (SR / 2), min(0.99, f1 / (SR / 2))], "band")
    return sg.lfilter(b, a, x)


def ar_env(t, dur, a, r):
    e = np.clip(t / a, 0, 1)
    e *= np.where(t < dur, 1.0, np.exp(-(t - dur) / r))
    return e


def noise(n):
    return RNG.standard_normal(n)


# ------------------------------------------------------------ 乐器

def flute(f, dur, vel, breath=0.2, scoop=0.0, vib=0.006, bright=0.22):
    t = tt(dur + 0.5)
    v = 1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    v *= 1 - scoop * np.exp(-t / 0.07)
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    tone = np.sin(ph) + bright * np.sin(2 * ph) + 0.3 * bright * np.sin(3 * ph)
    nz = bp(noise(len(t)), f * 0.7, f * 3.5) * 1.8
    e = ar_env(t, dur, 0.07, 0.14)
    return (tone * (1 - breath) + nz * breath) * e * vel


def bone_flute(f, dur, vel):
    return flute(f, dur, vel, breath=0.34, scoop=0.03, vib=0.009, bright=0.12)


def xun(f, dur, vel):
    t = tt(dur + 0.6)
    ph = 2 * np.pi * f * t
    tone = np.sin(ph) + 0.08 * np.sin(3 * ph)
    nz = bp(noise(len(t)), f * 0.8, f * 2.2) * 1.2
    return (tone * 0.75 + nz * 0.25) * ar_env(t, dur, 0.18, 0.3) * vel


def xiao(f, dur, vel):
    return flute(f, dur, vel, breath=0.26, vib=0.005, bright=0.1)


def dizi(f, dur, vel):
    base = flute(f, dur, vel, breath=0.1, vib=0.008, bright=0.45)
    t = np.arange(len(base)) / SR
    buzz = hp(np.sign(np.sin(2 * np.pi * f * t)) * 0.08, 3000) * ar_env(t, dur, 0.05, 0.1) * vel
    return base + buzz[:len(base)]


def bell(f, vel, ring=4.5):
    t = tt(ring)
    parts = [(0.5, 0.35, 3.2), (1.0, 1.0, 2.4), (1.19, 0.55, 2.0), (2.0, 0.35, 1.3), (2.76, 0.32, 0.9),
             (3.9, 0.16, 0.55), (5.4, 0.1, 0.3)]
    y = np.zeros_like(t)
    for r, a, tau in parts:
        y += a * np.sin(2 * np.pi * f * r * t * (1 + 0.0007 * RNG.standard_normal())) * np.exp(-t / tau)
    click = lp(noise(len(t)), 3000) * np.exp(-t / 0.006) * 0.6
    return (y + click) * vel * 0.5


def qing(f, vel, ring=2.0):
    t = tt(ring)
    y = np.zeros_like(t)
    for r, a, tau in [(1, 1, 1.0), (2.32, 0.5, 0.5), (4.25, 0.3, 0.28), (6.63, 0.15, 0.15)]:
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau)
    return (y + bp(noise(len(t)), 1500, 6000) * np.exp(-t / 0.01) * 0.4) * vel * 0.55


def pluck(f, dur, vel, decay=1.6, bright=1.0, pos=0.18, maxh=24, slide=0.0, trem=0.0, B=0.0002):
    ring = min(4.0, dur + decay * 2.2)
    t = tt(ring)
    fm = 2 ** (slide / 12 * (1 - np.exp(-np.maximum(t - 0.12, 0) / 0.09)))
    ph = 2 * np.pi * np.cumsum(f * fm) / SR
    y = np.zeros_like(t)
    for k in range(1, maxh + 1):
        if f * k > 9000:
            break
        a = abs(np.sin(np.pi * k * pos)) / k ** 0.9
        tau = decay / (1 + bright * 0.35 * (k - 1))
        y += a * np.sin(k * np.sqrt(1 + B * k * k) * ph) * np.exp(-t / tau)
    if trem > 0:
        m = np.exp(-(t % (1 / trem)) / 0.045)
        y *= np.where(t < dur, 0.5 + 0.5 * m, 1.0)
    y *= np.where(t < dur + 0.05, 1.0, np.exp(-(t - dur - 0.05) / (decay * 0.8)))
    y += bp(noise(len(t)), 1200, 7000) * np.exp(-t / 0.004) * 0.25 * bright
    return y * vel * 0.6


def guqin(f, dur, vel):
    return pluck(f, dur, vel, decay=2.4, bright=0.5, pos=0.12, slide=RNG.choice([0, 0, 0, 2, -1]), B=0.0001)


def ruan(f, dur, vel):
    return pluck(f, dur, vel, decay=0.9, bright=0.8, pos=0.2)


def pipa(f, dur, vel):
    return pluck(f, dur, vel, decay=0.7, bright=1.6, pos=0.14, trem=12 if dur >= 0.6 else 0)


def zheng(f, dur, vel):
    return pluck(f, dur, vel, decay=1.3, bright=1.1, pos=0.16, slide=RNG.choice([0, 0, 0, 0, 1]))


def erhu(f, dur, vel):
    t = tt(dur + 0.3)
    v = 1 + 0.011 * np.sin(2 * np.pi * 6 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    v *= 2 ** (-1 / 12 * np.exp(-t / 0.05))
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    y = np.zeros_like(t)
    for k in range(1, 16):
        fk = f * k
        if fk > 8000:
            break
        form = 1 + 1.6 * np.exp(-((fk - 1000) / 380) ** 2) + 0.9 * np.exp(-((fk - 2600) / 600) ** 2)
        y += form / k * np.sin(k * ph)
    y += bp(noise(len(t)), 2000, 6000) * 0.05
    return y * ar_env(t, dur, 0.07, 0.1) * vel * 0.35


def strings(f, dur, vel, att=0.3):
    t = tt(dur + 0.6)
    y = np.zeros_like(t)
    for c in (-7, -2, 3, 8):
        fc = f * 2 ** (c / 1200)
        v = 1 + 0.004 * np.sin(2 * np.pi * (4.8 + RNG.random()) * t + RNG.random() * 6)
        ph = 2 * np.pi * np.cumsum(fc * v) / SR
        for k in range(1, 14):
            if fc * k > 9000:
                break
            y += np.sin(k * ph) / k ** 1.15
    y = lp(y, 5000)
    return y * ar_env(t, dur, att, 0.45) * vel * 0.12


def brass(f, dur, vel):
    t = tt(dur + 0.3)
    e = ar_env(t, dur, 0.06, 0.15)
    v = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.3) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    y = np.zeros_like(t)
    for k in range(1, 13):
        if f * k > 8000:
            break
        y += np.sin(k * ph) / k * e ** (0.5 + 0.28 * k)
    return y * vel * 0.4


def timpani(f, vel):
    t = tt(2.2)
    fm = 1 + 0.02 * np.exp(-t / 0.1)
    y = np.zeros_like(t)
    for r, a, tau in [(1, 1, 1.1), (1.5, 0.5, 0.6), (1.99, 0.35, 0.45), (2.44, 0.2, 0.3)]:
        y += a * np.sin(2 * np.pi * np.cumsum(f * r * fm) / SR) * np.exp(-t / tau)
    y += lp(noise(len(t)), 900) * np.exp(-t / 0.03) * 0.6
    return y * vel * 0.7


def drum(vel, f0=95, f1=48, tau=0.5):
    t = tt(tau * 5)
    f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    y += lp(noise(len(t)), 700) * np.exp(-t / 0.04) * 0.5
    return y * vel


def small_drum(vel):
    t = tt(0.5)
    f = 150 + 120 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.1)
    y += bp(noise(len(t)), 800, 4000) * np.exp(-t / 0.03) * 0.6
    return y * vel * 0.6


def wood(vel, f=1450):
    t = tt(0.25)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.025) + bp(noise(len(t)), 1000, 5000) * np.exp(-t / 0.01) * 0.5
    return y * vel * 0.6


def gong(vel, f=140):
    t = tt(4.5)
    y = np.zeros_like(t)
    bend = 1 - 0.03 * (1 - np.exp(-t / 0.8))
    for r, a, tau in [(1, 1, 2.8), (1.47, 0.6, 2.2), (2.09, 0.5, 1.8), (2.56, 0.35, 1.4), (3.12, 0.3, 1.1), (3.8, 0.2, 0.9),
                      (4.6, 0.15, 0.7)]:
        y += a * np.sin(2 * np.pi * np.cumsum(f * r * bend) / SR) * np.exp(-t / tau)
    y += hp(noise(len(t)), 2500) * np.exp(-t / 1.0) * 0.12
    return y * vel * 0.45


def cymbal(vel, tau=1.1):
    t = tt(tau * 4)
    y = hp(noise(len(t)), 4500) * np.exp(-t / tau)
    y *= 1 + 0.3 * np.sin(2 * np.pi * 437 * t)
    return y * vel * 0.35


def swell(sec, vel):
    t = tt(sec)
    return hp(noise(len(t)), 3000) * (t / sec) ** 3 * vel * 0.3


def wind(sec, vel):
    t = tt(sec)
    m = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    return bp(noise(len(t)), 300, 1400) * m * vel * np.clip(t / 1.5, 0, 1) * np.clip((sec - t) / 1.5, 0, 1)


# ------------------------------------------------------------ 编曲

RHY = [
    [2, 1, 1, 3, 1],
    [1, 1, 2, 1, 1, 2],
    [1, .5, .5, 1, 1, 1, .5, .5, 2],
    [1.5, .5, 1, 1, 1.5, .5, 2],
    [1, 1, .5, .5, 1, 1, 1, 2],
    [.5, .5, 1, .5, .5, 1, .5, .5, .5, .5, 2],
    [.5, .5, .5, .5, 1, 1, .5, .5, .5, .5, 2],
    [.75, .25, .5, .5, 1, .75, .25, .5, .5, 1, 2],
    [1.5, .5, 1, 1, 1.5, .5, 2],
]
PROG = [[0, 3], [0, -2], [3, 0], [-1, 0], [2, 3], [0, -1]]

LEAD = [(bone_flute, 5, 0.55), (lambda f, d, v: bell(f, v, 3.5), 0, 0.8), (guqin, -5, 0.95), (xiao, 0, 0.55),
        (guqin, 0, 0.85), (pipa, 0, 0.9), (dizi, 5, 0.42), (erhu, 0, 0.8), (brass, -5, 0.55)]


class Mix:
    def __init__(self, n):
        self.L = np.zeros(n, np.float64)
        self.R = np.zeros(n, np.float64)
        self.count = 0

    def add(self, sig, s0, pan=0.0, gain=1.0):
        s0 = int(round(s0))
        if s0 < 0:
            sig = sig[-s0:]
            s0 = 0
        n = min(len(sig), len(self.L) - s0)
        if n <= 0:
            return
        gl = np.cos((pan + 1) * np.pi / 4) * gain * 1.414
        gr = np.sin((pan + 1) * np.pi / 4) * gain * 1.414
        self.L[s0:s0 + n] += sig[:n] * gl
        self.R[s0:s0 + n] += sig[:n] * gr
        self.count += 1


def melody(vi, seed, T, nbeats=8, rhythm=None):
    rng = np.random.default_rng(seed)
    rhythm = list(rhythm or RHY[vi])
    if seed % 2:
        acc = np.cumsum(rhythm)
        if 4 in acc:
            k = int(np.where(acc == 4)[0][0]) + 1
            rhythm = rhythm[k:] + rhythm[:k]
            if rhythm[-1] < 1:
                rhythm = list(RHY[vi])
    prog = PROG[seed % len(PROG)]
    n = T + int(rng.choice([0, 2, 3]))
    out = []
    b = 0.0
    for i, d in enumerate(rhythm):
        root = T + prog[min(1, int(b // 4))]
        if i == len(rhythm) - 1:
            n = T if abs(n - T) <= abs(n - T - 5) else T + 5
        elif b == int(b) and int(b) % 2 == 0:
            cands = [root + k for k in (-5, -3, -2, 0, 2, 3, 5)]
            n = min(cands, key=lambda c: abs(c - n) + rng.random() * 1.5)
        else:
            n += int(rng.choice([-2, -1, -1, 1, 1, 2]))
        n = int(np.clip(n, T - 3, T + 7))
        out.append((b, d, n))
        b += d
    return out, prog


def compose(grid):
    total = grid["total_frames"] * SPF + SR * 6
    mx = Mix(total)
    segs = grid["segments"]

    def s_at(seg, beat):
        return (seg["start"] + beat * seg["fpb"]) * SPF

    for seg in segs:
        vi = seg["vol"]
        v = TL.VOLUMES[vi]
        T = v["mode"]
        bs = seg["fpb"] / TL.FPS
        kind = seg["kind"]

        if seg["impact"]:
            nv = vi
            mx.add(drum(1.4, f0=75, f1=36, tau=0.9), s_at(seg, 0), 0, 1.0)
            mx.add(bell(hz(T - 10), 1.2, 5.0), s_at(seg, 0), -0.15, 0.9)
            mx.add(bell(hz(T - 5), 0.7, 4.0), s_at(seg, 0), 0.2, 0.6)
            if nv >= 4:
                mx.add(gong(1.0, f=120 + 10 * nv), s_at(seg, 0), 0.1, 0.8)
            if nv >= 8 or kind == "end":
                mx.add(cymbal(1.0, 1.6), s_at(seg, 0), 0, 0.8)
                mx.add(timpani(hz(T - 10) / 2, 1.2), s_at(seg, 0), 0, 0.8)
            prev_fpb = segs[seg["id"] - 1]["fpb"] if seg["id"] > 0 else seg["fpb"]
            sw = swell(prev_fpb / TL.FPS, 1.0)
            mx.add(sw, seg["start"] * SPF - len(sw), 0, 0.8)

        if kind == "open":
            mx.add(wind(8 * bs + 1, 0.25), 0, 0, 1)
            for b, d, n in [(1, 1.5, T + 5), (2.5, 0.5, T + 6), (3, 1, T + 8), (4, 2, T + 7), (6, 2, T + 5)]:
                mx.add(bone_flute(hz(n), d * bs, 0.55), s_at(seg, b), 0.1, 1)
            for b in (2, 4):
                mx.add(qing(hz(T + 5), 0.5), s_at(seg, b), -0.3, 0.7)
            mx.add(xun(hz(T - 5), 6 * bs, 0.35), s_at(seg, 2), -0.2, 1)
            continue

        if kind == "end":
            for n in (T - 10, T - 5, T - 3, T - 2, T, T + 2):
                mx.add(strings(hz(n), 9 * bs, 0.9, att=0.5), s_at(seg, 0), (n - T) / 20, 1)
            for b, n in ((2, T + 5), (4, T + 3), (6, T + 2), (8, T)):
                mx.add(bell(hz(n), 0.9, 5), s_at(seg, b), 0.15, 0.8)
            mx.add(brass(hz(T - 5), 7 * bs, 0.6), s_at(seg, 1), 0, 0.8)
            mx.add(gong(0.8, 110), s_at(seg, 8), 0, 0.7)
            mx.add(timpani(hz(T - 10) / 2, 0.8), s_at(seg, 8), 0, 0.8)
            continue

        lead_fn, loct, lgain = LEAD[vi]
        if kind == "card":
            for b, d, k in ((1, 1, 0), (2, 1, 3), (3, 1, 5)):
                mx.add(lead_fn(hz(T + k + loct), d * bs * 0.95, 0.7), s_at(seg, b), 0.1, lgain)
            continue

        # ---- 镜：旋律 + 伴奏 + 打击
        si = seg["shot"]
        mel, prog = melody(vi, seg["id"], T, seg["nbeats"])
        for b, d, n in mel:
            vel = 0.85 if b == int(b) else 0.65
            mx.add(lead_fn(hz(n + loct), d * bs * 0.95, vel), s_at(seg, 0) + b * bs * SR, 0.12, lgain)
        roots = [T + p for p in prog]
        g = v["shots"][si]["groups"]
        for k in range(len(g)):
            b = k + 1
            if vi < 3:
                mx.add(qing(hz(T + 10 - k * 2), 0.35), s_at(seg, b), -0.4, 0.6)
            elif vi < 7:
                mx.add(bell(hz(T + 10 - k * 2), 0.25, 2.0), s_at(seg, b), -0.4, 0.6)
            else:
                mx.add(bell(hz(T + 10 - k * 2), 0.35, 2.5), s_at(seg, b), -0.4, 0.55)

        for bar in range(seg["nbeats"] // 4):
            r = roots[min(bar, 1)]
            b0 = bar * 4
            S0 = lambda x: s_at(seg, 0) + (b0 + x) * bs * SR
            if vi == 0:
                mx.add(xun(hz(r - 5), 4 * bs * 0.98, 0.5), S0(0), -0.25, 0.9)
                mx.add(qing(hz(r), 0.5), S0(0), 0.3, 0.7)
                mx.add(wood(0.3, 900), S0(2), 0.3, 0.8)
            elif vi == 1:
                mx.add(qing(hz(r - 5), 0.8), S0(0), -0.3, 0.8)
                mx.add(drum(0.8), S0(0), 0, 0.8)
                mx.add(drum(0.45), S0(2), 0, 0.8)
            elif vi == 2:
                mx.add(bell(hz(r), 0.55, 3.0), S0(0), -0.35, 0.7)
                mx.add(drum(0.85), S0(0), 0, 0.8)
                mx.add(drum(0.5), S0(2), 0, 0.8)
                mx.add(small_drum(0.3), S0(3.5), 0.2, 0.8)
            elif vi == 3:
                for k, x in enumerate(range(4)):
                    mx.add(guqin(hz(r - 5 + [0, 2, 3, 2][k]), bs, 0.6), S0(x), -0.3, 0.7)
                mx.add(drum(0.9), S0(0), 0, 0.8)
                mx.add(drum(0.55), S0(2), 0, 0.8)
                mx.add(small_drum(0.3), S0(1.5), 0.2, 0.8)
                mx.add(small_drum(0.35), S0(3.5), 0.2, 0.8)
            elif vi == 4:
                for k in range(8):
                    mx.add(ruan(hz(r - 5 + [0, 2, 3, 5, 3, 2, 0, 2][k]), bs * 0.5, 0.55), S0(k / 2), -0.3, 0.7)
                mx.add(xiao(hz(r - 5), 4 * bs * 0.97, 0.3), S0(0), 0.35, 0.6)
                mx.add(drum(0.7), S0(0), 0, 0.8)
                mx.add(wood(0.3), S0(1), 0.3, 0.7)
                mx.add(wood(0.3), S0(3), 0.3, 0.7)
            elif vi == 5:
                if si % 2 == 0:
                    for b, d, n in mel:
                        if b0 <= b < b0 + 4:
                            mx.add(dizi(hz(n + 5), d * bs * 0.9, 0.4), s_at(seg, 0) + b * bs * SR, -0.3, 0.3)
                mx.add(drum(0.9), S0(0), 0, 0.8)
                for k in range(8):
                    mx.add(small_drum(0.22 + 0.18 * (k % 2 == 0)), S0(k / 2), 0.25, 0.8)
                mx.add(pluck(hz(r - 10), 4 * bs, 0.6, decay=1.2, bright=0.5), S0(0), -0.2, 0.6)
            elif vi == 6:
                for k in range(8):
                    mx.add(zheng(hz(r - 5 + [0, 2, 3, 5, 7, 5, 3, 2][k]), bs * 0.5, 0.5), S0(k / 2), -0.35, 0.6)
                mx.add(wood(0.6, 1700), S0(0), 0.3, 0.8)
                mx.add(wood(0.45, 1700), S0(2), 0.3, 0.8)
                mx.add(drum(0.6), S0(0), 0, 0.8)
                for k in (1, 3, 5, 7):
                    mx.add(small_drum(0.18), S0(k / 2), 0.2, 0.8)
            elif vi == 7:
                for k in range(8):
                    mx.add(pipa(hz(r - 5 + [0, 3, 2, 3, 0, 3, 5, 3][k]), bs * 0.3, 0.5), S0(k / 2), -0.35, 0.55)
                mx.add(drum(1.0), S0(0), 0, 0.8)
                mx.add(drum(0.6), S0(2), 0, 0.8)
                for k in range(8):
                    mx.add(small_drum(0.25), S0(k / 2), 0.2, 0.7)
                mx.add(cymbal(0.3, 0.35), S0(1), 0.3, 0.7)
                mx.add(cymbal(0.3, 0.35), S0(3), -0.3, 0.7)
                if bar == 0:
                    mx.add(gong(0.6, 170), S0(0), 0, 0.6)
            elif vi == 8:
                for n in (r - 10, r - 5, r - 3, r - 2):
                    mx.add(strings(hz(n), 4 * bs * 0.98, 0.7), S0(0), (n - r) / 20, 0.9)
                for b, d, n in mel:
                    if b0 <= b < b0 + 4:
                        mx.add(strings(hz(n + 5), d * bs * 0.95, 0.6, att=0.08), s_at(seg, 0) + b * bs * SR, -0.2, 0.7)
                for k in range(8):
                    mx.add(strings(hz(r - 5 + [0, 0, 3, 0, 2, 0, 3, 5][k]), bs * 0.3, 0.5, att=0.02), S0(k / 2), 0.3, 0.5)
                mx.add(timpani(hz(r - 10) / 2, 0.9), S0(0), 0, 0.8)
                mx.add(timpani(hz(r - 7) / 2, 0.6), S0(2), 0, 0.8)
                if bar == 0:
                    mx.add(cymbal(0.5, 1.2), S0(0), 0, 0.6)
                    mx.add(bell(hz(T), 0.6, 3.0), S0(0), 0.3, 0.6)
                for k in range(8):
                    mx.add(small_drum(0.1), S0(k / 2), 0.2, 0.6)
    return mx


def reverb(x, wet=0.22, tau=0.42, seed=0):
    rng = np.random.default_rng(seed)
    n = int(SR * 3.0)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t / tau)
    ir = lp(ir, 5500)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    return x + wet * sg.oaconvolve(x, ir)[: len(x)]


def main():
    grid = TL.build()
    assert not TL.validate(grid)
    mx = compose(grid)
    L = reverb(mx.L, seed=1)
    R = reverb(mx.R, seed=2)
    y = np.stack([L, R], 1)
    y = y[: grid["total_frames"] * SPF]
    y /= np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.6 * y) / np.tanh(1.6) * 0.93
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"), exist_ok=True)
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "music.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype("<i2").tobytes())
    print(f"配乐完成：{mx.count} 个音符/击打，{len(y) / SR:.2f} 秒 → {path}")


if __name__ == "__main__":
    main()
