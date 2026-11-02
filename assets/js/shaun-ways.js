// Why Shaun?: a gold stone drops in beside each of his seven ways when the list comes into view (once),
// and a tap makes that line's stone ripple. Without JavaScript or with reduced motion the stones just sit there.
export function initShaunWays(list, reduce) {
  if (!list) return;
  if (!reduce) {
    list.addEventListener('pointerdown', (e) => {
      const li = e.target.closest && e.target.closest('li');
      if (!li) return;
      li.classList.remove('tapped');
      void li.offsetWidth;   // restart the ripple on a second tap
      li.classList.add('tapped');
    });
  }
  if (reduce || !('IntersectionObserver' in globalThis)) return;
  list.classList.add('js-drop');
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    list.classList.add('in');
    io.disconnect();
  }, { rootMargin: '0px 0px -20% 0px' });
  io.observe(list);
}
