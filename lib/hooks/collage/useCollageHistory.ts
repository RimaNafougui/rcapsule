import type { CanvasItem } from "./types";

import { useState, useCallback } from "react";

const MAX_HISTORY = 30;

export function useCollageHistory() {
  const [history, setHistory] = useState<CanvasItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback(
    (newItems: CanvasItem[]) => {
      setHistory((prev) => {
        // Cut off any "future" states beyond the current index
        const base = prev.slice(0, historyIndex + 1);
        const next = [...base, JSON.parse(JSON.stringify(newItems))];

        if (next.length > MAX_HISTORY) next.shift();

        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex],
  );

  const undo = useCallback(
    (setCanvasItems: (items: CanvasItem[]) => void) => {
      if (historyIndex > 0) {
        setHistoryIndex((prev) => prev - 1);
        setCanvasItems(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      }
    },
    [historyIndex, history],
  );

  const redo = useCallback(
    (setCanvasItems: (items: CanvasItem[]) => void) => {
      if (historyIndex < history.length - 1) {
        setHistoryIndex((prev) => prev + 1);
        setCanvasItems(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      }
    },
    [historyIndex, history],
  );

  return {
    history,
    historyIndex,
    saveToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
