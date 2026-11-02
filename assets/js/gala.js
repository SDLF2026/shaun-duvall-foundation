// Gala page: menu, the moving moment (the room fills, table by table), and the small touches.
import { initMenu } from './menu.js';
import { initDoors } from './doors.js';
import { daysUntil } from './countdown.js';
import { network } from './layouts.js';
import { REDUCE, clamp, span, easeOut, rng, pebbleShape, drawPebble, words, whenSeen } from './stones.js';

initMenu();

// ---------- Moving moment: an empty room of round tables for eight; as you scroll, guests arrive and the seats light, table by table ----------
function room(sec) {
  if (!sec || REDUCE) return null;
  sec.classList.add('live');
  const canvas = sec.querySelector('.tables'), ctx = canvas.getContext('2d');
  const title = sec.querySelector('.title'), tag = words(sec.querySelector('.tag'));
  const css = getComputedStyle(document.documentElement), tok = (n) => css.getPropertyValue(n).trim();
  const GOLD = tok('--gold'), UNLIT = tok('--unlit'), TOP = tok('--midnight'), SOFT = tok('--on-dark-soft');
  let W, H, tables;

  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const phone = W < 760, r = rng(213), box = canvas.getBoundingClientRect(), t = title.getBoundingClientRect();
    const top = Math.max(H * .42, t.bottom - box.top + (phone ? 40 : 52)), bottom = H * .86;
    const base = phone ? W * .4 : Math.min(W * .2, 300), size = phone ? 32 : 54;
    tables = [];
    for (let i = 0, rows = phone ? 4 : 5; i < rows; i++) {
      const z = i / (rows - 1), k = .38 + .72 * z;                    // 0 = the back of the room, 1 = nearest you
      const y = top + (bottom - top) * Math.pow(z, 1.12), gap = base * k;
      const n = Math.max(1, Math.floor((W * 1.04) / gap) - (i % 2));  // the room runs past the edges; alternate rows sit between
      for (let j = 0; j < n; j++) {
        const x = W / 2 + (j - (n - 1) / 2) * gap + (r() - .5) * gap * .22, ty = y + (r() - .5) * 14 * k;
        const rx = size * k * (.9 + r() * .2), ry = rx * .36, seats = [];
        for (let s = 0; s < 8; s++) {
          const a = s * Math.PI / 4 + Math.PI / 8 + (r() - .5) * .18;
          seats.push({ x: x + Math.cos(a) * rx * 1.36, y: ty + Math.sin(a) * ry * 1.7, behind: Math.sin(a) < 0, s: (phone ? 5 : 7.5) * k * (.9 + r() * .2), rot: r() * Math.PI, shape: pebbleShape(r) });
        }
        // guests arrive from the front of the room, filling it outward and back
        const d = Math.hypot((x - W / 2) / W, (H - ty) / H);
        tables.push({ x, y: ty, rx, ry, z, k, seats, d: d + r() * .12, piece: pebbleShape(r) });
      }
    }
    tables.sort((a, b) => a.d - b.d).forEach((tb, i, all) => { tb.t0 = .05 + (i / Math.max(1, all.length - 1)) * .64; });
    tables.sort((a, b) => a.y - b.y);                                // draw from the back of the room forward
  }

  function seat(st, tb, p, j) {
    const lit = easeOut(span(p, tb.t0 + j * .009, tb.t0 + j * .009 + .03));
    ctx.globalAlpha = .28 * (.55 + .45 * tb.z) * (1 - lit); ctx.fillStyle = UNLIT; drawPebble(ctx, st.x, st.y, st.s, st.rot, st.shape);
    ctx.globalAlpha = lit * (.72 + .28 * tb.z); ctx.fillStyle = GOLD; drawPebble(ctx, st.x, st.y, st.s, st.rot, st.shape);
  }

  function draw() {
    const rect = sec.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;              // off-screen: nothing to redraw
    const p = clamp(-rect.top / (rect.height - innerHeight));
    ctx.clearRect(0, 0, W, H);
    for (const tb of tables) {
      const full = easeOut(span(p, tb.t0 + .07, tb.t0 + .11)), warm = span(p, tb.t0, tb.t0 + .1);
      ctx.globalAlpha = .04 * warm;  ctx.fillStyle = GOLD;              // a soft pool of light under the table as it fills (flat, no gradient)
      ctx.beginPath(); ctx.ellipse(tb.x, tb.y, tb.rx * 2.2, tb.ry * 2.6, 0, 0, Math.PI * 2); ctx.fill();
      tb.seats.forEach((st, j) => { if (st.behind) seat(st, tb, p, j); });
      ctx.globalAlpha = 1; ctx.fillStyle = TOP;                        // the table top
      ctx.beginPath(); ctx.ellipse(tb.x, tb.y, tb.rx, tb.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = SOFT; ctx.globalAlpha = .22 * (1 - full); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.globalAlpha = .45 * full; ctx.stroke();
      ctx.globalAlpha = full; ctx.fillStyle = GOLD;                    // once the table is full, its centrepiece glows
      drawPebble(ctx, tb.x, tb.y - tb.ry * .15, (W < 760 ? 4.5 : 6.5) * tb.k, .3, tb.piece);
      tb.seats.forEach((st, j) => { if (!st.behind) seat(st, tb, p, j); });
    }
    ctx.globalAlpha = 1;
    tag(span(p, .78, .94));
  }
  build();
  // the title block moves when the fonts arrive or the window changes, so lay the room out again below it
  const again = () => { build(); draw(); };
  addEventListener('resize', again);
  document.fonts?.ready.then(again);
  return draw;
}

