// Shared by the pages that draw river stones: easing, a seeded random, the stone outline, and "play once when seen".
export const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const span = (p, a, b) => clamp((p - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t) => { const c = 1.25; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const smooth = (t) => t * t * (3 - 2 * t);
// Glide toward a moving target: closes about two thirds of the gap every `tau` ms at any frame rate, and lands exactly.
export const follow = (from, to, dt, tau = 70) => { const next = to + (from - to) * Math.exp(-dt / tau); return Math.abs(to - next) < 1e-4 ? to : next; };
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// An irregular river-stone outline: eight points round an ellipse, smoothed.
export function pebbleShape(r) {
  const pts = [], squash = .78 + r() * .14;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, k = 1 + (r() - .5) * .22; pts.push([Math.cos(a) * k, Math.sin(a) * k * squash]); }
  return pts;
}
export function drawPebble(ctx, x, y, size, rot, shape) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size, size); ctx.beginPath();
  const n = shape.length, mid = (i) => { const a = shape[i % n], b = shape[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  const m = mid(n - 1); ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const c = shape[i], e = mid(i); ctx.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
// The same river-stone outline as an SVG path (for the small drawings built as SVG).
export function pebblePath(shape, size) {
  const P = shape.map(([a, b]) => [a * size, b * size]), n = P.length, mid = (i) => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  const f = (v) => v.toFixed(1); const m = mid(n - 1); let d = `M${f(m[0])} ${f(m[1])}`;
  for (let i = 0; i < n; i++) { const c = P[i], e = mid(i); d += `Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`; }
  return d + 'Z';
}
export function ring(ctx, x, y, radius, alpha, color) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1.25;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
// A line arrives word by word as `t` goes 0 → 1.
export function words(el) {
  const ws = el.textContent.trim().split(/\s+/); el.textContent = '';
  const spans = ws.map((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.append(s); if (i < ws.length - 1) el.append(' '); return s; });
  return (t) => spans.forEach((s, i) => {
    const k = easeOut(span(t, i / (spans.length + 2), (i + 3) / (spans.length + 2)));
    s.style.opacity = k; s.style.transform = `translateY(${(1 - k) * .35}em)`;
  });
}
// Plays once when the element's top has come a quarter of the way up the screen, however tall it is
// (a ratio threshold can never be reached by an element taller than the screen; reduced motion or no observer shows it finished at once).
export function whenSeen(el, run) {
  if (REDUCE || typeof IntersectionObserver === 'undefined') { run(true); return; }
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); run(false); } }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
  io.observe(el);
}
