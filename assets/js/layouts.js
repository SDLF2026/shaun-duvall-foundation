// The page layouts as plain data (no DOM, no canvas), so they can be tested.
import { daysUntil } from './countdown.js';
import { clamp, rng, pebbleShape } from './stones.js';

// The nomination window, counted in days (Central time). Null once it has closed.
export const nominationCount = (now, opens, closes) => {
  const toOpen = daysUntil(opens, now), left = daysUntil(closes, now) + 1;
  if (toOpen > 0) return { n: toOpen, unit: toOpen === 1 ? 'day until nominations open' : 'days until nominations open' };
  if (left > 0) return { n: left, unit: left === 1 ? 'day left to nominate' : 'days left to nominate' };
  return null;
};

// Gifts are pooled: each stone drops near the middle and rolls off any single stone it lands on until it rests.
export function heap(seed, count, w, h) {
  const r = rng(seed), ground = h - 8, stones = [];
  for (let i = 0; i < count; i++) {
    const size = 13 + r() * 10, rad = size * .86;
    const restAt = (x) => {
      let y = ground - rad, on = [];
      for (const q of stones) {
        const dx = Math.abs(x - q.x), reach = rad + q.rad - 1;
        if (dx >= reach) continue;
        const cy = q.y - Math.sqrt(reach * reach - dx * dx);
        if (cy < y - 2) { y = cy; on = [q]; } else if (Math.abs(cy - y) <= 2) on.push(q);
      }
      return { y, on };
    };
    // it has settled on the ground, or between two stones (not hanging off one side)
    const settled = ({ on }, x) => on.length === 0 || (on.length > 1 && x > Math.min(...on.map((q) => q.x)) && x < Math.max(...on.map((q) => q.x)));
    let x = clamp(w / 2 + (r() + r() + r() - 1.5) * 70, 30, w - 30), rest = restAt(x);
    for (let k = 0; k < 200 && !settled(rest, x); k++) { const mx = rest.on.reduce((a, q) => a + q.x, 0) / rest.on.length; x += x < mx ? -.75 : .75; rest = restAt(x); }
    stones.push({ x, y: rest.y, rad, s: size, rot: (r() - .5) * 1, shape: pebbleShape(r) });
  }
  return stones;
}

// One stone becomes a living network: each stone gives rise to two, each taking an uneven share of the space around it.
export function network(seed, generations, w, h) {
  const r = rng(seed), G = generations, R = Math.min(w, h) * .44, cx = w / 2, cy = h / 2;
  const nodes = [{ x: cx, y: cy, g: 0, s: 17, shape: pebbleShape(r), rot: r() * 3, t0: 0, parent: null }];
  const grow = (ni, a0, a1) => {
    const n = nodes[ni];
    if (n.g === G) return;
    const cut = a0 + (a1 - a0) * (.38 + r() * .24);
    for (const [b0, b1] of [[a0, cut], [cut, a1]]) {
      const g = n.g + 1, th = (b0 + b1) / 2 + (r() - .5) * (b1 - b0) * .35, rad = R * Math.pow(g / G, .85) * (.88 + r() * .24);
      nodes.push({ x: cx + Math.cos(th) * rad, y: cy + Math.sin(th) * rad, g, s: 12 * Math.pow(.76, g) + 1.6, parent: ni, shape: pebbleShape(r), rot: r() * 3, t0: ((g - 1) / G) * .82 + r() * .05 });
      grow(nodes.length - 1, b0, b1);
    }
  };
  const start = r() * Math.PI * 2; grow(0, start, start + Math.PI * 2);
  return nodes;
}

// How far a block moves down to settle: as far as needed, never past the room left.
export const settleRoom = (need, spare) => clamp(need, 0, Math.max(0, spare));
