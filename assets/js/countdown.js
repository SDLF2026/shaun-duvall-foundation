// Calendar days until the Gala, counted in Central time (where the Gala is). 0 on Gala day and
// negative after, so the count hides itself.
const central = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayNumber = (d) => { const [y, m, day] = central.format(d).split('-').map(Number); return Date.UTC(y, m - 1, day) / 86400000; };

export function daysUntil(target, now) {
  return dayNumber(target) - dayNumber(now);
}

export function initCountdown(el) {
  if (!el) return;
  const days = daysUntil(new Date(el.dataset.until), new Date());
  if (days <= 0) return;
  el.querySelector('.num').textContent = String(days);
  el.querySelector('.unit').textContent = days === 1 ? 'day' : 'days';
  el.hidden = false;
}
