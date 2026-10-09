const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Parse a "YYYY-MM-DD" string as a local date (avoids time-zone shifts).
export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export const todayISO = () => toISODate(new Date());

export function addDaysISO(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = Math.round((parseISODate(checkOut) - parseISODate(checkIn)) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
}

export function formatDate(iso) {
  return parseISODate(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (amount) => currency.format(Number(amount));
export const formatReference = (id) => id.slice(0, 8).toUpperCase();

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
