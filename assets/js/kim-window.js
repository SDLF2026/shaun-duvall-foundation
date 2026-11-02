// The Kindness in Motion nomination window (Central time), and what both pages show once it has closed.
export const KIM_OPENS = new Date('2026-11-01T00:00:00-05:00');
export const KIM_CLOSES = new Date('2026-12-11T23:59:00-06:00');

// After Dec 11: her thank-you replaces the invitation, the window line and the count; Nominate Someone buttons go.
export function showClosed(root) {
  root.querySelectorAll('.closed').forEach((el) => el.removeAttribute('hidden'));
  root.querySelectorAll('.window, .kim-count, .kim-invite, [data-link="kim-nominate"]').forEach((el) => el.setAttribute('hidden', ''));
}
