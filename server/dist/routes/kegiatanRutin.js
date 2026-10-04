"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../db/connection");
const conflictChecker_1 = require("../utils/conflictChecker");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await connection_1.supabase
            .from('kegiatan_rutin')
            .select('*, kategori!inner(warna_hex, nama_kategori)')
            .eq('user_id', userId)
            .order('id', { ascending: true });
        if (error)
            throw error;
        // Flatten the joined data
        const result = (data || []).map((r) => ({
            ...r,
            warna_hex: r.kategori.warna_hex,
            nama_kategori: r.kategori.nama_kategori,
            kategori: undefined
        }));
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/matkul-wajib', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await connection_1.supabase
            .from('kegiatan_rutin')
            .select('*, kategori!inner(warna_hex, nama_kategori)')
            .eq('user_id', userId)
            .eq('is_matkul_wajib', true)
            .order('hari_mingguan', { ascending: true });
        if (error)
            throw error;
        const result = (data || []).map((r) => ({
            ...r,
            warna_hex: r.kategori.warna_hex,
            nama_kategori: r.kategori.nama_kategori,
            kategori: undefined
        }));
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/weekly', async (req, res, next) => {
    const { week_start } = req.query;
    if (!week_start || typeof week_start !== 'string') {
        return res.status(400).json({ error: 'week_start query param is required (YYYY-MM-DD)' });
    }
    try {
        const userId = req.user.id;
        const start = new Date(week_start);
        const { data, error } = await connection_1.supabase
            .from('kegiatan_rutin')
            .select('*, kategori!inner(warna_hex, nama_kategori)')
            .eq('user_id', userId);
        if (error)
            throw error;
        const blocks = [];
        for (const row of (data || [])) {
            const dayOffset = row.hari_mingguan - 1;
            const eventDate = new Date(start);
            eventDate.setDate(eventDate.getDate() + dayOffset);
            const dateStr = eventDate.toISOString().split('T')[0];
            // jam_mulai and jam_selesai are TIME type from PostgreSQL, returned as 'HH:MM:SS'
            const startDateTimeStr = `${dateStr}T${row.jam_mulai}`;
            const endDateTimeStr = `${dateStr}T${row.jam_selesai}`;
            blocks.push({
                id: row.id,
                type: 'rutin',
                kategori_id: row.kategori_id,
                judul: row.judul,
                warna_hex: row.kategori.warna_hex,
                nama_kategori: row.kategori.nama_kategori,
                start: new Date(startDateTimeStr).toISOString(),
                end: new Date(endDateTimeStr).toISOString(),
                hari_mingguan: row.hari_mingguan
            });
        }
        res.json(blocks);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    const { kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang, is_matkul_wajib } = req.body;
    const { force } = req.query;
    try {
        const userId = req.user.id;
        const now = new Date();
        let currentDay = now.getDay();
        if (currentDay === 0)
            currentDay = 7;
        const diff = hari_mingguan - currentDay;
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + diff);
        const dateStr = checkDate.toISOString().split('T')[0];
        const startDate = new Date(`${dateStr}T${jam_mulai}`);
        const endDate = new Date(`${dateStr}T${jam_selesai}`);
        const check = await (0, conflictChecker_1.checkConflicts)(userId, { start: startDate, end: endDate });
        if (check.hasConflict && force !== 'true') {
            return res.status(409).json(check);
        }
        const { data, error } = await connection_1.supabase
            .from('kegiatan_rutin')
            .insert({
            user_id: userId,
            kategori_id,
            judul,
            hari_mingguan,
            jam_mulai,
            jam_selesai,
            batas_minggu_berulang: batas_minggu_berulang || 16,
            is_matkul_wajib: is_matkul_wajib || false
        })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    const { id } = req.params;
    const { kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang } = req.body;
    const { force } = req.query;
    try {
        const userId = req.user.id;
        const now = new Date();
        let currentDay = now.getDay();
        if (currentDay === 0)
            currentDay = 7;
        const diff = hari_mingguan - currentDay;
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + diff);
        const dateStr = checkDate.toISOString().split('T')[0];
        const startDate = new Date(`${dateStr}T${jam_mulai}`);
        const endDate = new Date(`${dateStr}T${jam_selesai}`);
        const check = await (0, conflictChecker_1.checkConflicts)(userId, { start: startDate, end: endDate, excludeId: Number(id), excludeType: 'rutin' });
        if (check.hasConflict && force !== 'true') {
            return res.status(409).json(check);
        }
        const { data, error } = await connection_1.supabase
            .from('kegiatan_rutin')
            .update({ kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang })
            .eq('id', Number(id))
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ error: 'Not found' });
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const userId = req.user.id;
        const { error } = await connection_1.supabase
            .from('kegiatan_rutin')
            .delete()
            .eq('id', Number(id))
            .eq('user_id', userId);
        if (error)
            throw error;
        res.json({ message: 'Deleted successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
