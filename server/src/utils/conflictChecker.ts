import { supabase } from '../db/connection';
import { ConflictCheckResult, ConflictDetail } from '../types';

export async function checkConflicts(
  userId: string,
  params: { start: Date; end: Date; excludeId?: number; excludeType?: 'rutin' | 'dinamis' }
): Promise<ConflictCheckResult> {
  const { start, end, excludeId, excludeType } = params;
  const conflicts: ConflictDetail[] = [];

  // Query kegiatan_dinamis for conflicts
  let dinamisQuery = supabase
    .from('kegiatan_dinamis')
    .select('*')
    .eq('user_id', userId)
    .lt('waktu_mulai', end.toISOString())
    .gt('waktu_selesai', start.toISOString());

  if (excludeType === 'dinamis' && excludeId) {
    dinamisQuery = dinamisQuery.neq('id', excludeId);
  }

  const { data: dinamisRes } = await dinamisQuery;

  for (const row of (dinamisRes || [])) {
    conflicts.push({
      conflicting_id: row.id,
      conflicting_judul: row.judul,
      conflicting_start: new Date(row.waktu_mulai).toISOString(),
      conflicting_end: new Date(row.waktu_selesai).toISOString(),
      type: 'dinamis'
    });
  }

  // Query kegiatan_rutin for conflicts (jam_mulai & hari_mingguan are stored in WIB / GMT+7)
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const startWib = new Date(start.getTime() + WIB_OFFSET_MS);
  const endWib = new Date(end.getTime() + WIB_OFFSET_MS);

  let dayOfWeek = startWib.getUTCDay();
  if (dayOfWeek === 0) dayOfWeek = 7;
  const startTimeStr = startWib.toISOString().split('T')[1].substring(0, 8);
  const endTimeStr = endWib.toISOString().split('T')[1].substring(0, 8);
  const wibDateStr = startWib.toISOString().split('T')[0];

  let rutinQuery = supabase
    .from('kegiatan_rutin')
    .select('*')
    .eq('user_id', userId)
    .eq('hari_mingguan', dayOfWeek)
    .lt('jam_mulai', endTimeStr)
    .gt('jam_selesai', startTimeStr);

  if (excludeType === 'rutin' && excludeId) {
    rutinQuery = rutinQuery.neq('id', excludeId);
  }

  const { data: rutinRes } = await rutinQuery;

  for (const row of (rutinRes || [])) {
    const startStr = `${wibDateStr}T${row.jam_mulai}`;
    const endStr = `${wibDateStr}T${row.jam_selesai}`;
    conflicts.push({
      conflicting_id: row.id,
      conflicting_judul: row.judul,
      conflicting_start: startStr,
      conflicting_end: endStr,
      type: 'rutin'
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}
