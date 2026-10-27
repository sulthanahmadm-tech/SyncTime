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
        const { data: categories, error: catError } = await connection_1.supabase
            .from('kategori')
            .select('*')
            .eq('user_id', userId);
        if (catError)
            throw catError;
        // Initialize stats map
        const stats = {};
        for (const cat of (categories || [])) {
            stats[cat.id] = {
                nama_kategori: cat.nama_kategori,
                warna_hex: cat.warna_hex,
                total_hours: 0
            };
        }
        const { data: profile } = await connection_1.supabase
            .from('profiles')
            .select('semester_start, semester_end')
            .eq('id', userId)
            .maybeSingle();
        const startDateStr = weekStartClean;
        const endWib = new Date(end.getTime() + 7 * 60 * 60 * 1000);
        const endDateStr = endWib.toISOString().split('T')[0];
        const { data: exceptionsRes, error: exceptionsError } = await connection_1.supabase
            .from('rutin_exceptions')
            .select('kegiatan_rutin_id, tanggal_dilewati, kegiatan_rutin!inner(user_id)')
            .eq('kegiatan_rutin.user_id', userId)
            .gte('tanggal_dilewati', startDateStr)
            .lt('tanggal_dilewati', endDateStr);
        if (exceptionsError)
            throw exceptionsError;
        const exceptionSet = new Set((exceptionsRes || []).map((e) => `${e.kegiatan_rutin_id}-${e.tanggal_dilewati}`));
        // Process Rutin
        const { data: rutinRes, error: rutinError } = await connection_1.supabase
            .from('kegiatan_rutin')
            .select('*')
            .eq('user_id', userId);
        if (rutinError)
            throw rutinError;
        for (const r of (rutinRes || [])) {
            if (stats[r.kategori_id]) {
                const dayOffset = r.hari_mingguan - 1;
                const eventDate = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
                const dateStr = eventDate.toISOString().split('T')[0];
                // Skip if exception exists for this date
                if (exceptionSet.has(`${r.id}-${dateStr}`)) {
                    continue;
                }
                // Verify semester bounds and week limit
                if (profile?.semester_start && profile?.semester_end) {
                    if (dateStr < profile.semester_start || dateStr > profile.semester_end) {
                        continue;
                    }
                    const semStart = new Date(profile.semester_start);
                    const weekNum = Math.floor((new Date(dateStr).getTime() - semStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                    if (weekNum > (r.batas_minggu_berulang || 16)) {
                        continue;
                    }
                }
                // Calculate duration
                const startD = new Date(`1970-01-01T${r.jam_mulai}Z`);
                const endD = new Date(`1970-01-01T${r.jam_selesai}Z`);
                const hours = (endD.getTime() - startD.getTime()) / (1000 * 60 * 60);
                stats[r.kategori_id].total_hours += hours;
            }
        }
        // Process Dinamis
        const { data: dinamisRes, error: dinamisError } = await connection_1.supabase
            .from('kegiatan_dinamis')
            .select('*')
            .eq('user_id', userId)
            .gte('waktu_mulai', start.toISOString())
            .lt('waktu_mulai', end.toISOString());
        if (dinamisError)
            throw dinamisError;
        for (const d of (dinamisRes || [])) {
            if (stats[d.kategori_id]) {
                const startD = new Date(d.waktu_mulai);
                const endD = new Date(d.waktu_selesai);
                const hours = (endD.getTime() - startD.getTime()) / (1000 * 60 * 60);
                stats[d.kategori_id].total_hours += hours;
            }
        }
        // Format output
        const result = Object.values(stats).filter(s => s.total_hours > 0).map(s => ({
            ...s,
            total_hours: Number(s.total_hours.toFixed(2)) // Round to 2 decimal places
        }));
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
