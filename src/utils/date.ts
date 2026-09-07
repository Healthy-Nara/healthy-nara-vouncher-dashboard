export const MYANMAR_TZ = 'Asia/Yangon';

/**
 * Format a Date or date string to YYYY-MM-DD in Myanmar timezone
 */
export const getMyanmarDateString = (d: Date | string | number = new Date()): string => {
  if (!d) return '';
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MYANMAR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
};

/**
 * Format a Date or date string to YYYY-MM-DDTHH:mm in Myanmar timezone for datetime-local inputs
 */
export const getMyanmarDateTimeInputString = (d: Date | string | number = new Date()): string => {
  if (!d) return '';
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const datePart = new Intl.DateTimeFormat('en-CA', {
    timeZone: MYANMAR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: MYANMAR_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dateObj);
  return `${datePart}T${timePart}`;
};

/**
 * Format a date in Myanmar format DD/MM/YYYY
 */
export const formatMyanmarDate = (d: Date | string | number): string => {
  if (!d) return '—';
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: MYANMAR_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
};
