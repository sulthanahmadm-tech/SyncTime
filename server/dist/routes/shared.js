"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../db/connection");
const router = (0, express_1.Router)();
router.get('/free-time', async (req, res, next) => {
    const { week_start, user_id } = req.query;
    if (!week_start || typeof week_start !== 'string') {
        return res.status(400).json({ error: 'week_start query param is required' });
    }
    if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'user_id query param is required' });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
        return res.status(400).json({ error: 'Invalid user_id format' });
    }
    try {
        const weekStartClean = week_start.split('T')[0];
        const start = new Date(`${weekStartClean}T00:00:00+07:00`);
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startDateStr = weekStartClean;
        const endWib = new Date(end.getTime() + 7 * 60 * 60 * 1000);
        const endDateStr = endWib.toISOString().split('T')[0];
        // Get exceptions
        const { data: exceptions } = await connection_1.supabase
            .from('rutin_exceptions')
            .select('kegiatan_rutin_id, tanggal_dilewati, kegiatan_rutin!inner(user_id)')
            .eq('kegiatan_rutin.user_id', user_id)
            .gte('tanggal_dilewati', startDateStr)
            .lt('tanggal_dilewati', endDateStr);
        const exceptionSet = new Set((exceptions || []).map((e) => `${e.kegiatan_rutin_id}-${e.tanggal_dilewati}`));
        const { data: profile } = await connection_1.supabase
            .from('profiles')
            .select('semester_start, semester_end')
            .eq('id', user_id)
            .maybeSingle();
        // Get rutin
        const { data: rutinRes } = await connection_1.supabase
            .from('kegiatan_rutin')
            .select('*')
            .eq('user_id', user_id);
        const blocks = [];
        for (const row of (rutinRes || [])) {
            const dayOffset = row.hari_mingguan - 1;
            const eventDate = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
            const dateStr = eventDate.toISOString().split('T')[0];
            if (exceptionSet.has(`${row.id}-${dateStr}`))
                continue;
            if (profile?.semester_start && profile?.semester_end) {
                if (dateStr < profile.semester_start || dateStr > profile.semester_end)
                    continue;
                const semStart = new Date(profile.semester_start);
                const weekNum = Math.floor((new Date(dateStr).getTime() - semStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                if (weekNum > (row.batas_minggu_berulang || 16))
                    continue;
            }
            const startDateTimeStr = `${dateStr}T${row.jam_mulai}`;
            const endDateTimeStr = `${dateStr}T${row.jam_selesai}`;
            blocks.push({
                id: `r-${row.id}-${dateStr}`,
                type: 'rutin',
                judul: 'Sibuk',
                warna_hex: '#6B7280',
                start: startDateTimeStr,
                end: endDateTimeStr,
            });
        }
        // Get dinamis
        const { data: dinamisRes } = await connection_1.supabase
            .from('kegiatan_dinamis')
            .select('*')
            .eq('user_id', user_id)
            .gte('waktu_mulai', start.toISOString())
            .lt('waktu_mulai', end.toISOString());
        for (const row of (dinamisRes || [])) {
            blocks.push({
                id: `d-${row.id}`,
                type: 'dinamis',
                judul: 'Sibuk',
                warna_hex: '#6B7280',
                start: new Date(row.waktu_mulai).toISOString(),
                end: new Date(row.waktu_selesai).toISOString(),
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
