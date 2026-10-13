import { useCallback, useMemo, useState } from 'react';

export type HistoryUpdate<T> = T | ((current: T) => T);

export interface HistoryState<T> {
  past: readonly T[];
  present: T;
  future: readonly T[];
}

export interface History<T> {
  readonly state: HistoryState<T>;
  update(update: HistoryUpdate<T>): void;
  undo(): void;
  redo(): void;
  reset(value: T): void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/**
 * A small immutable history reducer. Each update creates a new snapshot and
 * invalidates the redo branch; undo/redo never mutate a stored snapshot.
 */
export function createHistory<T>(initial: T, equals: (left: T, right: T) => boolean = Object.is): History<T> {
  let state: HistoryState<T> = { past: [], present: initial, future: [] };

  return {
    get state() { return state; },
    update(update) {
      const next = typeof update === 'function'
        ? (update as (current: T) => T)(state.present)
        : update;
      if (equals(next, state.present)) return;
      state = { past: [...state.past, state.present], present: next, future: [] };
    },
    undo() {
      const previous = state.past.at(-1);
      if (previous === undefined) return;
      state = {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    },
    redo() {
      const next = state.future[0];
      if (next === undefined) return;
      state = {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    },
    reset(value) {
      state = { past: [], present: value, future: [] };
    },
    get canUndo() { return state.past.length > 0; },
    get canRedo() { return state.future.length > 0; },
  };
}

export function useHistory<T>(initial: T, equals: (left: T, right: T) => boolean = Object.is) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });

  const update = useCallback((change: HistoryUpdate<T>) => {
    setState(current => {
      const next = typeof change === 'function'
        ? (change as (value: T) => T)(current.present)
        : change;
      if (equals(next, current.present)) return current;
      return { past: [...current.past, current.present], present: next, future: [] };
    });
  }, [equals]);
  const undo = useCallback(() => setState(current => {
    const previous = current.past.at(-1);
    return previous === undefined
      ? current
      : { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] };
  }), []);
  const redo = useCallback(() => setState(current => {
    const next = current.future[0];
    return next === undefined
      ? current
      : { past: [...current.past, current.present], present: next, future: current.future.slice(1) };
  }), []);
  const reset = useCallback((value: T) => setState({ past: [], present: value, future: [] }), []);

  return useMemo(() => ({
    value: state.present,
    setValue: update,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }), [state, update, undo, redo, reset]);
}
