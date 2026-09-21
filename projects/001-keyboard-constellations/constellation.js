(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Constellation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  function normalizeText(text) {
    const normalized = String(text ?? '').trim().replace(/\s+/g, ' ');
    return normalized || 'curiosity';
  }

  function hashString(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let state = seed >>> 0;
    return function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function constellationFor(text, width, height, density = 42) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 120 || height < 120) {
      throw new Error('width and height must be finite numbers of at least 120');
    }
    if (!Number.isFinite(density)) throw new Error('density must be a finite number');

    const phrase = normalizeText(text);
    const count = clamp(Math.round(density), 12, 72);
    const seed = hashString(`${phrase}|${Math.round(width)}×${Math.round(height)}|${count}`);
    const random = seededRandom(seed);
    const hue = seed % 360;
    const centerX = width * (0.47 + random() * 0.06);
    const centerY = height * (0.47 + random() * 0.06);
    const radius = Math.min(width, height) * 0.43;
    const margin = 18;
    const stars = [];

    for (let index = 0; index < count; index += 1) {
      const code = phrase.charCodeAt(index % phrase.length);
      const distance = Math.sqrt((index + 0.6) / count) * radius;
      const angle = index * GOLDEN_ANGLE + code * 0.021 + (random() - 0.5) * 0.7;
      const jitter = radius * 0.06;
      const x = clamp(centerX + Math.cos(angle) * distance + (random() - 0.5) * jitter, margin, width - margin);
      const y = clamp(centerY + Math.sin(angle) * distance + (random() - 0.5) * jitter, margin, height - margin);
      stars.push({
        x,
        y,
        radius: 1.2 + random() * 2.8 + (code % 5) * 0.12,
        glow: 0.45 + random() * 0.55,
        phase: random() * Math.PI * 2,
        character: phrase[index % phrase.length],
      });
    }

    const edges = [];
    for (let index = 1; index < stars.length; index += 1) {
      const nearby = [];
      for (let candidate = Math.max(0, index - 12); candidate < index; candidate += 1) {
        const dx = stars[index].x - stars[candidate].x;
        const dy = stars[index].y - stars[candidate].y;
        nearby.push({ to: candidate, distance: Math.hypot(dx, dy) });
      }
      nearby.sort((a, b) => a.distance - b.distance || a.to - b.to);
      edges.push({ from: index, to: nearby[0].to, strength: 1 });
      if (index % 7 === 0 && nearby[1] && nearby[1].distance < radius * 0.58) {
        edges.push({ from: index, to: nearby[1].to, strength: 0.45 });
      }
    }

    return {
      phrase,
      seed,
      hue,
      accentHue: (hue + 72) % 360,
      width,
      height,
      stars,
      edges,
    };
  }

  return Object.freeze({ constellationFor, hashString, normalizeText, seededRandom });
});
