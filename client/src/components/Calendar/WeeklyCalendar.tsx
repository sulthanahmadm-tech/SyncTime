import { useDroppable } from '@dnd-kit/core';
import type { CalendarBlock } from '../../lib/types';
import { DAY_NAMES, HOURS, getLocalDateString, parseLocalDate } from '../../lib/utils';
import { TimeBlock } from './TimeBlock';

interface WeeklyCalendarProps {
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onEmptyCellClick: (dateStr: string, hour: number) => void;
  onToggleComplete: (id: number) => void;
  currentWeekStart: string;
}

const DayColumn = ({ date, blocks, onBlockClick, onEmptyCellClick, onToggleComplete }: {
  date: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onEmptyCellClick: (dateStr: string, hour: number) => void;
  onToggleComplete: (id: number) => void;
}) => {
  const dateStr = getLocalDateString(date);
  const { setNodeRef } = useDroppable({
    id: dateStr,
  });

  const now = new Date();
  const isToday = getLocalDateString(now) === dateStr;
  const currentMinutePosition = isToday ? (now.getHours() - 6) * 60 + now.getMinutes() : null;

  return (
    <div ref={setNodeRef} className="flex-1 border-r border-gray-800 relative bg-gray-900 min-w-[120px]">
      <div className="h-12 border-b border-gray-800 flex flex-col items-center justify-center sticky top-0 bg-gray-900 z-10">
        <span className="text-sm font-medium text-gray-400">{DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
        <span className={`text-lg ${isToday ? 'bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-white' : 'text-gray-200'}`}>
          {date.getDate()}
        </span>
      </div>
      <div className="relative" style={{ height: `${HOURS.length * 60}px` }}>
        {HOURS.map(hour => (
          <div 
            key={hour} 
            className="h-[60px] border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30 transition"
            onClick={() => onEmptyCellClick(dateStr, hour)}
          />
        ))}
        {blocks.map((block: CalendarBlock) => (
          <TimeBlock 
            key={`${block.type}-${block.id}`} 
            block={block} 
            onClick={() => onBlockClick(block)}
            onToggleComplete={() => onToggleComplete(block.id)}
          />
        ))}
        {isToday && currentMinutePosition !== null && currentMinutePosition >= 0 && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
            style={{ top: `${currentMinutePosition}px` }}
          />
        )}
      </div>
    </div>
  );
};

export const WeeklyCalendar = ({ blocks, onBlockClick, onEmptyCellClick, onToggleComplete, currentWeekStart }: WeeklyCalendarProps) => {
  const startDate = parseLocalDate(currentWeekStart);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex-1 overflow-auto bg-gray-950 text-white flex">
      <div className="w-16 flex-none border-r border-gray-800 bg-gray-950 sticky left-0 z-20">
        <div className="h-12 border-b border-gray-800" />
        {HOURS.map(hour => (
          <div key={hour} className="h-[60px] relative">
            <span className="absolute -top-3 right-2 text-xs text-gray-500">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-1 min-w-max">
        {days.map((date) => {
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
            />
          );
        })}
      </div>
    </div>
  );
};
