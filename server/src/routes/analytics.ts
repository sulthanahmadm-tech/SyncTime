import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

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

    const { data: categories, error: catError } = await supabase
      .from('kategori')
      .select('*')
      .eq('user_id', userId);
    
    if (catError) throw catError;
    
    // Initialize stats map
    const stats: Record<number, { nama_kategori: string, warna_hex: string, total_hours: number }> = {};
    for (const cat of (categories || [])) {
      stats[cat.id] = {
        nama_kategori: cat.nama_kategori,
        warna_hex: cat.warna_hex,
        total_hours: 0
      };
    }

    // Process Rutin
    const { data: rutinRes, error: rutinError } = await supabase
      .from('kegiatan_rutin')
      .select('*')
      .eq('user_id', userId);
      
    if (rutinError) throw rutinError;
    
    for (const r of (rutinRes || [])) {
      if (stats[r.kategori_id]) {
        // Calculate duration
        const startD = new Date(`1970-01-01T${r.jam_mulai}Z`);
        const endD = new Date(`1970-01-01T${r.jam_selesai}Z`);
        const hours = (endD.getTime() - startD.getTime()) / (1000 * 60 * 60);
        stats[r.kategori_id].total_hours += hours;
      }
    }

    // Process Dinamis
    const { data: dinamisRes, error: dinamisError } = await supabase
      .from('kegiatan_dinamis')
      .select('*')
      .eq('user_id', userId)
      .gte('waktu_mulai', start.toISOString())
      .lt('waktu_mulai', end.toISOString());
      
    if (dinamisError) throw dinamisError;
    
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
  } catch (err) {
    next(err);
  }
});

export default router;
