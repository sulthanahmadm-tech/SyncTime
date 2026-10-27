"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../db/connection");
const router = (0, express_1.Router)();
router.get('/weekly', async (req, res, next) => {
    const { week_start } = req.query;
    if (!week_start || typeof week_start !== 'string') {
        return res.status(400).json({ error: 'week_start query param is required' });
    }
    try {
        const userId = req.user.id;
        const weekStartClean = week_start.split('T')[0];
        const start = new Date(`${weekStartClean}T00:00:00+07:00`);
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startDateStr = weekStartClean;
        const endWib = new Date(end.getTime() + 7 * 60 * 60 * 1000);
        const endDateStr = endWib.toISOString().split('T')[0];
        const { data: profile } = await connection_1.supabase
            .from('profiles')
            .select('semester_start, semester_end')
            .eq('id', userId)
            .maybeSingle();
        const { data: rutinRes, error: rutinError } = await connection_1.supabase
            .from('kegiatan_rutin')
            .select('*, kategori!inner(warna_hex, nama_kategori)')
            .eq('user_id', userId);
        if (rutinError)
            throw rutinError;
        const { data: exceptionsRes, error: exceptionsError } = await connection_1.supabase
            .from('rutin_exceptions')
            .select('kegiatan_rutin_id, tanggal_dilewati, kegiatan_rutin!inner(user_id)')
            .eq('kegiatan_rutin.user_id', userId)
            .gte('tanggal_dilewati', startDateStr)
            .lt('tanggal_dilewati', endDateStr);
        if (exceptionsError)
            throw exceptionsError;
        const exceptionSet = new Set((exceptionsRes || []).map(e => `${e.kegiatan_rutin_id}-${e.tanggal_dilewati}`));
        const blocks = [];
        for (const row of (rutinRes || [])) {
            const dayOffset = row.hari_mingguan - 1;
            const eventDate = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
            const dateStr = eventDate.toISOString().split('T')[0];
            // Skip if there's an exception for this date
            if (exceptionSet.has(`${row.id}-${dateStr}`)) {
                continue;
            }
            // Check semester bounds and batas_minggu_berulang
            if (profile?.semester_start && profile?.semester_end) {
                if (dateStr < profile.semester_start || dateStr > profile.semester_end) {
                    continue;
                }
                const semStart = new Date(profile.semester_start);
                const weekNum = Math.floor((new Date(dateStr).getTime() - semStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                if (weekNum > (row.batas_minggu_berulang || 16)) {
                    continue;
                }
            }
            const startDateTimeStr = `${dateStr}T${row.jam_mulai}`;
            const endDateTimeStr = `${dateStr}T${row.jam_selesai}`;
            blocks.push({
                id: row.id,
                type: 'rutin',
                kategori_id: row.kategori_id,
                judul: row.judul,
                warna_hex: row.kategori.warna_hex,
                nama_kategori: row.kategori.nama_kategori,
                start: startDateTimeStr,
                end: endDateTimeStr,
                hari_mingguan: row.hari_mingguan
            });
        }
        const { data: dinamisRes, error: dinamisError } = await connection_1.supabase
            .from('kegiatan_dinamis')
            .select('*, kategori!inner(warna_hex, nama_kategori)')
            .eq('user_id', userId)
            .gte('waktu_mulai', start.toISOString())
            .lt('waktu_mulai', end.toISOString());
        if (dinamisError)
            throw dinamisError;
        for (const row of (dinamisRes || [])) {
            blocks.push({
                id: row.id,
                type: 'dinamis',
                kategori_id: row.kategori_id,
                judul: row.judul,
                warna_hex: row.kategori.warna_hex,
                nama_kategori: row.kategori.nama_kategori,
                start: new Date(row.waktu_mulai).toISOString(),
                end: new Date(row.waktu_selesai).toISOString(),
                is_completed: Boolean(row.is_completed)
            });
        }
        blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        res.json(blocks);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