const d = room(document.querySelector('.room'));
if (d) {
  let queued = false;
  const run = () => { queued = false; d(); };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
  addEventListener('scroll', queue, { passive: true });
  d();
}

// ---------- Small touches: each plays once as it comes into view; reduced motion shows it finished ----------

// Days until the Gala (Central time, as on the home page), counting up once it's in view. Hidden after the Gala.
function count(el) {
  if (!el) return;
  const n = daysUntil(new Date(el.dataset.until), new Date());
  if (n <= 0) return;
  const unit = n === 1 ? 'day' : 'days', num = el.querySelector('.num');
  el.querySelector('.said').textContent = `${n} ${unit}`;
  el.querySelector('.unit').textContent = unit;
  num.textContent = REDUCE ? n : 0; el.hidden = false;
  whenSeen(el, (still) => {
    if (still) { num.textContent = n; return; }
    const t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / 900); num.textContent = Math.round(n * easeOut(k)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

// Underwriting: her SPONSORED stamp presses onto each row that has sold.
function stamps(list) {
  if (!list || REDUCE || !list.querySelector('.stamp')) return;
  list.classList.add('pre');
  whenSeen(list, () => list.classList.add('in'));
}

// Beside "it is to multiply it.": one stone becomes a living network as you read down
// (her Blueprint: the Gala should "show the living network of people"). Your scroll drives it; reduced motion shows it grown.
function growNetwork(box) {
  if (!box) return;
  const canvas = document.createElement('canvas'); box.append(canvas);
  const ctx = canvas.getContext('2d'), css = getComputedStyle(document.documentElement);
  const GOLD = css.getPropertyValue('--gold').trim(), INK = css.getPropertyValue('--gold-ink').trim();
  let W, H, nodes;
  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = box.clientWidth; H = box.clientHeight;
    if (!W || !H) { nodes = []; return; }                              // hidden on phones
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes = network(1213, 5, W, H);
  }
  function draw(p) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = INK;
    for (const n of nodes) {                                           // the line reaches out first…
      if (n.parent === null) continue;
      const u = easeOut(span(p, n.t0, n.t0 + .12)); if (u <= 0) continue;
      const q = nodes[n.parent]; ctx.globalAlpha = .35;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + (n.x - q.x) * u, q.y + (n.y - q.y) * u); ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    for (const n of nodes) {                                           // …then the new stone appears at its end
      const u = n.parent !== null ? easeOut(span(p, n.t0 + .08, n.t0 + .16)) : 1; if (u <= 0) continue;
      ctx.globalAlpha = 1; drawPebble(ctx, n.x, n.y, n.s * u, n.rot, n.shape);
    }
    ctx.globalAlpha = 1;
  }
  // from when it enters the screen until its middle reaches 40% of the way down
  const progress = () => {
    if (REDUCE) return 1;
    const rc = box.getBoundingClientRect();
    return clamp((innerHeight - rc.top) / (innerHeight * .6 + rc.height / 2));
  };
  build(); draw(progress());
  let queued = false;
  const run = () => { queued = false; const r = box.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; draw(progress()); };
  if (!REDUCE) addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener('resize', () => { build(); draw(progress()); });
}

growNetwork(document.querySelector('.why-gala .net'));
count(document.querySelector('.gala-count'));
document.querySelectorAll('.tiers').forEach((list) => initDoors(list, REDUCE));
stamps(document.querySelector('.ledger'));
