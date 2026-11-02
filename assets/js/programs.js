// Programs page: menu, plus the page's two scroll-driven moments.
import { initMenu } from './menu.js';
import { REDUCE, clamp, span, easeOut, easeInOut, rng, pebbleShape, pebblePath, whenSeen } from './stones.js';

initMenu();
const progress = (sec) => { const r = sec.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

function twoPaths(sec) {
  if (!sec || REDUCE) return null;
  sec.classList.add('live');
  const L = sec.querySelector('.left'), R = sec.querySelector('.right'), one = sec.querySelector('.one'), seam = sec.querySelector('.seam');
  const h = one.querySelector('h2'), two = one.querySelector('.two'), heart = one.querySelector('.heart');
  return () => {
    const p = progress(sec), portrait = innerWidth <= 760;
    const close = easeOut(span(p, .14, .42)) * 50, open = easeOut(span(p, .46, .7)) * 50;
    if (portrait) {
      L.style.clipPath = `inset(${close}% 0 50% 0)`; R.style.clipPath = `inset(50% 0 ${close}% 0)`;
      one.style.clipPath = `inset(${50 - open}% 0 ${50 - open}% 0)`;
    } else {
      L.style.clipPath = `inset(0 50% 0 ${close}%)`; R.style.clipPath = `inset(0 ${close}% 0 50%)`;
      one.style.clipPath = `inset(0 ${50 - open}% 0 ${50 - open}%)`;
    }
    seam.style.opacity = p > .36 && p < .5 ? 1 : 0;
    L.querySelector('.in').style.opacity = R.querySelector('.in').style.opacity = 1 - span(p, .03, .15);
    h.style.opacity = span(p, .56, .7); h.style.transform = `translateY(${(1 - easeOut(span(p, .56, .72))) * 2}rem)`;
    two.style.opacity = span(p, .74, .84); heart.style.opacity = span(p, .84, .94);
  };
}

function yearSlides(sec) {
  if (!sec || REDUCE) return null;
  sec.classList.add('live');
  const track = sec.querySelector('.track'), stone = sec.querySelector('.stone'), rail = sec.querySelector('.rail'), stick = sec.querySelector('.stick');
  const n = track.children.length;
  for (let i = 0; i < n; i++) { const t = document.createElement('span'); t.className = 'tick'; t.style.left = `${(i / (n - 1)) * 100}%`; rail.append(t); }
  const kids = [[-30, -34], [6, -50], [34, -28], [-12, -62], [24, -70]].map(([x, y]) => {
    const k = document.createElement('span'); k.className = 'kid'; k.dataset.x = x; k.dataset.y = y; k.setAttribute('aria-hidden', 'true'); stick.append(k); return k;
  });
  return () => {
    const p = progress(sec), pos = p * (n - 1), i = Math.floor(pos), f = pos - i;
    const k = Math.min(n - 1, i + easeInOut(clamp((f - .25) / .5)));
    track.style.transform = `translateX(${-k * innerWidth}px)`;
    const rr = rail.getBoundingClientRect(), sr = stick.getBoundingClientRect(), x = rr.left - sr.left + rr.width * (k / (n - 1));
    stone.style.left = `${x}px`;
    const end = clamp((p - .94) / .06);
    kids.forEach((kd) => { kd.style.left = `${x + end * kd.dataset.x - 5}px`; kd.style.top = `${rr.top - sr.top + end * kd.dataset.y - 5}px`; kd.style.opacity = end; });
  };
}

// Beside "…can multiply for a lifetime.": a stone dropped in still water; its rings spread once as it comes into view.
function ripple(box) {
  if (!box) return;
  const rings = [30, 58, 90, 126].map((rx, i) => `<ellipse class="ring" cx="150" cy="86" rx="${rx}" ry="${(rx * .3).toFixed(1)}" style="--i:${i};--o:${[.6, .42, .28, .16][i]}"/>`).join('');
  // Safe: this markup is built only from the numbers above, never from page or user text.
  box.innerHTML = `<svg viewBox="0 0 300 150" focusable="false">${rings}<g transform="translate(150 78) rotate(-12)"><path class="stone" d="${pebblePath(pebbleShape(rng(9)), 15)}"/></g></svg>`;
  if (REDUCE) return;
  box.classList.add('pre');
  whenSeen(box, () => box.classList.add('in'));
}
ripple(document.querySelector('.invest .ripple'));

const draws = [twoPaths(document.querySelector('.tp')), yearSlides(document.querySelector('.yr'))].filter(Boolean);
let queued = false;
const draw = () => { queued = false; draws.forEach((d) => d()); };
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue);
draw();
