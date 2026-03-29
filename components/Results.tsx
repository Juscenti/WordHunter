"use client";

import { groupIntoBuckets } from "@/lib/solver";
import type { WordResult, SortMode } from "@/lib/solver";

interface ResultsProps {
  results: WordResult[];
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onWordHover: (path: [number, number][] | null) => void;
  onWordClick: (path: [number, number][]) => void;
}

export default function Results({
  results,
  sortMode,
  onSortChange,
  onWordHover,
  onWordClick,
}: ResultsProps) {
  const buckets = groupIntoBuckets(results, sortMode);

  return (
    <div className="panel resultsPanel">
      <div className="toolbar">
        <div className="muted">
          Words found: <b>{results.length}</b>
        </div>
        <div className="toggleGroup">
          <span className="small">
            <b>Sort / Group by:</b>
          </span>
          <button
            className={`toggleBtn${sortMode === "length" ? " toggleBtnActive" : ""}`}
            type="button"
            onClick={() => onSortChange("length")}
          >
            LENGTH
          </button>
          <button
            className={`toggleBtn${sortMode === "score" ? " toggleBtnActive" : ""}`}
            type="button"
            onClick={() => onSortChange("score")}
          >
            SCORE
          </button>
        </div>
      </div>

      <div>
        {buckets.map((b) => (
          <div key={b.keyValue} className="bucket">
            <div className="bucketHeader">
              <span>{b.keyLabel}</span>
              <span className="small">{b.words.length} words</span>
            </div>
            <div className="bucketBody">
              {b.words.map((it) => (
                <div
                  key={it.word}
                  className="chip"
                  tabIndex={0}
                  role="button"
                  onMouseEnter={() => onWordHover(it.path)}
                  onMouseLeave={() => onWordHover(null)}
                  onClick={() => onWordClick(it.path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      onWordClick(it.path);
                  }}
                >
                  <span>{it.word.toUpperCase()}</span>
                  <span className="chipScore">{it.score}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
