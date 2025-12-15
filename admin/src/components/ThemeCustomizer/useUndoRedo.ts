/**
 * Undo/Redo History Hook
 * Track all changes with the ability to undo/redo modifications
 */

import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T, actionName?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: { past: number; future: number };
  lastAction: string | null;
  reset: (initialState: T) => void;
}

const MAX_HISTORY_SIZE = 50;

export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  
  const lastActionRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<T | null>(null);

  const setState = useCallback((newState: T, actionName?: string) => {
    // Debounce rapid changes (like slider movements)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    pendingStateRef.current = newState;
    lastActionRef.current = actionName || 'Change';

    debounceTimerRef.current = setTimeout(() => {
      setHistory((prev) => {
        const finalState = pendingStateRef.current || newState;
        
        // Don't add to history if state hasn't changed
        if (JSON.stringify(prev.present) === JSON.stringify(finalState)) {
          return prev;
        }

        const newPast = [...prev.past, prev.present];
        
        // Limit history size
        if (newPast.length > MAX_HISTORY_SIZE) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: finalState,
          future: [], // Clear future on new change
        };
      });
      
      pendingStateRef.current = null;
    }, 300);

    // Immediately update present for UI responsiveness
    setHistory((prev) => ({
      ...prev,
      present: newState,
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previousState = newPast.pop()!;

      lastActionRef.current = 'Undo';

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;

      lastActionRef.current = 'Redo';

      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
    lastActionRef.current = null;
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    history: {
      past: history.past.length,
      future: history.future.length,
    },
    lastAction: lastActionRef.current,
    reset,
  };
}

