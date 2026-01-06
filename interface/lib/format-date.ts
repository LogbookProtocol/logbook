export type DateFormat = 'auto' | 'us' | 'eu' | 'iso';
export type TimeFormat = 'auto' | '12h' | '24h';

const DATE_FORMAT_KEY = 'logbook-date-format';
const TIME_FORMAT_KEY = 'logbook-time-format';

/**
 * Get the current date format from localStorage
 */
export function getDateFormat(): DateFormat {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(DATE_FORMAT_KEY);
  if (stored && (stored === 'auto' || stored === 'us' || stored === 'eu' || stored === 'iso')) {
    return stored;
  }
  return 'auto';
}

/**
 * Set the date format in localStorage and dispatch change event
 */
export function setDateFormat(format: DateFormat): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DATE_FORMAT_KEY, format);
    window.dispatchEvent(new CustomEvent('date-format-changed', { detail: { format } }));
  }
}

/**
 * Get the current time format from localStorage
 */
export function getTimeFormat(): TimeFormat {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(TIME_FORMAT_KEY);
  if (stored && (stored === 'auto' || stored === '12h' || stored === '24h')) {
    return stored;
  }
  return 'auto';
}

/**
 * Set the time format in localStorage and dispatch change event
 */
export function setTimeFormat(format: TimeFormat): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TIME_FORMAT_KEY, format);
    window.dispatchEvent(new CustomEvent('date-format-changed', { detail: { format } }));
  }
}

/**
 * Get short timezone abbreviation (e.g., "UTC+3", "PST", "EST")
 */
export function getTimezoneAbbr(): string {
  const date = new Date();
  // Try to get timezone abbreviation from Intl
  const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  if (tzPart) {
    return tzPart.value;
  }
  // Fallback to UTC offset
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.abs(Math.floor(offset / 60));
  const minutes = Math.abs(offset % 60);
  return minutes ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `UTC${sign}${hours}`;
}

/**
 * Format a date string according to user's preference
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const format = getDateFormat();

  if (format === 'auto') {
    // Use browser's Intl API for automatic locale detection
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'eu':
      return `${day}.${month}.${year}`;
    case 'iso':
      return `${year}-${month}-${day}`;
    case 'us':
      return `${month}/${day}/${year}`;
  }
}

/**
 * Format a date string with time according to user's preference
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date and time string with timezone
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const dateFormat = getDateFormat();
  const timeFormat = getTimeFormat();
  const tz = getTimezoneAbbr();

  // If both are auto, use full Intl formatting
  if (dateFormat === 'auto' && timeFormat === 'auto') {
    const formatted = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    return `${formatted} ${tz}`;
  }

  // Format date part
  let datePart: string;
  if (dateFormat === 'auto') {
    datePart = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    switch (dateFormat) {
      case 'eu':
        datePart = `${day}.${month}.${year}`;
        break;
      case 'iso':
        datePart = `${year}-${month}-${day}`;
        break;
      case 'us':
        datePart = `${month}/${day}/${year}`;
        break;
    }
  }

  // Format time part
  let timePart: string;
  if (timeFormat === 'auto') {
    timePart = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } else {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    if (timeFormat === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      timePart = `${hours12}:${minutes} ${period}`;
    } else {
      timePart = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  return `${datePart}, ${timePart} ${tz}`;
}

/**
 * Format end date/time with "until end of" clarification
 * Used for displaying campaign end times from UTC ISO strings
 * @param dateString - ISO date string (e.g., "2025-02-15T23:59:59Z")
 * @returns Formatted string like "01/15/2025, until end of 23:59 UTC+3"
 */
export function formatEndDateTime(dateString: string): string {
  const { datePart, timePart } = formatEndDateTimeParts(dateString);
  return `${datePart}, ${timePart}`;
}

/**
 * Format end date/time into separate parts for styled rendering
 * @param dateString - ISO date string (e.g., "2025-02-15T23:59:59Z")
 * @returns Object with datePart and timePart (including "until end of" prefix)
 */
