import { Router } from 'express';
import { supabase } from '../db/connection';

const router = Router();

router.get('/status', async (req, res, next) => {
  const { user_id } = req.query;
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id query param is required' });
  }

  try {
    const now = new Date();
    let dayOfWeek = now.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    const currentTimeStr = now.toTimeString().substring(0, 8);
    const currentIsoStr = now.toISOString();

    // Check Dinamis first
    const { data: dinamisRes } = await supabase
      .from('kegiatan_dinamis')
      .select('*, kategori!inner(kode_led_iot, nama_kategori)')
      .eq('user_id', user_id)
      .lte('waktu_mulai', currentIsoStr)
      .gte('waktu_selesai', currentIsoStr)
      .eq('is_completed', false)
      .order('waktu_mulai', { ascending: false })
      .limit(1);

    if (dinamisRes && dinamisRes.length > 0) {
      const d = dinamisRes[0];
      return res.json({
        status: 'ACTIVE',
        led_code: d.kategori.kode_led_iot || 'OFF',
        type: 'dinamis',
        judul: d.judul,
        kategori: d.kategori.nama_kategori
      });
    }

    // Check Rutin
    const { data: rutinRes } = await supabase
      .from('kegiatan_rutin')
      .select('*, kategori!inner(kode_led_iot, nama_kategori)')
      .eq('user_id', user_id)
      .eq('hari_mingguan', dayOfWeek)
      .lte('jam_mulai', currentTimeStr)
      .gte('jam_selesai', currentTimeStr)
      .order('jam_mulai', { ascending: false })
      .limit(1);

    if (rutinRes && rutinRes.length > 0) {
      const r = rutinRes[0];
      return res.json({
        status: 'ACTIVE',
        led_code: r.kategori.kode_led_iot || 'OFF',
        type: 'rutin',
        judul: r.judul,
        kategori: r.kategori.nama_kategori
      });
    }

    return res.json({
      status: 'IDLE',
      led_code: 'OFF',
      type: null,
      judul: null,
      kategori: null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
