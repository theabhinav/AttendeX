export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WORK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Returns today's day name (e.g. 'Monday')
 */
export const getTodayName = () => {
  const dayIndex = new Date().getDay();
  return DAYS_OF_WEEK[dayIndex];
};

/**
 * Converts 'HH:mm' string to total minutes from midnight
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Formats 'HH:mm' 24-hr time to 12-hr format (e.g. '09:30 AM')
 */
export const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  const minutesStr = String(m || 0).padStart(2, '0');
  return `${hours12}:${minutesStr} ${period}`;
};

/**
 * Returns class status relative to current time:
 * 'upcoming' | 'ongoing' | 'completed'
 */
export const getClassTimeStatus = (startTime, endTime) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (currentMinutes < startMin) {
    return 'upcoming';
  } else if (currentMinutes >= startMin && currentMinutes <= endMin) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

/**
 * Calculates countdown string or minutes remaining until class start
 */
export const getCountdown = (startTime) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(startTime);

  const diff = startMin - currentMinutes;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export const formatDateISO = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
