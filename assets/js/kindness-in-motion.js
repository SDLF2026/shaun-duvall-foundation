// Kindness in Motion page: menu, the moving moment, and the small touches further down.
// The town lights up from the edges until the one person is seen; then some of them step in and settle close.
import { initMenu } from './menu.js';
import { nominationCount, heap } from './layouts.js';
import { KIM_OPENS, KIM_CLOSES, showClosed } from './kim-window.js';
import { REDUCE, clamp, span, easeOut, easeInOut, easeOutBack, smooth, rng, pebbleShape, pebblePath, drawPebble, ring, words, whenSeen } from './stones.js';

initMenu();

function gather(sec) {
  if (!sec || REDUCE) return null;
  sec.classList.add('live');
  const canvas = sec.querySelector('.field'), ctx = canvas.getContext('2d');
  const lineB = words(sec.querySelector('.say .b'));
  const css = getComputedStyle(document.documentElement);
  const GOLD = css.getPropertyValue('--gold').trim(), UNLIT = css.getPropertyValue('--unlit').trim();
  const centerShape = pebbleShape(rng(5));
  let W, H, cx, cy, R, field, slots;

  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const phone = W < 760;
    cx = W / 2; cy = H * (phone ? .3 : .35); R = clamp(Math.min(W, H) * .05, 20, 38);

    // the places close around the person where sixteen stones will settle
    const rs = rng(907), placed = [{ x: cx, y: cy, s: R }]; slots = [];
    for (let i = 0; i < 16; i++) {
      const s = R * (.42 + rs() * .38); let best = null;
      for (let tries = 0; tries < 400 && !best; tries++) {
        const a = rs() * Math.PI * 2, d = R + s + 9 + tries * .6;           // a little room left round the person
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .9;
        if (placed.every((q, j) => Math.hypot(q.x - x, q.y - y) > q.s + s + (j ? 3 : 8))) best = { x, y };
      }
      placed.push({ ...best, s });
      slots.push({ ...best, s, rot: rs() * Math.PI, shape: pebbleShape(rs), bendK: (rs() < .5 ? -1 : 1) * (.18 + rs() * .17) });
    }
    slots.sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
    const hole = Math.max(...slots.map((q) => Math.hypot(q.x - cx, q.y - cy) + q.s)) + 14;   // the space they will fill stays open

    // the town: a quiet field of stones, kept clear of the words (an oval, so no corners) and of that space
    const r = rng(31), gap = phone ? 26 : 34, box = canvas.getBoundingClientRect();
    const keep = [...sec.querySelectorAll('.say, .title')].map((el) => { const k = el.getBoundingClientRect();
      return { x: (k.left + k.right) / 2 - box.left, y: (k.top + k.bottom) / 2 - box.top, a: k.width / 2 * 1.18 + 24, b: k.height / 2 * 1.35 + 24 }; });
    const clearOf = (x, y) => Math.min(...keep.map((k) => Math.hypot((x - k.x) / k.a, (y - k.y) / k.b)));
    const maxD = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    field = [];
    for (let y = gap / 2; y < H; y += gap * .87) for (let x = gap / 2 + ((y / gap) % 2 ? gap / 2 : 0); x < W; x += gap) {
      const jx = x + (r() - .5) * gap * .5, jy = y + (r() - .5) * gap * .5, d = Math.hypot(jx - cx, jy - cy);
      const room = smooth(clamp((clearOf(jx, jy) - 1) / .7)) * smooth(clamp((d - hole) / 40));
      if (room <= 0) continue;
      field.push({ x: jx, y: jy, s: (2.2 + r() * 2.6) * (1.15 - .35 * (d / maxD)), rot: r() * Math.PI, shape: pebbleShape(r), dn: d / maxD, jit: r(), room });
    }

    // each place is filled by a lit stone from across town, roughly in its direction
    const pool = field.filter((f) => f.dn > .2 && f.dn < .55 && f.room > .95), rp = rng(77);
    for (const sl of slots) {
      const a = Math.atan2(sl.y - cy, sl.x - cx); let src = null, score = Infinity;
      for (const f of pool) {
        if (f.used) continue;
        const fa = Math.atan2(f.y - cy, f.x - cx), da = Math.abs(Math.atan2(Math.sin(fa - a), Math.cos(fa - a))) + rp() * .35;
        if (da < score) { score = da; src = f; }
      }
      if (!src) continue;                                  // a screen with no room to spare simply gathers fewer
      src.used = true; sl.src = src;
    }
    slots = slots.filter((sl) => sl.src);
    slots.forEach((sl, i) => { sl.t0 = .5 + i * .017; sl.src.leaves = sl.t0; });
  }

  const glowOf = (f) => (.22 + .78 * Math.pow(1 - f.dn, 1.4)) * f.room;
  const litAt = (f) => .06 + (1 - f.dn) * .34 + f.jit * .04;

  function draw() {
    const rect = sec.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;              // off-screen: nothing to redraw
    const p = clamp(-rect.top / (rect.height - innerHeight));
    ctx.clearRect(0, 0, W, H);
    const calm = 1 - .35 * easeInOut(span(p, .5, .9));             // the town quiets so the gathering is what you see

    // the wave travels in from the edges toward the one person
    for (const f of field) {
      const lit = easeOut(span(p, litAt(f), litAt(f) + .07));
      if (f.used && p >= f.leaves) continue;                         // it has stepped out toward the person
      ctx.globalAlpha = .2 * (1 - lit) * f.room; ctx.fillStyle = UNLIT; drawPebble(ctx, f.x, f.y, f.s, f.rot, f.shape);
      ctx.globalAlpha = lit * glowOf(f) * calm; ctx.fillStyle = GOLD; drawPebble(ctx, f.x, f.y, f.s * (1 + lit * .25), f.rot, f.shape);
    }

    // the person is seen
    const seen = easeInOut(span(p, .4, .48));
    ctx.globalAlpha = .55 * (1 - seen); ctx.fillStyle = UNLIT; drawPebble(ctx, cx, cy, R, -.2, centerShape);
    ctx.globalAlpha = seen; ctx.fillStyle = GOLD; drawPebble(ctx, cx, cy, R, -.2, centerShape);
    const rip = span(p, .44, .6);
    ring(ctx, cx, cy, R * (1.4 + rip * 5), (1 - rip) * .7 * (rip > 0 ? 1 : 0), GOLD);
    ring(ctx, cx, cy, R * (1.2 + rip * 3), (1 - rip) * .45 * (rip > 0 ? 1 : 0), GOLD);

    // then people show up, and settle close
    for (const sl of slots) {
      const f = sl.src, t = span(p, sl.t0, sl.t0 + .15); if (t <= 0) continue;
      const k = easeOutBack(t), u = easeOut(t);
      const dx = sl.x - f.x, dy = sl.y - f.y, len = Math.hypot(dx, dy), bend = len * sl.bendK;
      const qx = (f.x + sl.x) / 2 - (dy / len) * bend, qy = (f.y + sl.y) / 2 + (dx / len) * bend;     // a curved approach
      const x = (1 - u) * (1 - u) * f.x + 2 * (1 - u) * u * qx + u * u * sl.x + (sl.x - cx) * (k - u) * .06;
      const y = (1 - u) * (1 - u) * f.y + 2 * (1 - u) * u * qy + u * u * sl.y + (sl.y - cy) * (k - u) * .06;
      const from = glowOf(f) * calm;
      ctx.globalAlpha = from + (.8 - from) * u; ctx.fillStyle = GOLD;    // settles a shade softer, so the person stays brightest
      drawPebble(ctx, x, y, f.s * 1.25 + (sl.s - f.s * 1.25) * u, f.rot + (sl.rot - f.rot) * u,
        f.shape.map(([a, b], j) => [a + (sl.shape[j][0] - a) * u, b + (sl.shape[j][1] - b) * u]));
      const land = span(p, sl.t0 + .12, sl.t0 + .2);                   // a soft ring where it settles
      ring(ctx, sl.x, sl.y, sl.s * (1.1 + land * 1.6), (1 - land) * .5 * (land > 0 ? 1 : 0), GOLD);
    }

    ctx.globalAlpha = 1;
    lineB(span(p, .44, .86));
  }
  build();
  // the words move when the fonts arrive or the window changes, so find the clear zones again
  const again = () => { build(); draw(); };
  addEventListener('resize', again);
  document.fonts?.ready.then(again);
  return draw;
}

