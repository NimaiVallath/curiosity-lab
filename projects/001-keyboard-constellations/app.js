(function () {
  'use strict';

  const canvas = document.querySelector('#sky');
  const context = canvas.getContext('2d');
  const phraseInput = document.querySelector('#phrase');
  const densityInput = document.querySelector('#density');
  const densityOutput = document.querySelector('#density-output');
  const status = document.querySelector('#status');
  const saveButton = document.querySelector('#save');
  const surpriseButton = document.querySelector('#surprise');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const surprises = [
    'make room for wonder',
    'bugs are tiny mysteries',
    'what if the cursor had gravity?',
    'late night side quest',
    'small code, strange sky',
    'follow the interesting part',
  ];

  let model;
  let view = { width: 800, height: 620, ratio: 1 };
  let pointer = null;
  let surpriseIndex = 0;
  let animationStarted = false;

  function ensureAnimation() {
    if (!reduceMotion.matches && !animationStarted) {
      animationStarted = true;
      requestAnimationFrame(draw);
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    view = { width: Math.max(120, bounds.width), height: Math.max(120, bounds.height), ratio };
    canvas.width = Math.round(view.width * ratio);
    canvas.height = Math.round(view.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    rebuild();
  }

  function rebuild() {
    model = Constellation.constellationFor(
      phraseInput.value,
      view.width,
      view.height,
      Number(densityInput.value),
    );
    densityOutput.value = String(model.stars.length);
    status.textContent = `${model.stars.length} stars drawn from “${model.phrase}”. Same words, same sky.`;
    if (reduceMotion.matches) draw(0);
    else ensureAnimation();
  }

  function displaced(star) {
    if (!pointer) return star;
    const dx = star.x - pointer.x;
    const dy = star.y - pointer.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (distance >= 105) return star;
    const force = (1 - distance / 105) * 20;
    return { ...star, x: star.x + dx / distance * force, y: star.y + dy / distance * force };
  }

  function draw(time) {
    if (!model) return;
    const { width, height } = view;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#070914';
    context.fillRect(0, 0, width, height);

    const atmosphere = context.createRadialGradient(width * 0.55, height * 0.45, 0, width * 0.55, height * 0.45, Math.max(width, height) * 0.75);
    atmosphere.addColorStop(0, `hsla(${model.hue}, 62%, 28%, .44)`);
    atmosphere.addColorStop(0.48, `hsla(${model.accentHue}, 58%, 18%, .22)`);
    atmosphere.addColorStop(1, 'rgba(7,9,20,0)');
    context.fillStyle = atmosphere;
    context.fillRect(0, 0, width, height);

    const positions = model.stars.map(displaced);
    context.lineWidth = 0.8;
    for (const edge of model.edges) {
      const from = positions[edge.from];
      const to = positions[edge.to];
      context.strokeStyle = `hsla(${model.accentHue}, 72%, 78%, ${0.13 * edge.strength})`;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    for (const [index, star] of positions.entries()) {
      const pulse = reduceMotion.matches ? 1 : 0.88 + Math.sin(time * 0.0014 + star.phase) * 0.12;
      const radius = star.radius * pulse;
      if (index % 5 === 0) {
        const glow = context.createRadialGradient(star.x, star.y, 0, star.x, star.y, radius * 5);
        glow.addColorStop(0, `hsla(${model.accentHue}, 95%, 88%, ${0.32 * star.glow})`);
        glow.addColorStop(1, `hsla(${model.accentHue}, 95%, 88%, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(star.x, star.y, radius * 5, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = `hsla(${index % 3 === 0 ? model.accentHue : model.hue}, 85%, ${78 + star.glow * 16}%, ${0.72 + star.glow * 0.28})`;
      context.beginPath();
      context.arc(star.x, star.y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = 'rgba(235,238,255,.72)';
    context.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace';
    context.letterSpacing = '1px';
    context.fillText(model.phrase.toUpperCase(), 22, height - 24);
    if (!reduceMotion.matches) requestAnimationFrame(draw);
    else animationStarted = false;
  }

  phraseInput.addEventListener('input', rebuild);
  densityInput.addEventListener('input', rebuild);
  document.querySelectorAll('[data-phrase]').forEach((button) => {
    button.addEventListener('click', () => {
      phraseInput.value = button.dataset.phrase;
      rebuild();
      phraseInput.focus();
    });
  });
  surpriseButton.addEventListener('click', () => {
    surpriseIndex = (surpriseIndex + 1 + model.seed % (surprises.length - 1)) % surprises.length;
    phraseInput.value = surprises[surpriseIndex];
    rebuild();
  });
  saveButton.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `constellation-${model.seed}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  });
  canvas.addEventListener('pointermove', (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    if (reduceMotion.matches) draw(0);
  });
  canvas.addEventListener('pointerleave', () => {
    pointer = null;
    if (reduceMotion.matches) draw(0);
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      animationStarted = false;
      draw(0);
    } else ensureAnimation();
  });

  new ResizeObserver(resize).observe(canvas);
})();
