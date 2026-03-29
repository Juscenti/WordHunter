"use client";

import { useState, useRef, useCallback } from "react";
import Board from "./Board";
import Results from "./Results";
import {
  MODES,
  MIN_LEN,
  loadTrie,
  parseLettersSequence,
  parseGridText,
  gridFromModeAndLetters,
  solveGrid,
  buildSlotsFromMask,
} from "@/lib/solver";
import type { TrieNode, Grid, WordResult, SortMode } from "@/lib/solver";

const MODE_KEYS = Object.keys(MODES);
const DEFAULT_MODE = MODE_KEYS[0];

const EXAMPLE_1 = {
  mode: "Circle Shape (Cross 5×5)",
  letters: "N V R L D W H N S I A L D O S O I H T E",
};
const EXAMPLE_2 = {
  mode: "X Shape (Notched 5×5)",
  letters: "O U S N L F U N F I G H A R R D H E O D E",
};

function computeGrid(
  modeKey: string,
  lettersStr: string,
  boardRaw: string
): { grid: Grid; slotCount: number } {
  if (boardRaw.trim().length > 0) {
    const grid = parseGridText(boardRaw);
    const slotCount = grid.flat().filter((v) => v !== "#" && v !== null).length;
    return { grid, slotCount };
  }
  const lettersArr = parseLettersSequence(lettersStr);
  return gridFromModeAndLetters(modeKey, lettersArr);
}

export default function WordHuntSolver() {
  const [mode, setMode] = useState<string>(DEFAULT_MODE);
  const [letters, setLetters] = useState("");
  const [boardRaw, setBoardRaw] = useState("");
  const [adjacency, setAdjacency] = useState<8 | 4>(8);
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [results, setResults] = useState<WordResult[]>([]);
  const [highlightedPath, setHighlightedPath] = useState<
    [number, number][] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const trieRef = useRef<TrieNode | null>(null);

  const { grid, slotCount } = computeGrid(mode, letters, boardRaw);

  const ensureTrie = useCallback(async () => {
    if (trieRef.current) return trieRef.current;
    setIsLoading(true);
    try {
      const trie = await loadTrie();
      trieRef.current = trie;
      return trie;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSolve = async () => {
    const trie = await ensureTrie();
    const found = solveGrid(grid, trie, MIN_LEN, adjacency);
    setResults(found);
    setHighlightedPath(null);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setLetters("");
    setBoardRaw("");
    setResults([]);
    setHighlightedPath(null);
  };

  const handleLettersChange = (val: string) => {
    setLetters(val);
    setBoardRaw("");
    setHighlightedPath(null);
  };

  const handleBoardRawChange = (val: string) => {
    setBoardRaw(val);
    setHighlightedPath(null);
  };

  const handleClear = () => {
    setLetters("");
    setBoardRaw("");
    setResults([]);
    setHighlightedPath(null);
  };

  const handleClearHighlight = () => setHighlightedPath(null);

  const handleExample = (ex: { mode: string; letters: string }) => {
    setMode(ex.mode);
    setLetters(ex.letters);
    setBoardRaw("");
    setResults([]);
    setHighlightedPath(null);
  };

  const modeSlotCount = boardRaw.trim()
    ? slotCount
    : buildSlotsFromMask(MODES[mode].mask).length;

  return (
    <>
      <h1>Word Hunt Solver</h1>
      <p className="muted">
        Modes define the shape. You can fill by slot order (1..N) or paste a
        raw grid using <b>#</b> for void. Hover a result to see its path drawn
        on the board.
      </p>

      <div className="row">
        <div className="panel">
          <label htmlFor="mode">Mode</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value)}
          >
            {MODE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <div className="meta">
            <div className="pill">
              Slots: <b>{modeSlotCount}</b>
            </div>
            <div className="pill">
              Min length: <b>{MIN_LEN}</b>
            </div>
          </div>

          <label htmlFor="adj">Adjacency</label>
          <select
            id="adj"
            value={adjacency}
            onChange={(e) => setAdjacency(Number(e.target.value) as 8 | 4)}
          >
            <option value={8}>8-direction (includes diagonals)</option>
            <option value={4}>4-direction (no diagonals)</option>
          </select>

          <label htmlFor="letters">Letters (fills slots 1..N in order)</label>
          <input
            id="letters"
            placeholder="Example: N V R L D W H N S I A L D O S O I H T E"
            value={letters}
            onChange={(e) => handleLettersChange(e.target.value)}
          />

          <div className="btnrow">
            <button
              className="solveBtn"
              onClick={handleSolve}
              disabled={isLoading}
            >
              {isLoading ? "Loading dictionary…" : "Solve"}
            </button>
            <button type="button" onClick={() => handleExample(EXAMPLE_1)}>
              Load Example: Image #1
            </button>
            <button type="button" onClick={() => handleExample(EXAMPLE_2)}>
              Load Example: Image #2
            </button>
            <button type="button" onClick={handleClearHighlight}>
              Clear highlight
            </button>
            <button type="button" onClick={handleClear}>
              Clear
            </button>
          </div>

          <Board grid={grid} highlightedPath={highlightedPath} />

          <label htmlFor="boardInput">
            Advanced: raw grid input (use # for void)
          </label>
          <textarea
            id="boardInput"
            spellCheck={false}
            placeholder={`# a b c #\nd e f g h\ni # j k l\nm n o p q\n# r s t #`}
            value={boardRaw}
            onChange={(e) => handleBoardRawChange(e.target.value)}
          />
          <div className="muted">
            If you type here, it overrides &quot;Letters&quot;.
          </div>
        </div>

        <Results
          results={results}
          sortMode={sortMode}
          onSortChange={setSortMode}
          onWordHover={setHighlightedPath}
          onWordClick={setHighlightedPath}
        />
      </div>
    </>
  );
}
