export const getLocalDateString = (d: Date): string => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const isPastDate = (dateStr: string): boolean => {
  const today = getLocalDateString(new Date());
  return dateStr < today;
};

export const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getLocalDateString(d);
};

export const formatTime = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const getHourFromTime = (timeStr: string): number => {
  if (timeStr.includes('T')) {
    return new Date(timeStr).getHours();
  }
  return parseInt(timeStr.split(':')[0], 10);
};

export const getDayIndex = (isoString: string): number => {
  const day = new Date(isoString).getDay();
  return day === 0 ? 6 : day - 1; // 0 for Monday, 6 for Sunday
};

export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 to 23

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const getBlockPosition = (start: string, end: string) => {
  const startDate = start.includes('T') ? new Date(start) : new Date(`1970-01-01T${start}`);
  const endDate = end.includes('T') ? new Date(end) : new Date(`1970-01-01T${end}`);
  
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes();
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  
  const top = (startHour - 6) * 60 + startMinute;
  const height = durationMinutes;
  
  return { top, height };
};
