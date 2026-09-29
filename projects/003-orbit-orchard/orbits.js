(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OrbitOrchard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MU = 2.4;
  const COLORS = ['#f4c46b', '#83d9cb', '#ed8db6'];

  function makeMoon(radius, phase, index = 0) {
    const angle = phase;
    const speed = Math.sqrt(MU * radius * radius / (radius * radius + 0.018) ** 1.5);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: -Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
      radius: 0.075 + index * 0.012,
      color: COLORS[index % COLORS.length],
      trail: [],
    };
  }

  function createSystem() {
    return [makeMoon(1.25, -0.4, 0), makeMoon(1.95, 2.6, 1), makeMoon(2.65, 0.8, 2)];
  }

  function acceleration(body) {
    const distanceSquared = body.x * body.x + body.y * body.y + 0.018;
    const scale = -MU / (distanceSquared * Math.sqrt(distanceSquared));
    return { x: body.x * scale, y: body.y * scale };
  }

  function step(system, dt = 0.01) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05) throw new Error('dt must be in (0, 0.05]');
    for (const body of system) {
      const before = acceleration(body);
      const halfVx = body.vx + before.x * dt / 2;
      const halfVy = body.vy + before.y * dt / 2;
      body.x += halfVx * dt;
      body.y += halfVy * dt;
      const after = acceleration(body);
      body.vx = halfVx + after.x * dt / 2;
      body.vy = halfVy + after.y * dt / 2;
      body.trail.push({ x: body.x, y: body.y });
      if (body.trail.length > 220) body.trail.shift();
    }
    return system;
  }

  function setOrbitRadius(body, radius) {
    if (!Number.isFinite(radius) || radius < 0.7 || radius > 3.05) {
      throw new Error('orbit radius must be between 0.7 and 3.05');
    }
    const current = Math.hypot(body.x, body.y) || 1;
    const x = body.x / current * radius;
    const y = body.y / current * radius;
    const speed = Math.sqrt(MU * radius * radius / (radius * radius + 0.018) ** 1.5);
    const angle = Math.atan2(y, x);
    body.x = x;
    body.y = y;
    body.vx = -Math.sin(angle) * speed;
    body.vy = Math.cos(angle) * speed;
    body.trail = [];
    return body;
  }

  function worldPoint(clientX, clientY, bounds, scale) {
    return {
      x: (clientX - bounds.left - bounds.width / 2) / scale,
      y: (clientY - bounds.top - bounds.height / 2) / scale,
    };
  }

  return Object.freeze({ MU, createSystem, makeMoon, setOrbitRadius, step, worldPoint });
});
