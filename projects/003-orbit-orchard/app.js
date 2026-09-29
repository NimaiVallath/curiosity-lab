(function () {
  'use strict';
  const canvas = document.querySelector('#sky');
  const context = canvas.getContext('2d');
  const moonSelect = document.querySelector('#moon');
  const radiusInput = document.querySelector('#radius');
  const radiusValue = document.querySelector('#radius-value');
  const pauseButton = document.querySelector('#pause');
  const status = document.querySelector('#status');
  const colors = ['#f4c46b', '#83d9cb', '#ed8db6'];
  let system = OrbitOrchard.createSystem();
  let scale = 120;
  let paused = false;
  let dragged = null;
  let animation;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    scale = Math.min(bounds.width / 6.8, bounds.height / 6.8);
    draw();
  }

  function screen(body) {
    return { x: canvas.clientWidth / 2 + body.x * scale, y: canvas.clientHeight / 2 + body.y * scale };
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#171c1a';
    context.fillRect(0, 0, width, height);
    const glow = context.createRadialGradient(width / 2, height / 2, 3, width / 2, height / 2, Math.min(width, height) * .48);
    glow.addColorStop(0, '#59634a88');
    glow.addColorStop(1, '#171c1a00');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    for (const body of system) {
      context.beginPath();
      context.strokeStyle = `${body.color}24`;
      context.lineWidth = 1;
      context.ellipse(width / 2, height / 2, Math.hypot(body.x, body.y) * scale, Math.hypot(body.x, body.y) * scale * .58, -.35, 0, Math.PI * 2);
      context.stroke();
      if (body.trail.length > 1) {
        context.beginPath();
        body.trail.forEach((point, index) => {
          const x = width / 2 + point.x * scale;
          const y = height / 2 + point.y * scale;
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.strokeStyle = `${body.color}91`;
        context.lineWidth = 1.5;
        context.stroke();
      }
    }
    context.beginPath();
    context.arc(width / 2, height / 2, 13, 0, Math.PI * 2);
    context.fillStyle = '#f7dda4';
    context.shadowColor = '#ffd988';
    context.shadowBlur = 25;
    context.fill();
    context.shadowBlur = 0;
    for (const body of system) {
      const point = screen(body);
      context.beginPath();
      context.arc(point.x, point.y, body.radius * scale * .56, 0, Math.PI * 2);
      context.fillStyle = body.color;
      context.shadowColor = body.color;
      context.shadowBlur = 13;
      context.fill();
      context.shadowBlur = 0;
    }
    context.fillStyle = '#bdc3ba';
    context.font = '12px ui-monospace, SFMono-Regular, monospace';
    context.fillText('DRAG A MOON · CHANGE ITS GRAVITY STORY', 18, height - 18);
  }

  function frame() {
    if (!paused && !dragged) {
      for (let index = 0; index < 3; index += 1) OrbitOrchard.step(system, 0.01);
    }
    draw();
    animation = requestAnimationFrame(frame);
  }

  function updateRadius() {
    const index = Number(moonSelect.value);
    const value = Number(radiusInput.value);
    OrbitOrchard.setOrbitRadius(system[index], value);
    radiusValue.value = value.toFixed(2);
    status.textContent = `Moon ${moonSelect.selectedOptions[0].text} now circles at ${value.toFixed(2)} orbit units.`;
  }

  function findMoon(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    const pointer = OrbitOrchard.worldPoint(clientX, clientY, bounds, scale);
    return system.findIndex((body) => Math.hypot(body.x - pointer.x, body.y - pointer.y) < .23);
  }

  canvas.addEventListener('pointerdown', (event) => {
    const index = findMoon(event.clientX, event.clientY);
    if (index < 0) return;
    dragged = index;
    canvas.setPointerCapture(event.pointerId);
    moonSelect.value = String(index);
    radiusInput.value = String(Math.hypot(system[index].x, system[index].y).toFixed(2));
    radiusValue.value = Number(radiusInput.value).toFixed(2);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (dragged === null) return;
    const bounds = canvas.getBoundingClientRect();
    const point = OrbitOrchard.worldPoint(event.clientX, event.clientY, bounds, scale);
    const distance = Math.max(.7, Math.min(3.05, Math.hypot(point.x, point.y)));
    const body = system[dragged];
    body.x = point.x / (Math.hypot(point.x, point.y) || 1) * distance;
    body.y = point.y / (Math.hypot(point.x, point.y) || 1) * distance;
    body.trail = [];
    radiusInput.value = distance.toFixed(2);
    radiusValue.value = distance.toFixed(2);
    status.textContent = `Replant ${moonSelect.selectedOptions[0].text} at ${distance.toFixed(2)} orbit units.`;
  });
  canvas.addEventListener('pointerup', () => {
    if (dragged === null) return;
    OrbitOrchard.setOrbitRadius(system[dragged], Number(radiusInput.value));
    dragged = null;
    status.textContent = 'New orbit planted. See where its path wanders.';
  });
  moonSelect.addEventListener('change', () => {
    const body = system[Number(moonSelect.value)];
    const radius = Math.hypot(body.x, body.y);
    radiusInput.value = radius.toFixed(2);
    radiusValue.value = radius.toFixed(2);
  });
  radiusInput.addEventListener('input', updateRadius);
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(paused));
    status.textContent = paused ? 'The moons hold their places.' : 'Gravity is back in motion.';
  });
  document.querySelector('#reset').addEventListener('click', () => {
    system = OrbitOrchard.createSystem();
    moonSelect.value = '0';
    radiusInput.value = '1.25';
    radiusValue.value = '1.25';
    status.textContent = 'Three moons, one tiny gravity well. Try a wider orbit.';
  });
  new ResizeObserver(resize).observe(canvas);
  animation = requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => cancelAnimationFrame(animation));
})();
