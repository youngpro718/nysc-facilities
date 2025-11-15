import { useState, useCallback } from 'react';

interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndo<T>(initialPresent: T) {
  const [state, setState] = useState<UndoState<T>>({
    past: [],
    present: initialPresent,
    future: []
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return state.present;

    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);

    setState({
      past: newPast,
      present: previous,
      future: [state.present, ...state.future]
    });

    return previous;
  }, [state, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return state.present;

    const next = state.future[0];
    const newFuture = state.future.slice(1);

    setState({
      past: [...state.past, state.present],
      present: next,
      future: newFuture
    });

    return next;
  }, [state, canRedo]);

  const set = useCallback((newPresent: T) => {
    if (newPresent === state.present) {
      return;
    }

    setState({
      past: [...state.past, state.present],
      present: newPresent,
      future: []
    });
  }, [state]);

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: []
    });
  }, []);

  return {
    state: state.present,
    setState: set,
    resetState: reset,
    canUndo,
    canRedo,
    undo,
    redo,
  };
} 