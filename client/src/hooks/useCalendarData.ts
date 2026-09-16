import { useState, useEffect, useCallback } from 'react';
import type { CalendarBlock, Kategori } from '../lib/types';
import { getWeeklyCalendar, getKategori } from '../lib/api';
import { getWeekStart, parseLocalDate } from '../lib/utils';

export const useCalendarData = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(getWeekStart(new Date()));
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWeeklyCalendar(currentWeekStart);
      setBlocks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  const fetchKategori = useCallback(async () => {
    try {
      const data = await getKategori();
      setKategoriList(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
    fetchKategori();
  }, [fetchBlocks, fetchKategori]);

  const nextWeek = () => {
    const d = parseLocalDate(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(getWeekStart(d));
  };

  const prevWeek = () => {
    const d = parseLocalDate(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(getWeekStart(d));
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  return {
    blocks,
    kategoriList,
    currentWeekStart,
    nextWeek,
    prevWeek,
    goToToday,
    loading,
    refetch: fetchBlocks,
    refetchKategori: fetchKategori
  };
};
