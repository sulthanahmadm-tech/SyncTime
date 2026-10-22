"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConflicts = checkConflicts;
const connection_1 = require("../db/connection");
async function checkConflicts(userId, params) {
    const { start, end, excludeId, excludeType } = params;
    const conflicts = [];
    // Query kegiatan_dinamis for conflicts
    let dinamisQuery = connection_1.supabase
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
    if (dayOfWeek === 0)
        dayOfWeek = 7;
    const startTimeStr = startWib.toISOString().split('T')[1].substring(0, 8);
    const endTimeStr = endWib.toISOString().split('T')[1].substring(0, 8);
    const wibDateStr = startWib.toISOString().split('T')[0];
    const { data: profile } = await connection_1.supabase
        .from('profiles')
        .select('semester_start, semester_end')
        .eq('id', userId)
        .single();
    const { data: exceptionsRes } = await connection_1.supabase
        .from('rutin_exceptions')
        .select('kegiatan_rutin_id')
        .eq('tanggal_dilewati', wibDateStr);
    const exceptionIds = new Set((exceptionsRes || []).map((e) => e.kegiatan_rutin_id));
    let rutinQuery = connection_1.supabase
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
        // If this routine instance has an exception on this date, skip
        if (exceptionIds.has(row.id)) {
            continue;
        }
        // Check semester bounds and batas_minggu_berulang
        if (profile?.semester_start && profile?.semester_end) {
            if (wibDateStr < profile.semester_start || wibDateStr > profile.semester_end) {
                continue;
            }
            const semStart = new Date(profile.semester_start);
            const weekNum = Math.floor((new Date(wibDateStr).getTime() - semStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            if (weekNum > (row.batas_minggu_berulang || 16)) {
                continue;
            }
        }
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
