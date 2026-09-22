(function () {
  'use strict';

  const patterns = {
    garden: ['1,1', '1,2', '1,3', '2,3', '3,3', '4,3', '4,4', '4,5', '6,1', '6,2', '6,3', '7,6', '7,7'],
    spiral: ['1,1', '1,2', '1,3', '1,4', '1,5', '1,6', '1,7', '2,7', '3,7', '4,7', '5,7', '6,7', '7,7', '7,6', '7,5', '7,4', '7,3', '7,2', '3,2', '3,3', '3,4', '3,5', '4,2', '5,2', '5,3', '5,4', '5,5'],
    open: ['2,2', '2,6', '4,4', '6,2', '6,6'],
  };

  const picnic = document.querySelector('#picnic');
  const trace = document.querySelector('#trace');
  const status = document.querySelector('#status');
  const phase = document.querySelector('#phase');
  const stepButton = document.querySelector('#step');
  const runButton = document.querySelector('#run');
  const resetButton = document.querySelector('#reset');
  const patternSelect = document.querySelector('#pattern');
  const counters = {
    memory: document.querySelector('#memory-count'),
    option: document.querySelector('#option-count'),
    decision: document.querySelector('#decision-count'),
  };

  let activeTool = 'goal';
  let timer = null;
  let world = makeWorld('garden');
  let agent = BreadcrumbBot.createAgent(world);

  function makeWorld(pattern) {
    return {
      rows: 9,
      columns: 9,
      start: { row: 8, column: 0 },
      goal: { row: 0, column: 8 },
      blocked: [...patterns[pattern]],
    };
  }

  function cellKey(row, column) {
    return `${row},${column}`;
  }

  function stopRunning() {
    if (timer) window.clearInterval(timer);
    timer = null;
    runButton.textContent = 'Let it think';
  }

  function restart(message = 'The ant can smell the sugar. Ask for one thought or let it think.') {
    stopRunning();
    agent = BreadcrumbBot.createAgent(world);
    render(message);
  }

  function describeCell(row, column, markers) {
    const location = `row ${row + 1}, column ${column + 1}`;
    if (markers.ant && markers.sugar) return `${location}: ant has reached the sugar`;
    if (markers.ant) return `${location}: ant starting point`;
    if (markers.sugar) return `${location}: sugar goal`;
    if (markers.leaf) return `${location}: leaf obstacle`;
    return `${location}: open blanket`;
  }

  function renderBoard() {
    picnic.replaceChildren();
    const blocked = new Set(world.blocked);
    const options = new Set(agent.frontier.map((item) => BreadcrumbBot.key(item.cell)));
    const route = new Set(agent.trail.map(BreadcrumbBot.key));

    for (let row = 0; row < world.rows; row += 1) {
      for (let column = 0; column < world.columns; column += 1) {
        const value = cellKey(row, column);
        const markers = {
          ant: BreadcrumbBot.sameCell(agent.position, { row, column }),
          sugar: BreadcrumbBot.sameCell(world.goal, { row, column }),
          leaf: blocked.has(value),
        };
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cell';
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-label', describeCell(row, column, markers));
        button.dataset.row = String(row);
        button.dataset.column = String(column);
        if (agent.visited.has(value)) button.classList.add('is-memory');
        if (options.has(value)) button.classList.add('is-option');
        if (route.has(value)) button.classList.add('is-route');
        if (markers.leaf) button.classList.add('is-leaf');
        if (markers.sugar) button.classList.add('is-sugar');
        if (markers.ant) button.classList.add('is-ant');
        const symbol = markers.ant ? '🐜' : markers.sugar ? '◻️' : markers.leaf ? '🍃' : '';
        if (symbol) {
          const thing = document.createElement('span');
          thing.className = 'thing';
          thing.setAttribute('aria-hidden', 'true');
          thing.textContent = symbol;
          button.append(thing);
        }
        picnic.append(button);
      }
    }
  }

  function renderTrace() {
    trace.replaceChildren();
    for (const entry of agent.trace.slice(-8).reverse()) {
      const item = document.createElement('li');
      const tool = document.createElement('b');
      const message = document.createElement('span');
      tool.textContent = entry.tool;
      message.textContent = entry.message;
      item.append(tool, message);
      trace.append(item);
    }
  }

  function phaseMessage() {
    if (agent.phase === 'searching') return `The ant is comparing ${agent.frontier.length} possible trail${agent.frontier.length === 1 ? '' : 's'}.`;
    if (agent.phase === 'walking') return `A shortest trail is ready. ${agent.route.length} step${agent.route.length === 1 ? '' : 's'} remain.`;
    if (agent.phase === 'arrived') return `Sugar found. The ant used ${agent.decisions} search decisions, then followed its chosen trail.`;
    return 'The sugar is unreachable from here. Remove a leaf or move the goal.';
  }

  function render(message) {
    renderBoard();
    renderTrace();
    phase.textContent = agent.phase;
    phase.dataset.phase = agent.phase;
    counters.memory.textContent = String(agent.visited.size);
    counters.option.textContent = String(agent.frontier.length);
    counters.decision.textContent = String(agent.decisions);
    status.textContent = message || phaseMessage();
    const finished = ['arrived', 'blocked'].includes(agent.phase);
    stepButton.disabled = finished;
    if (finished) stopRunning();
  }

  function takeStep() {
    BreadcrumbBot.stepAgent(agent);
    render();
  }

  picnic.addEventListener('click', (event) => {
    const cell = event.target.closest('.cell');
    if (!cell) return;
    const selected = { row: Number(cell.dataset.row), column: Number(cell.dataset.column) };
    const selectedKey = BreadcrumbBot.key(selected);
    if (BreadcrumbBot.sameCell(selected, world.start)) {
      status.textContent = 'The ant keeps this corner as its starting point.';
      return;
    }

    if (activeTool === 'goal') {
      world.goal = selected;
      world.blocked = world.blocked.filter((item) => item !== selectedKey);
      restart(`Sugar moved to row ${selected.row + 1}, column ${selected.column + 1}. The ant forgot its old plan.`);
      return;
    }

    if (BreadcrumbBot.sameCell(selected, world.goal)) {
      status.textContent = 'Move the sugar before placing a leaf here.';
      return;
    }
    world.blocked = world.blocked.includes(selectedKey)
      ? world.blocked.filter((item) => item !== selectedKey)
      : [...world.blocked, selectedKey];
    restart(world.blocked.includes(selectedKey) ? 'Leaf added. The ant will plan around it.' : 'Leaf removed. A shorter trail may have opened.');
  });

  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      activeTool = button.dataset.tool;
      document.querySelectorAll('[data-tool]').forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle('is-active', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      });
    });
  });

  stepButton.addEventListener('click', takeStep);
  runButton.addEventListener('click', () => {
    if (timer) {
      stopRunning();
      status.textContent = 'Paused. The ant will keep its memory.';
      return;
    }
    runButton.textContent = 'Pause thinking';
    takeStep();
    if (!['arrived', 'blocked'].includes(agent.phase)) timer = window.setInterval(takeStep, 135);
  });
  resetButton.addEventListener('click', () => restart());
  patternSelect.addEventListener('change', () => {
    world = makeWorld(patternSelect.value);
    restart(`Loaded ${patternSelect.options[patternSelect.selectedIndex].text.toLowerCase()}.`);
  });

  render();
})();
