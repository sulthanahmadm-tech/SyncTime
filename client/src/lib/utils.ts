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



export const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

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
  
  let top = startHour * 60 + startMinute;
  let height = durationMinutes;
  
  const MAX_HEIGHT = 24 * 60; // 0:00 to 24:00 is 24 hours
  
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

export const hexToRgba = (hex: string, alpha: number): string => {
  let clean = (hex || '#007AFF').trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  } else if (clean.length === 8) {
    clean = clean.substring(0, 6);
  }
  if (clean.length !== 6) return `rgba(0, 122, 255, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 122, 255, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface BlockLayoutInfo {
  columnIndex: number;
  totalColumns: number;
}

export const computeOverlapLayout = <T extends { id: number; type: string; start: string; end: string }>(
  blocks: T[]
): Map<string, BlockLayoutInfo> => {
  const layoutMap = new Map<string, BlockLayoutInfo>();
  if (blocks.length === 0) return layoutMap;

  const items = blocks
    .map((b) => {
      const pos = getBlockPosition(b.start, b.end);
      return {
        key: `${b.type}-${b.id}`,
        top: pos.top,
        bottom: pos.top + Math.max(pos.height, 15),
        isHidden: pos.isHidden,
      };
    })
    .filter((item) => !item.isHidden)
    .sort((a, b) => a.top - b.top || b.bottom - a.bottom);

  // Group into connected overlap clusters
  let cluster: typeof items = [];
  let clusterMaxBottom = -1;

  const flushCluster = (grp: typeof items) => {
    if (grp.length === 0) return;
    const colEnds: number[] = [];
    const assignedCol = new Map<string, number>();

    for (const item of grp) {
      let placedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= item.top) {
          placedCol = c;
          colEnds[c] = item.bottom;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(item.bottom);
      }
      assignedCol.set(item.key, placedCol);
    }

    const totalCols = Math.max(1, colEnds.length);
    for (const item of grp) {
      layoutMap.set(item.key, {
        columnIndex: assignedCol.get(item.key) ?? 0,
        totalColumns: totalCols,
      });
    }
  };

  for (const item of items) {
    if (cluster.length === 0 || item.top < clusterMaxBottom) {
      cluster.push(item);
      clusterMaxBottom = Math.max(clusterMaxBottom, item.bottom);
    } else {
      flushCluster(cluster);
      cluster = [item];
      clusterMaxBottom = item.bottom;
    }
  }
  flushCluster(cluster);

  return layoutMap;
};
