import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { WeeklyCalendar } from '../components/Calendar/WeeklyCalendar';
import { getSharedFreeTime } from '../lib/api';
import type { CalendarBlock } from '../lib/types';
import { getWeekStart } from '../lib/utils';

const SharedCalendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekStartParam = searchParams.get('week_start') || getWeekStart(new Date());
  const userId = searchParams.get('user_id');
  
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);

  useEffect(() => {
    if (userId) {
      getSharedFreeTime(weekStartParam, userId).then(setBlocks).catch(console.error);
    }
  }, [weekStartParam, userId]);

  const handleNext = () => {
    const d = new Date(weekStartParam);
    d.setDate(d.getDate() + 7);
    setSearchParams({ week_start: getWeekStart(d), user_id: userId || '' });
  };

  const handlePrev = () => {
    const d = new Date(weekStartParam);
    d.setDate(d.getDate() - 7);
    setSearchParams({ week_start: getWeekStart(d), user_id: userId || '' });
  };

  const handleToday = () => {
    setSearchParams({ week_start: getWeekStart(new Date()), user_id: userId || '' });
  };

  if (!userId || userId === 'undefined') {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-sans bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <h2 className="text-xl font-bold">Parameter user_id tidak ditemukan</h2>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header 
        currentWeekStart={weekStartParam} 
        onNext={handleNext} 
        onPrev={handlePrev} 
        onToday={handleToday} 
      />
      <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-center">
        <h2 className="text-xl font-bold">Waktu Tersedia (Free Time)</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Blok abu-abu menandakan waktu sibuk. Area kosong adalah waktu yang tersedia.</p>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* We use readonly={true} below instead of pointer-events-none to prevent visual hover states, so it can still scroll. */}
        <WeeklyCalendar 
          blocks={blocks}
          currentWeekStart={weekStartParam}
          onBlockClick={() => {}}
          onEmptyCellClick={() => {}}
          onToggleComplete={() => {}}
          readonly={true}
        />
      </div>
    </div>
  );
};

export default SharedCalendar;
