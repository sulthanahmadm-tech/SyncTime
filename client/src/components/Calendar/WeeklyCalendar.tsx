import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CalendarBlock } from '../../lib/types';
import { DAY_NAMES, HOURS, getLocalDateString, parseLocalDate, computeOverlapLayout } from '../../lib/utils';
import { TimeBlock } from './TimeBlock';
import type { MobileViewMode } from '../Layout/Header';

interface WeeklyCalendarProps {
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onEmptyCellClick: (dateStr: string, hour: number) => void;
  onToggleComplete: (id: number) => void;
  currentWeekStart: string;
  readonly?: boolean;
  mobileViewMode?: MobileViewMode;
  selectedDayIndex?: number;
  onSelectDayIndex?: (index: number) => void;
}

const DayColumn = ({
  date,
  blocks,
  onBlockClick,
  onEmptyCellClick,
  onToggleComplete,
  readonly,
  now,
  compactMobile
}: {
  date: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onEmptyCellClick: (dateStr: string, hour: number) => void;
  onToggleComplete: (id: number) => void;
  readonly?: boolean;
  now: Date;
  compactMobile?: boolean;
}) => {
  const dateStr = getLocalDateString(date);
  const { setNodeRef } = useDroppable({
    id: dateStr,
  });

  const isToday = getLocalDateString(now) === dateStr;
  const currentMinutePosition = isToday ? now.getHours() * 60 + now.getMinutes() : null;
  const dayName = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const overlapMap = computeOverlapLayout(blocks);

  return (
    <div
      ref={setNodeRef}
      data-testid={`day-column-${dateStr}`}
      className={`flex-1 border-r border-black/[0.06] dark:border-white/[0.07] relative bg-white dark:bg-[#1C1C1E] ${
        compactMobile ? 'min-w-0' : 'min-w-[116px] md:min-w-[120px]'
      }`}
    >
      {/* Sticky Day Header */}
      <div className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] flex flex-col items-center justify-center sticky top-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md z-10 select-none">
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-[#FF3B30] dark:text-[#FF453A]' : 'text-[#6E6E73] dark:text-[#98989D]'}`}>
          {dayName.slice(0, 3)}
        </span>
        <span
          className={`text-sm mt-0.5 tabular-nums ${
            isToday
              ? 'bg-[#FF3B30] w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold shadow-2xs'
              : 'text-[#1D1D1F] dark:text-[#E5E5EA] font-semibold w-7 h-7 flex items-center justify-center'
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Hour Grid & Event Blocks */}
      <div className="relative" style={{ height: `${HOURS.length * 60}px` }}>
        {HOURS.map(hour => (
          <div
            key={hour}
            className={`h-[60px] border-b border-black/[0.05] dark:border-white/[0.05] ${
              readonly ? '' : 'cursor-pointer hover:bg-[#007AFF]/[0.03] dark:hover:bg-white/[0.03] transition-colors'
            }`}
            onClick={() => !readonly && onEmptyCellClick(dateStr, hour)}
          />
        ))}
        {blocks.map((block: CalendarBlock) => {
          const layout = overlapMap.get(`${block.type}-${block.id}`);
          return (
            <TimeBlock
              key={`${block.type}-${block.id}`}
              block={block}
              onClick={() => onBlockClick(block)}
              onToggleComplete={() => onToggleComplete(block.id)}
              readonly={readonly}
              columnIndex={layout?.columnIndex ?? 0}
              totalColumns={layout?.totalColumns ?? 1}
            />
          );
        })}
        {/* Apple Calendar Current Time Red Line + Red Dot */}
        {isToday && currentMinutePosition !== null && currentMinutePosition >= 0 && (
          <div
            data-testid="current-time-indicator"
            className="absolute left-0 right-0 border-t-[1.5px] border-[#FF3B30] z-20 pointer-events-none flex items-center"
            style={{ top: `${currentMinutePosition}px` }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] -ml-[5px] -mt-[1px] shadow-2xs shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
};

export const WeeklyCalendar = ({
  blocks,
  onBlockClick,
  onEmptyCellClick,
  onToggleComplete,
  currentWeekStart,
  readonly,
  mobileViewMode = '3d',
  selectedDayIndex,
  onSelectDayIndex
}: WeeklyCalendarProps) => {
  const [now, setNow] = useState(() => new Date());
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [internalDayIndex, setInternalDayIndex] = useState<number>(() => {
    const today = new Date();
    const d = today.getDay();
    return d === 0 ? 6 : d - 1;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeDayIndex = selectedDayIndex !== undefined ? selectedDayIndex : internalDayIndex;
  const handleSelectDay = (idx: number) => {
    if (onSelectDayIndex) {
      onSelectDayIndex(idx);
    } else {
      setInternalDayIndex(idx);
    }
  };

  const startDate = parseLocalDate(currentWeekStart);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Determine visible days on mobile (< 768px) vs desktop (>= 768px)
  const clampedIdx = Math.max(0, Math.min(6, activeDayIndex));
  let visibleDays = days;
  let isCompactMobileMode = false;

  if (isMobileViewport) {
    if (mobileViewMode === '1d') {
      visibleDays = [days[clampedIdx]];
      isCompactMobileMode = true;
    } else if (mobileViewMode === '3d') {
      const startIdx = Math.min(clampedIdx, 4);
      visibleDays = days.slice(startIdx, startIdx + 3);
      isCompactMobileMode = true;
    }
  }

  const todayStr = getLocalDateString(now);

  return (
    <div className="weekly-calendar flex-1 flex flex-col overflow-hidden bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white">
      {/* Mobile iOS Day Scrubber Strip (shown on < 768px when in 1 Hari or 3 Hari mode) */}
      {isMobileViewport && (mobileViewMode === '1d' || mobileViewMode === '3d') && (
        <div
          data-testid="mobile-day-scrubber"
          className="md:hidden flex items-center justify-between px-2 py-1.5 bg-white/90 dark:bg-[#1C1C1E]/90 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0 select-none"
        >
          {days.map((d, idx) => {
            const dStr = getLocalDateString(d);
            const isDayToday = dStr === todayStr;
            const isSelected =
              mobileViewMode === '1d'
                ? idx === clampedIdx
                : idx >= Math.min(clampedIdx, 4) && idx < Math.min(clampedIdx, 4) + 3;
            const isPrimarySelected = idx === clampedIdx;

            return (
              <button
                key={dStr}
                type="button"
                data-testid={`scrubber-day-${idx}`}
                onClick={() => handleSelectDay(idx)}
                className={`flex-1 flex flex-col items-center py-1 rounded-[10px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/20'
                    : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase ${isDayToday ? 'text-[#FF3B30]' : 'text-[#6E6E73] dark:text-[#98989D]'}`}>
                  {DAY_NAMES[idx].slice(0, 3)}
                </span>
                <span
                  className={`mt-0.5 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center tabular-nums ${
                    isPrimarySelected
                      ? isDayToday
                        ? 'bg-[#FF3B30] text-white'
                        : 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                      : isDayToday
                        ? 'text-[#FF3B30] font-bold'
                        : 'text-[#1D1D1F] dark:text-[#E5E5EA]'
                  }`}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Scrollable Calendar Grid */}
      <div className="flex-1 overflow-auto flex pb-28 md:pb-0">
        {/* Left Time Gutter */}
        <div className="w-14 sm:w-16 flex-none border-r border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#1C1C1E] sticky left-0 z-20 select-none">
          <div className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] flex items-end justify-end pr-2 pb-1.5">
            <span className="text-[10px] font-medium text-[#8E8E93] uppercase">WIB</span>
          </div>
          {HOURS.map(hour => (
            <div key={hour} className="h-[60px] relative">
              <span className="absolute -top-2.5 right-2 text-[11px] font-medium text-[#8E8E93] dark:text-[#636366] tabular-nums">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day Columns Container */}
        <div className={`flex flex-1 ${isCompactMobileMode ? 'min-w-0 w-full' : 'min-w-max'}`}>
          {visibleDays.map((date) => {
            const dateStr = getLocalDateString(date);
            const dayBlocks = blocks.filter(b => b.start.startsWith(dateStr));
            return (
              <DayColumn
                key={dateStr}
                date={date}
                blocks={dayBlocks}
                onBlockClick={onBlockClick}
                onEmptyCellClick={onEmptyCellClick}
                onToggleComplete={onToggleComplete}
                readonly={readonly}
                now={now}
                compactMobile={isCompactMobileMode}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

