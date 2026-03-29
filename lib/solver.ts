export const MIN_LEN = 3;

// ------------------ MODES (MASKS) ------------------
export type MaskCell = 0 | null;

export interface Mode {
  mask: MaskCell[][];
}

export const MODES: Record<string, Mode> = {
  "Square 4×4": {
    mask: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  "Square 5×5": {
    mask: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  "Circle Shape (Cross 5×5)": {
    mask: [
      [null, 0, 0, 0, null],
      [0, 0, 0, 0, 0],
      [0, 0, null, 0, 0],
      [0, 0, 0, 0, 0],
      [null, 0, 0, 0, null],
    ],
  },
  "X Shape (Notched 5×5)": {
    mask: [
      [0, 0, null, 0, 0],
      [0, 0, 0, 0, 0],
      [null, 0, 0, 0, null],
      [0, 0, 0, 0, 0],
      [0, 0, null, 0, 0],
    ],
  },
};

export type Grid = (string | null)[][];

export function buildSlotsFromMask(mask: MaskCell[][]): [number, number][] {
  const slots: [number, number][] = [];
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[0].length; c++) {
      if (mask[r][c] !== null) slots.push([r, c]);
    }
  }
  return slots;
}

// ------------------ TRIE ------------------
export class TrieNode {
  children = new Map<string, TrieNode>();
  end = false;
}

export function buildTrie(words: string[]): TrieNode {
  const root = new TrieNode();
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.end = true;
  }
  return root;
}

export async function loadTrie(): Promise<TrieNode> {
  const resp = await fetch("/wordlist.txt");
  if (!resp.ok) throw new Error("Missing wordlist.txt");
  const text = await resp.text();

  const words = text
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= MIN_LEN)
    .filter((w) => /^[a-z]+$/.test(w));

  return buildTrie(words);
}

// ------------------ INPUT PARSING ------------------
export function parseLettersSequence(str: string): string[] {
  const cleaned = str.trim();
  if (!cleaned) return [];

  let parts: string[];
  if (cleaned.includes(" ")) parts = cleaned.split(/\s+/);
  else if (cleaned.includes(",")) parts = cleaned.split(/,+/);
  else parts = cleaned.split("");

  return parts
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .map((x) => x[0])
    .filter((ch) => /^[a-z]$/.test(ch));
}

export function parseGridText(text: string): Grid {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const grid: string[][] = lines.map((line) => {
    const tokens = line.includes(" ") ? line.split(/\s+/) : line.split("");
    return tokens.map((t) => t.trim().toLowerCase());
  });

  const w = Math.max(...grid.map((r) => r.length));
  for (const r of grid) while (r.length < w) r.push("#");

  return grid;
}

export function gridFromModeAndLetters(
  modeKey: string,
  lettersArr: string[]
): { grid: Grid; slotCount: number } {
  const mask = MODES[modeKey].mask;
  const H = mask.length;
  const W = mask[0].length;

  const grid: Grid = Array.from({ length: H }, () => Array(W).fill("#"));
  const slots = buildSlotsFromMask(mask);

  for (let i = 0; i < slots.length; i++) {
    const [r, c] = slots[i];
    grid[r][c] = lettersArr[i] ?? "?";
  }

  return { grid, slotCount: slots.length };
}

// ------------------ SOLVER ------------------
export interface WordResult {
  word: string;
  path: [number, number][];
  score: number;
}

function getDirs(kind: number): [number, number][] {
  if (kind === 4)
    return [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
  return [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
}

export function scoreWord(word: string): number {
  const L = word.length;
  if (L <= 2) return 0;
  if (L === 3) return 200;
  if (L === 4) return 400;
  if (L === 5) return 800;
  if (L === 6) return 1400;
  if (L === 7) return 1800;
  return 1800 + (L - 7) * 400;
}

export function solveGrid(
  grid: Grid,
  trieRoot: TrieNode,
  minLen: number,
  adjacencyKind: number
): WordResult[] {
  const H = grid.length;
  const W = grid[0].length;
  const used = Array.from({ length: H }, () => Array(W).fill(false));
  const DIRS = getDirs(adjacencyKind);

  const found = new Map<string, WordResult>();
  const pathStack: [number, number][] = [];

  function dfs(r: number, c: number, node: TrieNode, built: string) {
    const ch = grid[r][c];
    if (!ch || !/^[a-z]$/.test(ch)) return;

    const next = node.children.get(ch);
    if (!next) return;

    used[r][c] = true;
    pathStack.push([r, c]);

    const word = built + ch;

    if (next.end && word.length >= minLen && !found.has(word)) {
      found.set(word, {
        word,
        path: pathStack.slice() as [number, number][],
        score: scoreWord(word),
      });
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
      if (used[nr][nc]) continue;
      if (grid[nr][nc] === "#" || grid[nr][nc] === null) continue;
      dfs(nr, nc, next, word);
    }

    pathStack.pop();
    used[r][c] = false;
  }

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c] === "#" || grid[r][c] === null) continue;
      dfs(r, c, trieRoot, "");
    }
  }

  return [...found.values()];
}

// ------------------ GROUPING ------------------
export type SortMode = "length" | "score";

export interface Bucket {
  keyLabel: string;
  keyValue: number;
  words: WordResult[];
}

export function groupIntoBuckets(items: WordResult[], sortMode: SortMode): Bucket[] {
  if (sortMode === "score") {
    const map = new Map<number, WordResult[]>();
    for (const it of items) {
      if (!map.has(it.score)) map.set(it.score, []);
      map.get(it.score)!.push(it);
    }
    return [...map.entries()]
      .map(([score, words]) => ({
        keyLabel: `Word scoring ${score}`,
        keyValue: score,
        words: words.sort((a, b) => a.word.localeCompare(b.word)),
      }))
      .sort((a, b) => b.keyValue - a.keyValue);
  }

  const map = new Map<number, WordResult[]>();
  for (const it of items) {
    const L = it.word.length;
    if (!map.has(L)) map.set(L, []);
    map.get(L)!.push(it);
  }
  return [...map.entries()]
    .map(([len, words]) => ({
      keyLabel: `Length ${len}`,
      keyValue: len,
      words: words.sort((a, b) => a.word.localeCompare(b.word)),
    }))
    .sort((a, b) => b.keyValue - a.keyValue);
}
