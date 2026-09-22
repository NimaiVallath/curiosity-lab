(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BreadcrumbBot = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DIRECTIONS = Object.freeze([
    { name: 'north', row: -1, column: 0 },
    { name: 'east', row: 0, column: 1 },
    { name: 'south', row: 1, column: 0 },
    { name: 'west', row: 0, column: -1 },
  ]);

  function key(cell) {
    return `${cell.row},${cell.column}`;
  }

  function parseKey(value) {
    const [row, column] = value.split(',').map(Number);
    return { row, column };
  }

  function sameCell(left, right) {
    return left.row === right.row && left.column === right.column;
  }

  function distance(left, right) {
    return Math.abs(left.row - right.row) + Math.abs(left.column - right.column);
  }

  function validateWorld(world) {
    if (!Number.isInteger(world.rows) || !Number.isInteger(world.columns) || world.rows < 2 || world.columns < 2) {
      throw new Error('the picnic must have at least two rows and columns');
    }
    for (const [label, cell] of [['start', world.start], ['goal', world.goal]]) {
      if (!cell || !Number.isInteger(cell.row) || !Number.isInteger(cell.column)) {
        throw new Error(`${label} must be a grid cell`);
      }
      if (cell.row < 0 || cell.row >= world.rows || cell.column < 0 || cell.column >= world.columns) {
        throw new Error(`${label} must be inside the picnic`);
      }
    }
    if (sameCell(world.start, world.goal)) throw new Error('start and goal must be different');
    const blocked = new Set(world.blocked || []);
    if (blocked.has(key(world.start)) || blocked.has(key(world.goal))) {
      throw new Error('start and goal must stay clear');
    }
  }

  function createAgent(world) {
    validateWorld(world);
    const normalized = {
      rows: world.rows,
      columns: world.columns,
      start: { ...world.start },
      goal: { ...world.goal },
      blocked: new Set(world.blocked || []),
    };
    const startKey = key(normalized.start);
    return {
      world: normalized,
      position: { ...normalized.start },
      phase: 'searching',
      frontier: [{ cell: { ...normalized.start }, travelled: 0, estimate: distance(normalized.start, normalized.goal) }],
      visited: new Set(),
      costs: new Map([[startKey, 0]]),
      parents: new Map(),
      route: [],
      trail: [],
      trace: [{ tool: 'notice', message: `Sugar detected ${distance(normalized.start, normalized.goal)} squares away.` }],
      decisions: 0,
    };
  }

  function neighbors(agent, cell) {
    return DIRECTIONS.map((direction) => ({
      row: cell.row + direction.row,
      column: cell.column + direction.column,
      direction: direction.name,
    })).filter((candidate) => (
      candidate.row >= 0
      && candidate.row < agent.world.rows
      && candidate.column >= 0
      && candidate.column < agent.world.columns
      && !agent.world.blocked.has(key(candidate))
    ));
  }

  function compareCandidates(left, right) {
    return left.estimate - right.estimate
      || right.travelled - left.travelled
      || left.cell.row - right.cell.row
      || left.cell.column - right.cell.column;
  }

  function reconstruct(agent, goalKey) {
    const route = [];
    let cursor = goalKey;
    const startKey = key(agent.world.start);
    while (cursor !== startKey) {
      route.unshift(parseKey(cursor));
      cursor = agent.parents.get(cursor);
      if (!cursor) throw new Error('route memory is incomplete');
    }
    return route;
  }

  function searchStep(agent) {
    agent.frontier.sort(compareCandidates);
    let candidate = agent.frontier.shift();
    while (candidate && agent.visited.has(key(candidate.cell))) candidate = agent.frontier.shift();

    if (!candidate) {
      agent.phase = 'blocked';
      agent.trace.push({ tool: 'stop', message: 'No trail reaches the sugar. Move a leaf and try again.' });
      return agent;
    }

    const candidateKey = key(candidate.cell);
    agent.visited.add(candidateKey);
    agent.decisions += 1;
    agent.trace.push({
      tool: 'sniff',
      cell: { ...candidate.cell },
      message: `Checked ${candidateKey}: ${candidate.travelled} walked + ${distance(candidate.cell, agent.world.goal)} scent.`,
    });

    if (sameCell(candidate.cell, agent.world.goal)) {
      agent.route = reconstruct(agent, candidateKey);
      agent.trail = agent.route.map((cell) => ({ ...cell }));
      agent.phase = 'walking';
      agent.trace.push({ tool: 'plan', message: `Best trail found: ${agent.route.length} steps.` });
      return agent;
    }

    let remembered = 0;
    for (const next of neighbors(agent, candidate.cell)) {
      const nextKey = key(next);
      const nextCost = candidate.travelled + 1;
      const knownCost = agent.costs.get(nextKey);
      if (knownCost !== undefined && knownCost <= nextCost) continue;
      agent.costs.set(nextKey, nextCost);
      agent.parents.set(nextKey, candidateKey);
      agent.frontier.push({
        cell: { row: next.row, column: next.column },
        travelled: nextCost,
        estimate: nextCost + distance(next, agent.world.goal),
      });
      remembered += 1;
    }
    agent.trace.push({ tool: 'remember', message: `Saved ${remembered} promising turn${remembered === 1 ? '' : 's'} in scent memory.` });
    return agent;
  }

  function walkStep(agent) {
    const next = agent.route.shift();
    if (!next) {
      agent.phase = 'arrived';
      return agent;
    }
    const previous = agent.position;
    agent.position = { ...next };
    const direction = DIRECTIONS.find((item) => (
      previous.row + item.row === next.row && previous.column + item.column === next.column
    ));
    agent.trace.push({ tool: 'walk', cell: { ...next }, message: `Walked ${direction ? direction.name : 'forward'} to ${key(next)}.` });
    if (sameCell(agent.position, agent.world.goal)) {
      agent.phase = 'arrived';
      agent.trace.push({ tool: 'celebrate', message: `Sugar found after ${agent.decisions} search decisions.` });
    }
    return agent;
  }

  function stepAgent(agent) {
    if (!agent || !agent.world) throw new Error('create an agent before stepping');
    if (agent.phase === 'searching') return searchStep(agent);
    if (agent.phase === 'walking') return walkStep(agent);
    return agent;
  }

  function runAgent(world, limit = 1000) {
    const agent = createAgent(world);
    let steps = 0;
    while (!['arrived', 'blocked'].includes(agent.phase) && steps < limit) {
      stepAgent(agent);
      steps += 1;
    }
    if (!['arrived', 'blocked'].includes(agent.phase)) throw new Error(`agent exceeded ${limit} steps`);
    return agent;
  }

  return Object.freeze({ createAgent, distance, key, runAgent, sameCell, stepAgent, validateWorld });
});
