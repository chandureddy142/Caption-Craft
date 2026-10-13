import { describe, expect, it } from 'vitest';
import { createHistory } from './history';

describe('createHistory', () => {
  it('supports immutable updates, undo, and redo', () => {
    const history = createHistory({ text: 'one' });
    const first = history.state.present;
    history.update({ text: 'two' });
    history.update(current => ({ text: `${current.text}!` }));

    expect(history.state.present).toEqual({ text: 'two!' });
    expect(first).toEqual({ text: 'one' });
    history.undo();
    expect(history.state.present).toEqual({ text: 'two' });
    history.redo();
    expect(history.state.present).toEqual({ text: 'two!' });
  });

  it('clears the redo branch after a new update', () => {
    const history = createHistory(0);
    history.update(1);
    history.update(2);
    history.undo();
    history.update(3);
    history.redo();

    expect(history.state.present).toBe(3);
    expect(history.canRedo).toBe(false);
  });

  it('does not add equal updates and reset clears both branches', () => {
    const history = createHistory(0);
    history.update(0);
    expect(history.canUndo).toBe(false);
    history.update(1);
    history.undo();
    expect(history.canRedo).toBe(true);
    history.reset(42);
    expect(history.state).toEqual({ past: [], present: 42, future: [] });
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });
});
