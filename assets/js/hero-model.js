// Pure timing and geometry for the home hero (no DOM, so Node can test it).
// Art coordinates are in the sling image's own pixels (362 × 1000).

export const ART = { W: 362, H: 1000, BEND_FROM: 468, STONE: { x: 82, y: 913, w: 84, h: 66 } };

const START = 350, WIND = 620, REL = START + WIND + 170, FLIGHT = 720, LAND = REL + FLIGHT;
export const T = { START, WIND, REL, FLIGHT, LAND, RIPPLE: 1000, SPLIT0: LAND + 380, STEP: 430, MOVE: 760, LAG: 120 };

export function rng(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export function bez(a, b, c, t) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

// How far the bottom of the pouch has swung sideways at time t (art pixels; + back, − forward).
export function swing(t) {
  let a = t - T.START;
  if (a <= 0) return 0;
  if (a < T.WIND) return 72 * easeInOutSine(a / T.WIND);            // wind up, ending at rest
  a -= T.WIND;
  return 72 * Math.exp(-a / 640) * Math.cos((a * Math.PI) / 330);    // swing through, settle like a pendulum
}

// Offset of a point on the cords at art-y: deeper points swing further and a little later.
export function bendAt(y, t) {
  if (y <= ART.BEND_FROM) return { x: 0, y: 0 };
  const f = (y - ART.BEND_FROM) / (ART.H - ART.BEND_FROM);
  const dx = swing(t - T.LAG * f) * Math.pow(f, 1.25);
  const d = y - ART.BEND_FROM + 40;
  return { x: dx, y: -(dx * dx) / (2 * d) };                         // rising slightly on the arc
}

export const handShift = (t) => swing(t - 40) * 0.06;               // the hand gives a little with the throw

export function blocked(boxes, x, y, pad) {
  return boxes.some((a) => x > a.l - pad && x < a.r + pad && y > a.t - pad && y < a.b + pad);
}

// Where the stones settle: a fan from the full stop toward the hand, close together near the stone and
// thinning out, never on the words or the hand. Same seed, same answer.
export function places({ n, W, H, land, toward, mobile, boxes, rand }) {
  const a0 = Math.atan2(toward.y - land.y, toward.x - land.x);
  const R = mobile ? H * 0.62 : Math.min(W * 0.6, 660);
  const m = mobile ? 20 : 28;
  const pts = [];
  let spacing = mobile ? 20 : 30;
  let tries = 0;
  while (pts.length < n && tries < 20000) {
    tries++;
    const ang = a0 + (rand() - 0.5) * 2.7;
    const r = R * (0.1 + 0.9 * Math.pow(rand(), 0.85));
    const x = land.x + Math.cos(ang) * r;
    const y = land.y + Math.sin(ang) * r;
    if (x < m || x > W - m || y < m || y > H - m || blocked(boxes, x, y, 14)) continue;
    const need = spacing + r * 0.06;
    if (pts.every((p) => Math.hypot(p.x - x, p.y - y) >= need)) pts.push({ x, y, r: r / R });
    if (tries % 4000 === 0) spacing *= 0.85;
  }
  return pts;
}

export function pebble(rand) {
  return Array.from({ length: 9 }, () => 0.8 + rand() * 0.32);
}

// Split the places in half again and again. Each stone heads for the middle of its half, so every division
// moves outward toward where its own descendants settle. Returns every stone except the full stop itself.
export function plan({ points, gen, land, mobile, rand }) {
  const stones = [];
  if (!points.length) return stones;
  (function split(group, depth, parent, born) {
    let cx = 0, cy = 0;
    group.forEach((p) => { cx += p.x; cy += p.y; });
    cx /= group.length; cy /= group.length;
    const far = group.length === 1 ? group[0].r : 0.3;
    const s = {
      x: cx, y: cy, from: parent, g: depth, born, rot: rand() * 6.28, shape: pebble(rand),
      size: (group.length === 1 ? 17 - 8 * far : 19 + group.length * 0.15) * (mobile ? 0.85 : 1),
      ph: rand() * 6.28, ph2: rand() * 6.28, ox: 0, oy: 0, alpha: 1, leaf: false,
    };
    if (depth > 0) stones.push(s);
    if (depth === gen || group.length < 2) { s.leaf = true; return; }
    const xs = group.map((p) => p.x), ys = group.map((p) => p.y);
    const wide = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys);
    const sorted = [...group].sort((a, b) => (wide ? a.x - b.x : a.y - b.y));
    const half = Math.floor(sorted.length / 2);
    const here = depth === 0 ? land : s;
    const next = T.SPLIT0 + depth * T.STEP;
    split(sorted.slice(0, half), depth + 1, here, next);
    split(sorted.slice(half), depth + 1, here, next);
  })(points, 0, null, T.SPLIT0);
  return stones;
}

// When the opening (throw, landing, every division) has finished for a given number of generations.
export const settledBy = (gen) => T.SPLIT0 + (gen - 1) * T.STEP + T.MOVE;

// A stone shows from its birth until it divides into its two children. Leaves and tapped-in extras never divide.
export function visibleAt(s, t) {
  if (t <= s.born) return false;
  return s.leaf || s.extra || t < T.SPLIT0 + s.g * T.STEP;
}
