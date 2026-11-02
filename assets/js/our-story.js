// Our Story page: menu, plus Romans 5:3–5 told one word per screen while her stone rises like the sun.
import { initMenu } from './menu.js';
import { settleRoom } from './layouts.js';
import { REDUCE, clamp, span, smooth, easeInOut, follow } from './stones.js';

initMenu();

function rise(sec) {
  if (!sec || REDUCE) return null;
  sec.classList.add('live');
  const stick = sec.querySelector('.stick'), sun = sec.querySelector('.sun'), words = [...sec.querySelectorAll('.words li')], ref = sec.querySelector('.ref'), lived = sec.querySelector('.lived');
  // Suffering is already there as the screen arrives; each word then hands straight to the next, so no screen is empty
  const ins = [null, [.19, .25], [.39, .45], [.59, .67]], outs = [[.13, .19], [.33, .39], [.53, .59], null];
  // the stone climbs a little under each word, then rises behind Hope   [progress, top as share of the screen]
  const stops = [[0, 1.05], [.19, .95], [.39, .85], [.5, .78], [.72, .33], [1, .33]];
  const topAt = (p) => {
    for (let i = 1; i < stops.length; i++) {
      const [p0, y0] = stops[i - 1], [p1, y1] = stops[i];
      if (p <= p1) return y0 + (y1 - y0) * smooth(span(p, p0, p1));
    }
    return stops[stops.length - 1][1];
  };
  // the sticky screen's own height, not innerHeight: it holds still while a phone's toolbar slides in and out
  const at = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / (r.height - stick.clientHeight)); };
  const draw = (p) => {
    const vh = stick.clientHeight;
    // as her closing line arrives, the stone and Hope settle just below it: measured on this screen, never past the bottom
    const need = lived.offsetTop + lived.offsetHeight + 32 - vh * stops[stops.length - 1][1];
    const spare = vh - 16 - (ref.offsetTop + ref.offsetHeight);
    const room = settleRoom(need, spare) * easeInOut(span(p, .75, .87));
    sun.style.transform = `translateY(${vh * topAt(p) + room}px)`;
    words.forEach((w, i) => {
      const inn = ins[i] ? span(p, ...ins[i]) : 1, out = outs[i] ? span(p, ...outs[i]) : 0, last = i === words.length - 1;
      w.style.opacity = Math.min(inn, 1 - out);
      w.style.transform = `translateY(calc(-50% + ${(1 - inn) * 1.5 - out * 1.5}rem + ${last ? room : 0}px))`;
      w.style.color = last ? 'var(--midnight)' : i === 0 ? 'var(--on-dark-soft)' : 'var(--on-dark)';
    });
    ref.style.opacity = span(p, .67, .73); ref.style.color = 'var(--midnight)'; ref.style.transform = `translateY(${room}px)`;
    lived.style.opacity = span(p, .79, .89);
  };
  return { at, draw };
}

const r = rise(document.querySelector('.rise'));
if (r) {
  // the picture glides after the scroll (about a fifth of a second), so one mouse-wheel click eases in instead of jumping
  let shown = r.at(), last = 0, raf = 0;
  const frame = (t) => {
    const goal = r.at();
    shown = follow(shown, goal, last ? Math.min(t - last, 50) : 16); last = t;
    r.draw(shown);
    raf = shown === goal ? 0 : requestAnimationFrame(frame);
    if (!raf) last = 0;
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  document.fonts?.ready.then(queue);                                 // her paragraph's height depends on the loaded font
  r.draw(shown);
}
