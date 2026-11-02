import { initMenu } from './menu.js';
import { initHero } from './hero.js';
import { initCircle } from './circle.js';
import { initDoors } from './doors.js';
import { initYear } from './year.js';
import { initCountdown } from './countdown.js';
import { initShaunWays } from './shaun-ways.js';
import { nominationCount } from './layouts.js';
import { KIM_OPENS, KIM_CLOSES, showClosed } from './kim-window.js';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

initMenu();
initHero(document.querySelector('.hero'), REDUCE);
initCircle(document.querySelector('.circle-track'), REDUCE);
initDoors(document.querySelector('.program'), REDUCE);
initYear(document.querySelector('.year'), REDUCE);
initCountdown(document.querySelector('.countdown'));
initShaunWays(document.querySelector('.shaun-ways'), REDUCE);

// After Dec 11 the Kindness in Motion spots thank people instead of inviting nominations (same dates as that page).
if (!nominationCount(new Date(), KIM_OPENS, KIM_CLOSES)) showClosed(document);
