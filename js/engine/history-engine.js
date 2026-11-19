/* =====================================================================
 * WeddingFlow Engine — 50-Step Immutable Undo / Redo History Engine
 * ===================================================================== */
const WFHistory = (function () {
  'use strict';

  const MAX_STEPS = 50;
  let stack = [];
  let cursor = -1;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function push(state) {
    const snap = JSON.stringify(state);
    if (cursor >= 0 && stack[cursor] === snap) return;
    stack = stack.slice(0, cursor + 1);
    stack.push(snap);
    if (stack.length > MAX_STEPS) stack.shift();
    cursor = stack.length - 1;
  }

  function canUndo() { return cursor > 0; }
  function canRedo() { return cursor >= 0 && cursor < stack.length - 1; }

  function undo() {
    if (!canUndo()) return null;
    cursor -= 1;
    return JSON.parse(stack[cursor]);
  }

  function redo() {
    if (!canRedo()) return null;
    cursor += 1;
    return JSON.parse(stack[cursor]);
  }

  return { push, undo, redo, canUndo, canRedo, clone };
})();
