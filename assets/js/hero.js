// The home hero. The hand stays put; only the cords bend, the pouch lagging like real rope. At the fastest point
// of the swing her own stone leaves the pouch, spins across and becomes the gold full stop of "multiply it."
// A ripple spreads (her ripple icon), then the stone divides 1 → 2 → 4 … into small gold stones around the words.
import { ART, T, rng, easeOut, bez, bendAt, handShift, places, plan, pebble, visibleAt, settledBy } from './hero-model.js';

const GOLD = '242,183,77';
const MAX_EXTRA = 40;

export function initHero(hero, reduce) {
  if (!hero) return;
  const cv = hero.querySelector('.net');
  const img = hero.querySelector('.sling');
  const h1 = hero.querySelector('h1');
  const dot = hero.querySelector('.stone');
  const ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;
  const art = new Image();
  const stoneArt = new Image();
  art.src = new URL('../img/sling-empty.png', import.meta.url).href;
  stoneArt.src = new URL('../img/stone.png', import.meta.url).href;

  const drawHand = !reduce;
  const pointer = { x: -999, y: -999 };
  let W, H, mobile, k, hand, gen, land, avoid, rand, release;
  let stones = [];
  let t0 = 0, raf = 0, visible = true;
  let inside = false, drift = 0;
  let built = false;               // nothing is drawn until the page has been measured   // stones float only while the pointer is over the hero (WCAG 2.2.2)

  // Boxes the stones stay out of: each line of the headline, the lede, the buttons, the hand.
  function boxes() {
    const hr = hero.getBoundingClientRect();
    const out = [];
    const add = (r, pad) => out.push({ l: r.left - hr.left - pad, t: r.top - hr.top - pad, r: r.right - hr.left + pad, b: r.bottom - hr.top + pad });
    [h1.querySelector('.s1').firstChild, h1.querySelector('.s2').firstChild].forEach((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      [...range.getClientRects()].forEach((r) => add(r, 12));
    });
    add(hero.querySelector('.lede').getBoundingClientRect(), 10);
    hero.querySelectorAll('.actions > *').forEach((el) => add(el.getBoundingClientRect(), 10));
    out.push({ l: hand.x + 20 * k, t: hand.y, r: hand.x + (ART.W - 20) * k, b: hand.y + ART.H * k });
    return out;
  }

  function stoneRest(t) {
    const S = ART.STONE, cy = S.y + S.h / 2, o = bendAt(cy, t), hs = handShift(t);
    return { x: hand.x + (S.x + S.w / 2 + o.x + hs) * k, y: hand.y + (cy + o.y) * k };
  }

  function drawArt(t) {
    const hs = handShift(t) * k;
    ctx.drawImage(art, 0, 0, ART.W, ART.BEND_FROM, hand.x + hs, hand.y, ART.W * k, ART.BEND_FROM * k);  // the fist, in one piece
    for (let y = ART.BEND_FROM; y < ART.H; y += 3) {                                                       // the cords, slice by slice
      const o = bendAt(y + 1.5, t), h = Math.min(3, ART.H - y);
      ctx.drawImage(art, 0, y, ART.W, h, hand.x + hs + o.x * k, hand.y + (y + o.y) * k, ART.W * k, h * k + 0.6);
    }
  }

  function drawStone(x, y, scale, angle) {
    const w = ART.STONE.w * scale, h = ART.STONE.h * scale;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.drawImage(stoneArt, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // a small solid gold stone, like the full stop
  function drawPebble(x, y, size, rot, alpha, shape) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = `rgba(${GOLD},${alpha})`;
    ctx.beginPath();
    for (let i = 0; i <= shape.length; i++) {
      const j = i % shape.length, a = (j / shape.length) * 6.283, r = (size / 2) * shape[j];
      const px = Math.cos(a) * r * 1.15, py = Math.sin(a) * r * 0.88;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.quadraticCurveTo(Math.cos(a - 0.35) * r * 1.2, Math.sin(a - 0.35) * r * 0.92, px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function build() {
    rand = rng(5);
    const hr = hero.getBoundingClientRect(), sr = dot.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hr.width; H = hr.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W <= 900; gen = mobile ? 4 : 5;   // matches the stacked hero layout in site.css
    hand = { x: img.offsetLeft, y: img.offsetTop };      // offset* ignore transforms, so the hand is measured at rest
    k = img.offsetWidth / ART.W;
    land = { x: sr.left - hr.left + sr.width / 2, y: sr.top - hr.top + sr.height / 2, r: sr.width / 2 };
    avoid = boxes();
    const toward = { x: hand.x + ART.W * k * 0.5, y: hand.y + ART.H * k * 0.55 };
    stones = plan({ points: places({ n: 2 ** gen, W, H, land, toward, mobile, boxes: avoid, rand }), gen, land, mobile, rand });
    release = stoneRest(T.REL);
    built = true;
  }

  function stoneAt(s, t, now) {
    if (!visibleAt(s, t)) return null;
    const p = (t - s.born) / T.MOVE, e = easeOut(Math.min(1, p)), f = s.from;
    let x = f.x + (s.x - f.x) * e, y = f.y + (s.y - f.y) * e;
    if (p >= 1 && !reduce) {                    // settled: float gently, and give way to the pointer
      const dx = x - pointer.x, dy = y - pointer.y, d = Math.hypot(dx, dy), push = d < 110 ? (1 - d / 110) * 22 : 0;
      s.ox += ((d ? dx / d : 0) * push - s.ox) * 0.12;
      s.oy += ((d ? dy / d : 0) * push - s.oy) * 0.12;
      x += Math.sin(now / 2600 + s.ph) * 3 * drift + s.ox;
      y += Math.cos(now / 3100 + s.ph2) * 3 * drift + s.oy;
    }
    return { x, y, size: s.size * (0.6 + 0.4 * e), rot: s.rot, a: s.alpha * Math.min(1, p * 3) };
  }

  function draw(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) {               // the ripple where the stone lands
      const rp = (t - T.LAND - i * 150) / T.RIPPLE;
      if (rp > 0 && rp < 1) {
        ctx.strokeStyle = `rgba(${GOLD},${0.55 * (1 - rp)})`; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(land.x, land.y, land.r + easeOut(rp) * (mobile ? 48 : 78) * (1 + i * 0.3), 0, 6.283); ctx.stroke();
      }
    }
    stones.forEach((s) => { const q = stoneAt(s, t, now); if (q) drawPebble(q.x, q.y, q.size, q.rot, q.a, s.shape); });
    if (drawHand) drawArt(t);
    if (drawHand && t < T.REL) {                // the stone: in the pouch, in flight, then it is the full stop
      const r0 = stoneRest(t); drawStone(r0.x, r0.y, k, 0);
    } else if (t < T.LAND) {
      const kf = Math.min(1, (t - T.REL) / T.FLIGHT), e = easeOut(kf);
      const c = { x: release.x + (land.x - release.x) * 0.38, y: Math.min(release.y, land.y) - H * (mobile ? 0.14 : 0.26) };
      const q = bez(release, land, c, e), end = (land.r * 2) / ART.STONE.w;
      for (let j = 8; j > 0; j--) {             // a short, fading trail
        const qq = bez(release, land, c, Math.max(0, e - j * 0.012));
        ctx.fillStyle = `rgba(${GOLD},${0.35 * (1 - j / 8)})`;
        ctx.beginPath(); ctx.arc(qq.x, qq.y, Math.max(1, land.r * (1 - j / 10)), 0, 6.283); ctx.fill();
      }
      drawStone(q.x, q.y, k + (end - k) * Math.pow(kf, 1.4), -kf * Math.PI * 3);
    }
    if (t >= T.LAND && !h1.classList.contains('landed')) h1.classList.add('landed');
  }

  // A tap near a stone sends a new one out toward the tap: you multiply it yourself.
  function multiplyAt(now, x, y) {
    const t = now - t0;
    if (t < settledBy(gen)) return;
    let best = null, bestD = Infinity;
    stones.forEach((s) => {
      if (s.leaving) return;
      const q = stoneAt(s, t, now); if (!q) return;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bestD) { bestD = d; best = q; }
    });
    if (!best || bestD > 160) return;
    const a = Math.atan2(y - best.y, x - best.x) + (rand() - 0.5) * 0.6, dist = 40 + rand() * 50;
    stones.push({
      x: Math.min(W - 16, Math.max(16, best.x + Math.cos(a) * dist)), y: Math.min(H - 16, Math.max(16, best.y + Math.sin(a) * dist)),
      from: { x: best.x, y: best.y }, g: gen + 1, born: t, size: (9 + rand() * 3) * (mobile ? 0.85 : 1), rot: rand() * 6.28,
      shape: pebble(rand), ph: rand() * 6.28, ph2: rand() * 6.28, ox: 0, oy: 0, alpha: 1, extra: true,
    });
    const extras = stones.filter((s) => s.extra && !s.leaving);
    if (extras.length > MAX_EXTRA) extras[0].leaving = now;
    start();
  }

  function tick(now) {
    raf = 0;
    if (!visible) return;
    stones.forEach((s) => { if (s.leaving) s.alpha = Math.max(0, 1 - (now - s.leaving) / 900); });
    drift += ((inside ? 1 : 0) - drift) * 0.05;
    draw(now);
    // Keep drawing only while something is moving: the opening, the pointer, a push settling, a new stone.
    const t = now - t0;
    const busy = t < settledBy(gen) + 200 || inside || drift > 0.01 ||
      stones.some((s) => Math.abs(s.ox) > 0.05 || Math.abs(s.oy) > 0.05 || (s.leaving && s.alpha > 0) || (s.extra && t - s.born < T.MOVE + 50));
    raf = busy ? requestAnimationFrame(tick) : 0;
  }
  const start = () => { if (!raf && visible && built) raf = requestAnimationFrame(tick); };
  const still = () => { build(); t0 = performance.now() - 60000; h1.classList.add('landed'); draw(performance.now()); };
  const loaded = (im) => (im.complete ? null : new Promise((r) => { im.addEventListener('load', r); im.addEventListener('error', r); }));

  // The full stop's position depends on the web font, so wait for it and for the art.
  Promise.all([document.fonts ? document.fonts.ready : null, loaded(img), loaded(art), loaded(stoneArt)]).then(() => {
    if (reduce) { still(); return; }            // a still picture: her hand image, the full stop, the stones in place
    hero.classList.add('canvas-hand');          // the canvas now draws the hand, so the cords can bend
    build(); t0 = performance.now(); start();
  });

  if (!reduce) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting && !document.hidden; if (visible) start(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) start(); });
    hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; inside = true; start(); });
    hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; inside = false; start(); });
    hero.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      const r = hero.getBoundingClientRect(); multiplyAt(performance.now(), e.clientX - r.left, e.clientY - r.top);
    });
  }
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { still(); start(); }, 150); });
}