export function formatEndDateTimeParts(dateString: string): { datePart: string; timePart: string } {
  const date = new Date(dateString);
  const dateFormat = getDateFormat();
  const tz = getTimezoneAbbr();

  // Format date part
  let datePart: string;
  if (dateFormat === 'auto') {
    datePart = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    switch (dateFormat) {
      case 'eu':
        datePart = `${day}.${month}.${year}`;
        break;
      case 'iso':
        datePart = `${year}-${month}-${day}`;
        break;
      case 'us':
        datePart = `${month}/${day}/${year}`;
        break;
    }
  }

  // Format time part with "until end of" clarification
  const timePart = `until end of ${formatTime(date)} ${tz}`;

  return { datePart, timePart };
}

/**
 * Convert a local date (YYYY-MM-DD) to end of day (23:59:59) in UTC ISO string
 * Used when creating campaigns - user picks a date, we set end of day in their timezone
 * @param dateString - Date in YYYY-MM-DD format (from date picker)
 * @returns ISO string in UTC (e.g., "2025-01-03T20:59:59.999Z" for UTC+3)
 */
export function localDateToEndOfDayUTC(dateString: string): string {
  // Parse the date string as local date
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at 23:59:59.999 in local timezone
  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  // Return as UTC ISO string
  return localEndOfDay.toISOString();
}

/**
 * Format time according to user's preference
 * @param date - Date object
 * @returns Time string like "23:59" or "11:59 PM"
 */
export function formatTime(date: Date): string {
  const timeFormat = getTimeFormat();

  if (timeFormat === 'auto') {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (timeFormat === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  }

  // 24h format
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Get the end time display for a date in local timezone
 * Shows what time the campaign will end in the user's local time
 * Uses "until end of" phrasing to clarify the campaign ends AFTER the minute expires
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Time string like "until end of 23:59 UTC+3" or "until end of 11:59 PM PST"
 */
export function getEndTimeDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59);
  return `until end of ${formatTime(localEndOfDay)} ${getTimezoneAbbr()}`;
}

/**
 * Get available date format options for settings UI
 */
export function getDateFormatOptions(): { value: DateFormat; label: string; example: string }[] {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();

  const autoExample = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);

  return [
    { value: 'auto', label: 'Auto', example: autoExample },
    { value: 'us', label: 'American', example: `${month}/${day}/${year}` },
    { value: 'eu', label: 'European', example: `${day}.${month}.${year}` },
    { value: 'iso', label: 'ISO', example: `${year}-${month}-${day}` },
  ];
}

/**
 * Get available time format options for settings UI
 */
export function getTimeFormatOptions(): { value: TimeFormat; label: string; example: string }[] {
  const now = new Date();
  now.setHours(23, 59, 0);
  const tz = getTimezoneAbbr();

  const autoExample = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  return [
    { value: 'auto', label: 'Auto', example: `${autoExample} ${tz}` },
    { value: '12h', label: '12-hour', example: `11:59 PM ${tz}` },
    { value: '24h', label: '24-hour', example: `23:59 ${tz}` },
  ];
}

/**
 * Format time with seconds according to user's preference
 * Used for "last updated" timestamps
 * @param date - Date object
 * @returns Time string like "23:59:45" or "11:59:45 PM"
 */
export function formatTimeWithSeconds(date: Date): string {
  const timeFormat = getTimeFormat();
  const seconds = date.getSeconds().toString().padStart(2, '0');

  if (timeFormat === 'auto') {
    const formatted = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
    // Insert seconds before AM/PM or at the end
    if (formatted.includes('AM') || formatted.includes('PM')) {
      return formatted.replace(/ (AM|PM)/, `:${seconds} $1`);
    }
    return `${formatted}:${seconds}`;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (timeFormat === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes}:${seconds} ${period}`;
  }

  // 24h format
  return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
}
