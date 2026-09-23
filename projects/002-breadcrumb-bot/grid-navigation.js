(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GridNavigation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SUPPORTED_KEYS = new Set(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End']);

  function nextCell(cell, key, rows, columns, control = false) {
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) {
      throw new Error('grid dimensions must be positive integers');
    }
    if (!cell || !Number.isInteger(cell.row) || !Number.isInteger(cell.column)) {
      throw new Error('current position must be a grid cell');
    }
    if (cell.row < 0 || cell.row >= rows || cell.column < 0 || cell.column >= columns) {
      throw new Error('current position must be inside the grid');
    }
    if (!SUPPORTED_KEYS.has(key)) return null;

    const next = { ...cell };
    if (key === 'ArrowUp') next.row = Math.max(0, cell.row - 1);
    if (key === 'ArrowRight') next.column = Math.min(columns - 1, cell.column + 1);
    if (key === 'ArrowDown') next.row = Math.min(rows - 1, cell.row + 1);
    if (key === 'ArrowLeft') next.column = Math.max(0, cell.column - 1);
    if (key === 'Home') {
      next.column = 0;
      if (control) next.row = 0;
    }
    if (key === 'End') {
      next.column = columns - 1;
      if (control) next.row = rows - 1;
    }
    return next;
  }

  return Object.freeze({ nextCell });
});
