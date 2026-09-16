import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CalendarBlock } from '../types';

const router = Router();

router.get('/weekly', async (req: AuthenticatedRequest, res, next) => {
  const { week_start } = req.query;
  if (!week_start || typeof week_start !== 'string') {
    return res.status(400).json({ error: 'week_start query param is required' });
  }

  try {
    const userId = req.user!.id;
    const start = new Date(week_start);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const { data: rutinRes, error: rutinError } = await supabase
      .from('kegiatan_rutin')
      .select('*, kategori!inner(warna_hex, nama_kategori)')
      .eq('user_id', userId);
    
    if (rutinError) throw rutinError;

    const { data: exceptionsRes, error: exceptionsError } = await supabase
      .from('rutin_exceptions')
      .select('kegiatan_rutin_id, tanggal_dilewati, kegiatan_rutin!inner(user_id)')
      .eq('kegiatan_rutin.user_id', userId)
      .gte('tanggal_dilewati', startDateStr)
      .lt('tanggal_dilewati', endDateStr);

    if (exceptionsError) throw exceptionsError;

    const exceptionSet = new Set((exceptionsRes || []).map(e => `${e.kegiatan_rutin_id}-${e.tanggal_dilewati}`));

    const blocks: CalendarBlock[] = [];
    
    for (const row of (rutinRes || [])) {
      const dayOffset = row.hari_mingguan - 1; 
      const eventDate = new Date(start);
      eventDate.setDate(eventDate.getDate() + dayOffset);
      
      const dateStr = eventDate.toISOString().split('T')[0];
      
      // Skip if there's an exception for this date
      if (exceptionSet.has(`${row.id}-${dateStr}`)) {
        continue;
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
        start: new Date(startDateTimeStr).toISOString(),
        end: new Date(endDateTimeStr).toISOString(),
        hari_mingguan: row.hari_mingguan
      });
    }

    const { data: dinamisRes, error: dinamisError } = await supabase
      .from('kegiatan_dinamis')
      .select('*, kategori!inner(warna_hex, nama_kategori)')
      .eq('user_id', userId)
      .gte('waktu_mulai', start.toISOString())
      .lt('waktu_mulai', end.toISOString());

    if (dinamisError) throw dinamisError;

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
  } catch (err) {
    next(err);
  }
});

export default router;