const d = gather(document.querySelector('.gather'));
if (d) {
  let queued = false;
  const run = () => { queued = false; d(); };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
  addEventListener('scroll', queue, { passive: true });
  d();
}

// ---------- Small touches further down: each plays once as it comes into view; reduced motion shows it finished ----------

// The nomination window, counted in days (Central time). After Dec 11 the count and the window line give way to her thank-you,
// and the Nominate Someone buttons go (the form itself says it is closed).
function windowCount(el) {
  if (!el) return;
  const c = nominationCount(new Date(), KIM_OPENS, KIM_CLOSES);
  if (!c) { showClosed(document); return; }
  const { n, unit } = c, num = el.querySelector('.num');
  el.querySelector('.said').textContent = `${n} ${unit}`;
  el.querySelector('.unit').textContent = unit;
  num.textContent = REDUCE ? n : 0; el.hidden = false;
  whenSeen(el, (still) => {
    if (still) { num.textContent = n; return; }
    const t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / 700); num.textContent = Math.round(n * easeOut(k)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

// How it works: a gold rule draws through the four steps in order, each number rising as the line reaches it.
function stepsInOrder(ol) {
  if (!ol || REDUCE) return;
  ol.classList.add('pre');
  whenSeen(ol, () => ol.classList.add('in'));
}

// Give: gifts are pooled. A handful of stones drop one by one into a single low pile.
function pooled(box) {
  if (!box) return;
  const W = 340, H = 180, ground = H - 8;
  const stones = heap(2027, 15, W, H);
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('focusable', 'false');
  // Safe: this markup is built only from numbers computed above, never from page or user text.
  svg.innerHTML = `<line x1="24" x2="${W - 24}" y1="${ground}" y2="${ground}" class="ground"/>` +
    stones.map((st, i) => `<path d="${pebblePath(st.shape, st.s)}" style="--x:${st.x.toFixed(1)}px;--y:${st.y.toFixed(1)}px;--r:${st.rot.toFixed(2)}rad;--i:${i}"/>`).join('');
  box.append(svg);
  if (REDUCE) return;
  box.classList.add('pre');
  whenSeen(box, () => box.classList.add('in'));
}

windowCount(document.querySelector('.kim-count'));
stepsInOrder(document.querySelector('.steps'));
pooled(document.querySelector('.give .pool'));
