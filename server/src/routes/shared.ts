import { Router } from 'express';
import { supabase } from '../db/connection';

const router = Router();

router.get('/free-time', async (req, res, next) => {
  const { week_start, user_id } = req.query;
  if (!week_start || typeof week_start !== 'string') {
    return res.status(400).json({ error: 'week_start query param is required' });
  }
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id query param is required' });
  }

  try {
    const start = new Date(week_start);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    // Get exceptions
    const { data: exceptions } = await supabase
      .from('rutin_exceptions')
      .select('kegiatan_rutin_id, tanggal_dilewati, kegiatan_rutin!inner(user_id)')
      .eq('kegiatan_rutin.user_id', user_id)
      .gte('tanggal_dilewati', startDateStr)
      .lt('tanggal_dilewati', endDateStr);

    const exceptionSet = new Set((exceptions || []).map((e: any) => `${e.kegiatan_rutin_id}-${e.tanggal_dilewati}`));

    // Get rutin
    const { data: rutinRes } = await supabase
      .from('kegiatan_rutin')
      .select('*')
      .eq('user_id', user_id);

    const blocks: any[] = [];

    for (const row of (rutinRes || [])) {
      const dayOffset = row.hari_mingguan - 1;
      const eventDate = new Date(start);
      eventDate.setDate(eventDate.getDate() + dayOffset);
      const dateStr = eventDate.toISOString().split('T')[0];

      if (exceptionSet.has(`${row.id}-${dateStr}`)) continue;

      const startDateTimeStr = `${dateStr}T${row.jam_mulai}`;
      const endDateTimeStr = `${dateStr}T${row.jam_selesai}`;

      blocks.push({
        id: `r-${row.id}-${dateStr}`,
        type: 'rutin',
        judul: 'Sibuk',
        warna_hex: '#6B7280',
        start: new Date(startDateTimeStr).toISOString(),
        end: new Date(endDateTimeStr).toISOString(),
      });
    }

    // Get dinamis
    const { data: dinamisRes } = await supabase
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
  } catch (err) {
    next(err);
  }
});

export default router;
