const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const {
  constellationFor,
  hashString,
  normalizeText,
  seededRandom,
} = require('./constellation.js');

test('normalization makes whitespace harmless and preserves a friendly fallback', () => {
  assert.equal(normalizeText('  make   room\nfor wonder  '), 'make room for wonder');
  assert.equal(normalizeText('   '), 'curiosity');
});

test('the same phrase and viewport always reconstruct the same sky', () => {
  const first = constellationFor('make room for wonder', 900, 700, 42);
  const second = constellationFor('make room for wonder', 900, 700, 42);
  assert.deepEqual(first, second);
  assert.equal(first.stars.length, 42);
  assert.equal(first.edges.length >= 41, true);
});

test('different words produce a visibly different signature', () => {
  const wonder = constellationFor('make room for wonder', 900, 700, 42);
  const mystery = constellationFor('bugs are tiny mysteries', 900, 700, 42);
  assert.notEqual(wonder.seed, mystery.seed);
  assert.notEqual(wonder.hue, mystery.hue);
  assert.notDeepEqual(wonder.stars.slice(0, 3), mystery.stars.slice(0, 3));
});

test('every star and edge stays inside a valid model', () => {
  const model = constellationFor('edge cases can sparkle', 320, 220, 60);
  for (const star of model.stars) {
    assert.ok(star.x >= 18 && star.x <= 302);
    assert.ok(star.y >= 18 && star.y <= 202);
    assert.ok(star.radius > 0);
  }
  for (const edge of model.edges) {
    assert.ok(edge.from >= 0 && edge.from < model.stars.length);
    assert.ok(edge.to >= 0 && edge.to < edge.from);
    assert.notEqual(edge.from, edge.to);
  }
});

test('density is rounded and safely bounded', () => {
  assert.equal(constellationFor('small', 400, 400, 2).stars.length, 12);
  assert.equal(constellationFor('large', 400, 400, 200).stars.length, 72);
  assert.equal(constellationFor('rounded', 400, 400, 20.6).stars.length, 21);
});

test('invalid dimensions and density fail clearly', () => {
  assert.throws(() => constellationFor('x', 119, 400, 20), /at least 120/);
  assert.throws(() => constellationFor('x', 400, Number.NaN, 20), /at least 120/);
  assert.throws(() => constellationFor('x', 400, 400, Infinity), /density must be/);
});

test('hash and random generator are stable primitives', () => {
  assert.equal(hashString('wonder'), 2209648554);
  const first = seededRandom(12345);
  const second = seededRandom(12345);
  assert.deepEqual([first(), first(), first()], [second(), second(), second()]);
});

test('the checked-in preview identifies its phrase, seed, and accessible description', () => {
  const preview = readFileSync(join(__dirname, 'examples/make-room-for-wonder.svg'), 'utf8');
  assert.match(preview, /role="img"/);
  assert.match(preview, /<title id="title">/);
  assert.match(preview, /<desc id="description">/);
  assert.match(preview, /seed=2197342441/);
  assert.match(preview, /MAKE ROOM FOR WONDER/);
});
