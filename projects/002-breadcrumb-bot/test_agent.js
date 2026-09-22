const assert = require('node:assert/strict');
const { test } = require('node:test');

const { createAgent, distance, runAgent, stepAgent, validateWorld } = require('./agent.js');

function world(overrides = {}) {
  return {
    rows: 6,
    columns: 7,
    start: { row: 5, column: 0 },
    goal: { row: 0, column: 6 },
    blocked: ['1,1', '1,2', '1,3', '2,3', '3,3', '4,3'],
    ...overrides,
  };
}

test('the ant deterministically finds a shortest available trail', () => {
  const first = runAgent(world());
  const second = runAgent(world());
  assert.equal(first.phase, 'arrived');
  assert.equal(first.trace.at(-1).tool, 'celebrate');
  assert.deepEqual(first.trace, second.trace);
  assert.equal(first.trace.filter((entry) => entry.tool === 'walk').length, 11);
  assert.equal(first.trail.length, 11);
  assert.equal(first.route.length, 0);
});

test('the trail never walks through a leaf or jumps between cells', () => {
  const picnic = world();
  const result = runAgent(picnic);
  const blocked = new Set(picnic.blocked);
  const walked = result.trace.filter((entry) => entry.tool === 'walk').map((entry) => entry.cell);
  let previous = picnic.start;
  for (const cell of walked) {
    assert.equal(blocked.has(`${cell.row},${cell.column}`), false);
    assert.equal(distance(previous, cell), 1);
    previous = cell;
  }
  assert.deepEqual(previous, picnic.goal);
});

test('an enclosed sugar cube produces an honest blocked result', () => {
  const result = runAgent(world({
    rows: 3,
    columns: 3,
    start: { row: 2, column: 0 },
    goal: { row: 0, column: 2 },
    blocked: ['0,1', '1,2'],
  }));
  assert.equal(result.phase, 'blocked');
  assert.equal(result.trace.at(-1).tool, 'stop');
  assert.match(result.trace.at(-1).message, /No trail/);
});

test('each search step exposes sensing and memory in the trace', () => {
  const agent = createAgent(world({ blocked: [] }));
  stepAgent(agent);
  assert.deepEqual(agent.trace.map((entry) => entry.tool), ['notice', 'sniff', 'remember']);
  assert.equal(agent.visited.has('5,0'), true);
  assert.equal(agent.frontier.length, 2);
});

test('finished and blocked agents remain stable when stepped again', () => {
  const arrived = runAgent(world({ rows: 2, columns: 2, start: { row: 1, column: 0 }, goal: { row: 0, column: 0 }, blocked: [] }));
  const arrivedTrace = arrived.trace.slice();
  stepAgent(arrived);
  assert.deepEqual(arrived.trace, arrivedTrace);

  const blocked = runAgent(world({ rows: 2, columns: 2, start: { row: 1, column: 0 }, goal: { row: 0, column: 1 }, blocked: ['0,0', '1,1'] }));
  const blockedTrace = blocked.trace.slice();
  stepAgent(blocked);
  assert.deepEqual(blocked.trace, blockedTrace);
});

test('world validation catches ambiguous or impossible inputs', () => {
  assert.throws(() => validateWorld(world({ rows: 1 })), /at least two/);
  assert.throws(() => validateWorld(world({ goal: { row: 7, column: 7 } })), /inside/);
  assert.throws(() => validateWorld(world({ goal: { row: 5, column: 0 } })), /different/);
  assert.throws(() => validateWorld(world({ blocked: ['5,0'] })), /stay clear/);
});

test('distance is a transparent Manhattan scent heuristic', () => {
  assert.equal(distance({ row: 5, column: 0 }, { row: 0, column: 6 }), 11);
  assert.equal(distance({ row: 2, column: 3 }, { row: 2, column: 3 }), 0);
});
