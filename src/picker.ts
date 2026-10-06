import { emitKeypressEvents } from "node:readline";

/**
 * Minimal terminal multi-select. Rendering goes to stderr so stdout stays reserved for JSON output.
 * Key handling is a pure reducer so it can be tested without a TTY.
 */
export interface PickerItem {
  key: string;
  label: string;
  group: string;
  hint?: string;
}

export interface PickerState {
  items: PickerItem[];
  selected: Set<string>;
  cursor: number;
  filter: string;
  done?: "confirm" | "cancel";
}

export interface Key {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  sequence?: string;
}

export function initialState(items: PickerItem[], preselected: string[] = []): PickerState {
  return { items, selected: new Set(preselected), cursor: 0, filter: "" };
}

export function visibleItems(state: PickerState): PickerItem[] {
  const query = state.filter.toLowerCase();
  if (query === "") return state.items;
  return state.items.filter((item) => item.label.toLowerCase().includes(query) || item.group.toLowerCase().includes(query));
}

/** Selects every item when any is unselected, otherwise clears them all. */
function toggleAll(selected: Set<string>, items: PickerItem[]): Set<string> {
  const next = new Set(selected);
  const allOn = items.length > 0 && items.every((item) => next.has(item.key));
  for (const item of items) {
    if (allOn) next.delete(item.key);
    else next.add(item.key);
  }
  return next;
}

export function reduce(state: PickerState, key: Key): PickerState {
  const visible = visibleItems(state);
  const current = visible[state.cursor];
  const move = (delta: number): PickerState => ({ ...state, cursor: Math.max(0, Math.min(visible.length - 1, state.cursor + delta)) });
  if (key.ctrl && key.name === "c") return { ...state, done: "cancel" };
  if (key.ctrl && key.name === "a") return { ...state, selected: toggleAll(state.selected, visible) };
  switch (key.name) {
    case "up": return move(-1);
    case "down": return move(1);
    case "pageup": return move(-10);
    case "pagedown": return move(10);
    case "return":
    case "enter": return { ...state, done: "confirm" };
    case "escape": return state.filter ? { ...state, filter: "", cursor: 0 } : { ...state, done: "cancel" };
    case "backspace": return { ...state, filter: state.filter.slice(0, -1), cursor: 0 };
    case "space": return current ? { ...state, selected: toggleAll(state.selected, [current]) } : state;
    case "tab": return current ? { ...state, selected: toggleAll(state.selected, visible.filter((item) => item.group === current.group)) } : state;
  }
  const char = key.sequence;
  if (!key.ctrl && !key.meta && char !== undefined && char.length === 1 && char >= "!" && char !== "\x7f") {
    return { ...state, filter: state.filter + char, cursor: 0 };
  }
  return state;
}

const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

export function render(state: PickerState, title: string, height: number, width = 120): string[] {
  const visible = visibleItems(state);
  const lines = [
    `${BOLD}${title}${RESET} ${DIM}↑↓ move · space toggle · tab toggle repo · ctrl+a toggle all shown · type to filter · enter confirm · esc cancel${RESET}`,
    `filter: ${state.filter || `${DIM}(none)${RESET}`}   ${state.selected.size} selected / ${state.items.length}`,
  ];
  const rows = Math.max(3, height - lines.length);
  const start = Math.max(0, Math.min(state.cursor - Math.floor(rows / 2), visible.length - rows));
  for (let i = start; i < Math.min(visible.length, start + rows); i += 1) {
    const item = visible[i];
    const pointer = i === state.cursor ? "›" : " ";
    const box = state.selected.has(item.key) ? "[x]" : "[ ]";
    const head = `${pointer} ${box} ${item.label}  `;
    const meta = [item.group, item.hint].filter(Boolean).join(" · ").slice(0, Math.max(0, width - head.length));
    lines.push(`${head}${DIM}${meta}${RESET}`);
  }
  if (visible.length === 0) lines.push(`${DIM}  no match${RESET}`);
  return lines;
}

/** Returns the selected keys in item order, or null when the user cancels. */
export function pickMany(title: string, items: PickerItem[], preselected: string[] = []): Promise<string[] | null> {
  const input = process.stdin;
  const output = process.stderr;
  return new Promise((resolve) => {
    let state = initialState(items, preselected);
    let drawn = 0;
    const draw = (): void => {
      const lines = render(state, title, (output.rows ?? 24) - 1, (output.columns ?? 120) - 1);
      output.write(`${drawn ? `\x1b[${drawn}F` : ""}\x1b[J${lines.join("\n")}\n`);
      drawn = lines.length;
    };
    const onKey = (_: string | undefined, key: Key | undefined): void => {
      state = reduce(state, key ?? {});
      if (!state.done) {
        draw();
        return;
      }
      input.off("keypress", onKey);
      input.setRawMode(false);
      input.pause();
      output.write(`\x1b[${drawn}F\x1b[J\x1b[?25h`);
      resolve(state.done === "confirm" ? state.items.filter((item) => state.selected.has(item.key)).map((item) => item.key) : null);
    };
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKey);
    output.write("\x1b[?25l");
    draw();
  });
}
