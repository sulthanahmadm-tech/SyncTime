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

  // Query kegiatan_rutin for conflicts
  let dayOfWeek = start.getDay();
  if (dayOfWeek === 0) dayOfWeek = 7;
  const startTimeStr = start.toTimeString().split(' ')[0];
  const endTimeStr = end.toTimeString().split(' ')[0];

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
    const startStr = start.toISOString().split('T')[0] + 'T' + row.jam_mulai;
    const endStr = start.toISOString().split('T')[0] + 'T' + row.jam_selesai;
    conflicts.push({
      conflicting_id: row.id,
      conflicting_judul: row.judul,
      conflicting_start: new Date(startStr).toISOString(),
      conflicting_end: new Date(endStr).toISOString(),
      type: 'rutin'
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}
