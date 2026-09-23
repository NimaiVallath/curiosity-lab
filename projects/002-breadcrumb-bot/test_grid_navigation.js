const assert = require('node:assert/strict');
const { test } = require('node:test');

const { nextCell } = require('./grid-navigation.js');

test('arrow keys move exactly one grid cell', () => {
  const middle = { row: 2, column: 3 };
  assert.deepEqual(nextCell(middle, 'ArrowUp', 5, 7), { row: 1, column: 3 });
  assert.deepEqual(nextCell(middle, 'ArrowRight', 5, 7), { row: 2, column: 4 });
  assert.deepEqual(nextCell(middle, 'ArrowDown', 5, 7), { row: 3, column: 3 });
  assert.deepEqual(nextCell(middle, 'ArrowLeft', 5, 7), { row: 2, column: 2 });
});

test('arrow keys stop safely at every edge', () => {
  assert.deepEqual(nextCell({ row: 0, column: 2 }, 'ArrowUp', 3, 4), { row: 0, column: 2 });
  assert.deepEqual(nextCell({ row: 2, column: 2 }, 'ArrowDown', 3, 4), { row: 2, column: 2 });
  assert.deepEqual(nextCell({ row: 1, column: 0 }, 'ArrowLeft', 3, 4), { row: 1, column: 0 });
  assert.deepEqual(nextCell({ row: 1, column: 3 }, 'ArrowRight', 3, 4), { row: 1, column: 3 });
});

test('Home and End move within a row by default', () => {
  assert.deepEqual(nextCell({ row: 2, column: 3 }, 'Home', 5, 7), { row: 2, column: 0 });
  assert.deepEqual(nextCell({ row: 2, column: 3 }, 'End', 5, 7), { row: 2, column: 6 });
});

test('modified Home and End reach the first and last grid cells', () => {
  assert.deepEqual(nextCell({ row: 2, column: 3 }, 'Home', 5, 7, true), { row: 0, column: 0 });
  assert.deepEqual(nextCell({ row: 2, column: 3 }, 'End', 5, 7, true), { row: 4, column: 6 });
});

test('unrelated keys leave keyboard handling to the browser', () => {
  assert.equal(nextCell({ row: 2, column: 3 }, 'Enter', 5, 7), null);
  assert.equal(nextCell({ row: 2, column: 3 }, 'Tab', 5, 7), null);
});

test('invalid grid positions fail with useful errors', () => {
  assert.throws(() => nextCell({ row: 0, column: 0 }, 'Home', 0, 4), /positive integers/);
  assert.throws(() => nextCell({ row: 4, column: 0 }, 'Home', 4, 4), /inside/);
  assert.throws(() => nextCell(null, 'Home', 4, 4), /grid cell/);
});
