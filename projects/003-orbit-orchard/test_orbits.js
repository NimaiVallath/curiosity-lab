const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createSystem, setOrbitRadius, step, worldPoint, MU } = require('./orbits.js');

test('the three moons start at distinct circular radii with tangential velocities', () => {
  const system = createSystem();
  assert.equal(system.length, 3);
  for (const moon of system) {
    const radius = Math.hypot(moon.x, moon.y);
    const speed = Math.hypot(moon.vx, moon.vy);
    assert.ok(Math.abs(speed - Math.sqrt(MU * radius * radius / (radius * radius + 0.018) ** 1.5)) < 1e-12);
    assert.ok(Math.abs(moon.x * moon.vx + moon.y * moon.vy) < 1e-12);
  }
});

test('velocity-Verlet advances a circular orbit while keeping energy bounded', () => {
  const [moon] = createSystem();
  const energy = (body) => (body.vx ** 2 + body.vy ** 2) / 2 - MU / Math.sqrt(body.x ** 2 + body.y ** 2 + 0.018);
  const initial = energy(moon);
  for (let count = 0; count < 5000; count += 1) step([moon], 0.01);
  assert.ok(Math.abs(energy(moon) - initial) < 0.00002);
  assert.ok(moon.trail.length <= 220);
});

test('changing radius rebuilds a tangent velocity and clears the old trail', () => {
  const [moon] = createSystem();
  moon.trail.push({ x: 7, y: 7 });
  setOrbitRadius(moon, 2.4);
  assert.ok(Math.abs(Math.hypot(moon.x, moon.y) - 2.4) < 1e-12);
  assert.ok(Math.abs(moon.vx * moon.x + moon.vy * moon.y) < 1e-12);
  assert.deepEqual(moon.trail, []);
  assert.throws(() => setOrbitRadius(moon, 3.2), /between 0.7 and 3.05/);
});

test('pointer coordinates map the canvas center to the gravity well', () => {
  assert.deepEqual(worldPoint(160, 140, { left: 10, top: 20, width: 300, height: 240 }, 100), { x: 0, y: 0 });
  assert.throws(() => step(createSystem(), 0), /dt must be/);
});
