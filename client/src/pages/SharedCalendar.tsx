import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import type { MobileViewMode } from '../components/Layout/Header';
import { WeeklyCalendar } from '../components/Calendar/WeeklyCalendar';
import { getSharedFreeTime } from '../lib/api';
import type { CalendarBlock } from '../lib/types';
import { getWeekStart, parseLocalDate } from '../lib/utils';

const SharedCalendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekStartParam = searchParams.get('week_start') || getWeekStart(new Date());
  const userId = searchParams.get('user_id');
  
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('3d');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  useEffect(() => {
    if (userId) {
      getSharedFreeTime(weekStartParam, userId).then(setBlocks).catch(console.error);
    }
  }, [weekStartParam, userId]);

  const advanceWeek = (deltaDays: number) => {
    const d = parseLocalDate(weekStartParam);
    d.setDate(d.getDate() + deltaDays);
    setSearchParams({ week_start: getWeekStart(d), user_id: userId || '' });
  };

  const handleNext = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (mobileViewMode === '1d') {
        if (selectedDayIndex < 6) {
          setSelectedDayIndex(selectedDayIndex + 1);
        } else {
          advanceWeek(7);
          setSelectedDayIndex(0);
        }
        return;
      }
      if (mobileViewMode === '3d') {
        if (selectedDayIndex < 4) {
          setSelectedDayIndex(Math.min(4, selectedDayIndex + 3));
        } else {
          advanceWeek(7);
          setSelectedDayIndex(0);
        }
        return;
      }
    }
    advanceWeek(7);
  };

  const handlePrev = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (mobileViewMode === '1d') {
        if (selectedDayIndex > 0) {
          setSelectedDayIndex(selectedDayIndex - 1);
        } else {
          advanceWeek(-7);
          setSelectedDayIndex(6);
        }
        return;
      }
      if (mobileViewMode === '3d') {
        if (selectedDayIndex >= 3) {
          setSelectedDayIndex(selectedDayIndex - 3);
        } else if (selectedDayIndex > 0) {
          setSelectedDayIndex(0);
        } else {
          advanceWeek(-7);
          setSelectedDayIndex(4);
        }
        return;
      }
    }
    advanceWeek(-7);
  };

  const handleToday = () => {
    setSearchParams({ week_start: getWeekStart(new Date()), user_id: userId || '' });
    const d = new Date().getDay();
    setSelectedDayIndex(d === 0 ? 6 : d - 1);
  };

  if (!userId || userId === 'undefined') {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-sans bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white">
        <h2 className="text-lg font-semibold">Parameter user_id tidak ditemukan</h2>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white">
      <Header 
        currentWeekStart={weekStartParam} 
        onNext={handleNext} 
        onPrev={handlePrev} 
        onToday={handleToday}
        mobileViewMode={mobileViewMode}
        onMobileViewModeChange={setMobileViewMode}
      />
      <div className="px-4 py-3 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] text-center">
        <h2 className="text-sm sm:text-base font-semibold tracking-tight">Ketersediaan Waktu (Free Time)</h2>
        <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">Blok berwarna menandakan waktu sibuk. Area kosong adalah waktu yang tersedia.</p>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <WeeklyCalendar 
          blocks={blocks}
          currentWeekStart={weekStartParam}
          onBlockClick={() => {}}
          onEmptyCellClick={() => {}}
          onToggleComplete={() => {}}
          readonly={true}
          mobileViewMode={mobileViewMode}
          selectedDayIndex={selectedDayIndex}
          onSelectDayIndex={setSelectedDayIndex}
        />
      </div>
    </div>
  );
};

export default SharedCalendar;

