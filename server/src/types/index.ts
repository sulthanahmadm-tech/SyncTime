export interface Profile {
  id: string;
  email: string;
  onboarding_completed: boolean;
  semester_start: string | null;
  semester_end: string | null;
  created_at: string;
}

export interface Kategori {
  id: number;
  user_id: string;
  nama_kategori: string;
  warna_hex: string;
  kode_led_iot: string;
}

export interface KegiatanRutin {
  id: number;
  user_id: string;
  kategori_id: number;
  judul: string;
  hari_mingguan: number;
  jam_mulai: string;
  jam_selesai: string;
  batas_minggu_berulang: number;
  is_matkul_wajib: boolean;
}

export interface KegiatanDinamis {
  id: number;
  user_id: string;
  kategori_id: number;
  judul: string;
  waktu_mulai: string;
  waktu_selesai: string;
  is_completed: boolean;
}

export interface CalendarBlock {
  id: number;
  type: 'rutin' | 'dinamis';
  kategori_id: number;
  judul: string;
  warna_hex: string;
  nama_kategori: string;
  start: string;
  end: string;
  is_completed?: boolean;
  hari_mingguan?: number;
}

export interface ConflictDetail {
  conflicting_id: number;
  conflicting_judul: string;
  conflicting_start: string;
  conflicting_end: string;
  type: 'rutin' | 'dinamis';
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
}
