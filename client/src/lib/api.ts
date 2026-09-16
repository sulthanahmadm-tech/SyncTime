import { supabase } from './supabase';
import type { CalendarBlock, ConflictDetail, Kategori, KegiatanDinamis, KegiatanRutin } from './types';

export class ConflictError extends Error {
  conflicts: ConflictDetail[];
  constructor(message: string, conflicts: ConflictDetail[]) {
    super(message);
    this.name = 'ConflictError';
    this.conflicts = conflicts;
  }
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });
  
  if (res.status === 409) {
    const errorData = await res.json();
    throw new ConflictError(errorData.message || 'Conflict detected', errorData.conflicts || []);
  }
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || `API Error: ${res.status} ${res.statusText}`);
    } catch (e: any) {
      if (e instanceof Error) throw e;
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
  }
  return res.json();
}

export const getKategori = (): Promise<Kategori[]> => fetchApi('/api/kategori');

export const createKategori = (data: { nama_kategori: string, warna_hex: string, kode_led_iot?: string }): Promise<Kategori> => 
  fetchApi('/api/kategori', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const getWeeklyCalendar = (weekStart: string): Promise<CalendarBlock[]> => 
  fetchApi(`/api/calendar/weekly?week_start=${weekStart}`);

export const createRutin = (data: Omit<KegiatanRutin, 'id'>, force?: boolean): Promise<KegiatanRutin> => 
  fetchApi(`/api/rutin${force ? '?force=true' : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const createDinamis = (data: Omit<KegiatanDinamis, 'id'>, force?: boolean): Promise<KegiatanDinamis> => 
  fetchApi(`/api/dinamis${force ? '?force=true' : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const updateRutin = (id: number, data: Partial<KegiatanRutin>, force?: boolean): Promise<KegiatanRutin> => 
  fetchApi(`/api/rutin/${id}${force ? '?force=true' : ''}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const updateDinamis = (id: number, data: Partial<KegiatanDinamis>, force?: boolean): Promise<KegiatanDinamis> => 
  fetchApi(`/api/dinamis/${id}${force ? '?force=true' : ''}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const toggleComplete = (id: number): Promise<KegiatanDinamis> => 
  fetchApi(`/api/dinamis/${id}/complete`, { method: 'PATCH' });

export const deleteRutin = (id: number): Promise<void> => 
  fetchApi(`/api/rutin/${id}`, { method: 'DELETE' });

export const deleteDinamis = (id: number): Promise<void> => 
  fetchApi(`/api/dinamis/${id}`, { method: 'DELETE' });

export const getAnalytics = (weekStart: string): Promise<{ nama_kategori: string, warna_hex: string, total_hours: number }[]> => 
  fetchApi(`/api/analytics/weekly?week_start=${weekStart}`);

export const getSharedFreeTime = (weekStart: string): Promise<CalendarBlock[]> => 
  fetchApi(`/api/shared/free-time?week_start=${weekStart}`);

export const magicPaste = (rawText: string): Promise<{ message: string, data: any[] }> => 
  fetchApi('/api/schedule/magic-paste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText })
  });

export const moveSchedule = (payload: {
  id: number;
  type: 'rutin' | 'dinamis';
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  isTemporary?: boolean;
  originalDate?: string;
}): Promise<{ message: string }> => 
  fetchApi('/api/schedule/move', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

export const getProfile = (): Promise<any> => fetchApi('/api/auth/profile');
export const updateProfile = (data: any): Promise<any> => fetchApi('/api/auth/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Onboarding APIs
export const setSemester = (data: { semester_start: string; semester_end: string }): Promise<any> =>
  fetchApi('/api/onboarding/semester', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const addMatkulBulk = (matkul_list: any[]): Promise<any> =>
  fetchApi('/api/onboarding/matkul', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matkul_list })
  });

export const completeOnboarding = (): Promise<any> =>
  fetchApi('/api/onboarding/complete', { method: 'PUT' });

// Matkul Wajib APIs
export const getMatkulWajib = (): Promise<any[]> => fetchApi('/api/rutin/matkul-wajib');

export const deleteMatkulWajib = (id: number): Promise<void> => 
  fetchApi(`/api/rutin/${id}`, { method: 'DELETE' });
