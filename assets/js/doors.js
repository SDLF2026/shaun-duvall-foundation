// Ways to Get Involved: each door opens on tap or click to one line of her words and its action.
// Without JavaScript every door stays open (see .doors-js in site.css).
export function initDoors(list, reduce) {
  if (!list) return;
  list.classList.add('doors-js');
  list.querySelectorAll('.door').forEach((door) => {
    const btn = door.querySelector('.row');
    const panel = door.querySelector('.panel');
    btn.setAttribute('aria-expanded', 'false');
    panel.inert = true;
    btn.addEventListener('click', () => {
      const open = !door.classList.contains('open');
      door.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
    });
  });
  if (reduce || !('IntersectionObserver' in window)) return;
  // The rows rise into place once, right after the Circle's last line.
  list.classList.add('reveal');
  [...list.children].forEach((li, i) => { li.style.transitionDelay = `${i * 60}ms`; });
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    list.classList.add('in');
    io.disconnect();
    setTimeout(() => [...list.children].forEach((li) => { li.style.transitionDelay = ''; }), 900);
  }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(list);
}
