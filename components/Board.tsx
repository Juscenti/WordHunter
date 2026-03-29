"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Grid } from "@/lib/solver";

interface BoardProps {
  grid: Grid;
  highlightedPath: [number, number][] | null;
}

export default function Board({ grid, highlightedPath }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const overlayLineRef = useRef<SVGPolylineElement>(null);

  const H = grid.length;
  const W = grid[0]?.length ?? 0;

  const updateOverlay = useCallback(() => {
    const boardEl = boardRef.current;
    const line = overlayLineRef.current;
    if (!boardEl || !line) return;

    if (!highlightedPath || highlightedPath.length === 0) {
      line.setAttribute("opacity", "0");
      return;
    }

    const rect = boardEl.getBoundingClientRect();
    const points = highlightedPath
      .map(([r, c]) => {
        const cell = boardEl.querySelector<HTMLElement>(
          `[data-r="${r}"][data-c="${c}"]`
        );
        if (!cell) return null;
        const cr = cell.getBoundingClientRect();
        const cx = cr.left + cr.width / 2 - rect.left;
        const cy = cr.top + cr.height / 2 - rect.top;
        const x = (cx / rect.width) * 100;
        const y = (cy / rect.height) * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .filter(Boolean) as string[];

    if (points.length >= 2) {
      line.setAttribute("points", points.join(" "));
      line.setAttribute("opacity", "1");
    } else {
      line.setAttribute("opacity", "0");
    }
  }, [highlightedPath]);

  useEffect(() => {
    updateOverlay();
  }, [updateOverlay]);

  return (
    <div className="boardWrap">
      <div
        ref={boardRef}
        className="board"
        aria-label="board"
        style={{ gridTemplateColumns: `repeat(${W}, 46px)` }}
      >
        {Array.from({ length: H }, (_, r) =>
          Array.from({ length: W }, (_, c) => {
            const val = grid[r]?.[c];
            const isBlocked = val === "#" || val === null;
            const isHit =
              highlightedPath?.some(([pr, pc]) => pr === r && pc === c) ??
              false;
            const isStart =
              isHit &&
              highlightedPath?.[0]?.[0] === r &&
              highlightedPath?.[0]?.[1] === c;

            let className = "cell";
            if (isBlocked) className += " blocked";
            if (isHit) className += " hit";
            if (isStart) className += " hitStart";

            return (
              <div
                key={`${r}-${c}`}
                className={className}
                data-r={r}
                data-c={c}
              >
                {isBlocked ? "·" : String(val).toUpperCase()}
              </div>
            );
          })
        )}

        <svg
          className="overlay"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            ref={overlayLineRef}
            fill="none"
            stroke="#ffb400"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0"
          />
        </svg>
      </div>
    </div>
  );
}
