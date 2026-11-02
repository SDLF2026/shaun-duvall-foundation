// The Circle: the section holds still while each of her lines takes the screen in turn.
// Which line is showing, given where the tall track is: first line until it reaches the top, last line at the end.
export function circleIndex(top, height, viewport, count) {
  if (top > viewport * 0.2) return 0;
  const span = height - viewport;
  const p = span > 0 ? Math.min(1, Math.max(0, -top / span)) : 1;
  return Math.min(count - 1, Math.floor(p * count * 1.0001));
}

export function initCircle(track, reduce) {
  if (!track || reduce) return;   // reduced motion and no JS: the plain stanza, every line visible
  const list = track.querySelector('.circle-lines');
  const lines = [...list.children];
  const dots = [...track.querySelectorAll('.circle-count span')];
  let current = -1;
  let pending = false;
  document.documentElement.classList.add('scrolly');
  const update = () => {
    const r = track.getBoundingClientRect();
    const idx = circleIndex(r.top, r.height, innerHeight, lines.length);
    if (idx === current) return;
    current = idx;
    lines.forEach((li, i) => { li.classList.toggle('on', i === idx); li.classList.toggle('past', i < idx); });
    dots.forEach((d, i) => d.classList.toggle('on', i <= idx));
    const li = lines[idx];
    list.style.transform = `translateY(${list.offsetHeight / 2 - (li.offsetTop + li.offsetHeight / 2)}px)`;
  };
  addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  }, { passive: true });
  addEventListener('resize', () => { current = -1; update(); });
  update();
}
