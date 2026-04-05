const EPOCH = new Date('2026-04-05T00:00:00Z');

/**
 * Returns the number of days since the epoch (2026-01-01).
 */
export function daysSinceEpoch(date = new Date()) {
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcEpoch = Date.UTC(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
  return Math.floor((utcDate - utcEpoch) / (1000 * 60 * 60 * 24));
}

/**
 * Returns the day of the week: 0 = Monday, 6 = Sunday.
 */
export function dayOfWeek(date = new Date()) {
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1; // Convert Sun=0..Sat=6 to Mon=0..Sun=6
}

/**
 * Returns the day name.
 */
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export function dayName(date = new Date()) {
  return DAY_NAMES[dayOfWeek(date)];
}

/**
 * Returns the number of scramble moves for a given date.
 * Monday = 1, Sunday = 7.
 */
export function scrambleMoves(date = new Date()) {
  return dayOfWeek(date) + 1;
}

/**
 * Returns a date string in YYYY-MM-DD format (UTC).
 */
export function dateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
