// The Legacy Year timeline: swipe or scroll the stops; arrows step one stop; the ruler fills as you go.
export function yearProgress(scrollLeft, scrollWidth, clientWidth) {
  const max = scrollWidth - clientWidth;
  const p = max > 0 ? scrollLeft / max : 1;
  return 0.08 + 0.92 * Math.min(1, Math.max(0, p));
}

export function initYear(root, reduce) {
  if (!root) return;
  const stops = root.querySelector('.stops');
  const fill = root.querySelector('.ruler .fill');
  const prev = root.querySelector('.year-nav [data-dir="-1"]');
  const next = root.querySelector('.year-nav [data-dir="1"]');
  const update = () => {
    const max = stops.scrollWidth - stops.clientWidth;
    fill.style.setProperty('--p', yearProgress(stops.scrollLeft, stops.scrollWidth, stops.clientWidth).toFixed(3));
    // aria-disabled, not disabled: a disabled button drops keyboard focus to the page
    prev.setAttribute('aria-disabled', String(stops.scrollLeft < 4));
    next.setAttribute('aria-disabled', String(stops.scrollLeft > max - 4));
  };
  [prev, next].forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled') === 'true') return;
    const gap = parseFloat(getComputedStyle(stops).columnGap) || 0;
    const step = stops.firstElementChild.getBoundingClientRect().width + gap;
    stops.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' });
  }));
  stops.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}
