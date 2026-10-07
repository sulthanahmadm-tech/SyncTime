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



export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 to 23

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const getBlockPosition = (start: string, end: string) => {
  const startDate = start.includes('T') ? new Date(start) : new Date(`1970-01-01T${start}`);
  const endDate = end.includes('T') ? new Date(end) : new Date(`1970-01-01T${end}`);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { top: 0, height: 0, isHidden: true };
  }
  
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes();
  
  let durationMs = endDate.getTime() - startDate.getTime();
  
  // If end time is technically before start time, it likely crossed midnight
  if (durationMs < 0) {
    durationMs += 24 * 60 * 60 * 1000;
  }
  
  let durationMinutes = durationMs / (1000 * 60);
  
  if (isNaN(durationMinutes) || durationMinutes < 0) {
    durationMinutes = 60; // fallback
  }
  
  let top = (startHour - 6) * 60 + startMinute;
  let height = durationMinutes;
  
  const MAX_HEIGHT = 18 * 60; // 6:00 to 24:00 is 18 hours
  
  if (top < 0) {
    height += top;
    top = 0;
  }
  
  if (top + height > MAX_HEIGHT) {
    height = MAX_HEIGHT - top;
  }
  
  const finalHeight = Math.max(0, height);
  const isHidden = finalHeight <= 0;
  
  return { top, height: finalHeight, isHidden };
};
