import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { WeeklyCalendar } from '../components/Calendar/WeeklyCalendar';
import { getSharedFreeTime } from '../lib/api';
import type { CalendarBlock } from '../lib/types';
import { getWeekStart } from '../lib/utils';

export const SharedCalendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekStartParam = searchParams.get('week_start') || getWeekStart(new Date());
  
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);

  useEffect(() => {
    getSharedFreeTime(weekStartParam).then(setBlocks).catch(console.error);
  }, [weekStartParam]);

  const handleNext = () => {
    const d = new Date(weekStartParam);
    d.setDate(d.getDate() + 7);
    setSearchParams({ week_start: getWeekStart(d) });
  };

  const handlePrev = () => {
    const d = new Date(weekStartParam);
    d.setDate(d.getDate() - 7);
    setSearchParams({ week_start: getWeekStart(d) });
  };

  const handleToday = () => {
    setSearchParams({ week_start: getWeekStart(new Date()) });
  };

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-gray-950 text-white">
      <Header 
        currentWeekStart={weekStartParam} 
        onNext={handleNext} 
        onPrev={handlePrev} 
        onToday={handleToday} 
      />
      <div className="p-4 bg-gray-900 border-b border-gray-800 text-center">
        <h2 className="text-xl font-bold">Waktu Tersedia (Free Time)</h2>
        <p className="text-sm text-gray-400">Blok abu-abu menandakan waktu sibuk. Area kosong adalah waktu yang tersedia.</p>
      </div>
      <div className="flex-1 flex overflow-hidden pointer-events-none">
        {/* pointer-events-none ensures it's completely read-only visually (no hover effects on blocks either) */}
        <WeeklyCalendar 
          blocks={blocks}
          currentWeekStart={weekStartParam}
          onBlockClick={() => {}}
          onEmptyCellClick={() => {}}
          onToggleComplete={() => {}}
        />
      </div>
    </div>
  );
};

export default SharedCalendar;
