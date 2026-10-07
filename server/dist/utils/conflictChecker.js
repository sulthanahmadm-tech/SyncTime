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
    // Query kegiatan_rutin for conflicts
    let dayOfWeek = start.getDay();
    if (dayOfWeek === 0)
        dayOfWeek = 7;
    const startTimeStr = start.toTimeString().split(' ')[0];
    const endTimeStr = end.toTimeString().split(' ')[0];
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
        const startStr = start.toISOString().split('T')[0] + 'T' + row.jam_mulai;
        const endStr = start.toISOString().split('T')[0] + 'T' + row.jam_selesai;
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
