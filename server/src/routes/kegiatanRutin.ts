import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { checkConflicts } from '../utils/conflictChecker';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('kegiatan_rutin')
      .select('*, kategori!inner(warna_hex, nama_kategori)')
      .eq('user_id', userId)
      .order('id', { ascending: true });
    if (error) throw error;
    // Flatten the joined data
    const result = (data || []).map((r: any) => ({
      ...r,
      warna_hex: r.kategori.warna_hex,
      nama_kategori: r.kategori.nama_kategori,
      kategori: undefined
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/matkul-wajib', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('kegiatan_rutin')
      .select('*, kategori!inner(warna_hex, nama_kategori)')
      .eq('user_id', userId)
      .eq('is_matkul_wajib', true)
      .order('hari_mingguan', { ascending: true });
    if (error) throw error;
    const result = (data || []).map((r: any) => ({
      ...r,
      warna_hex: r.kategori.warna_hex,
      nama_kategori: r.kategori.nama_kategori,
      kategori: undefined
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});


router.post('/', async (req: AuthenticatedRequest, res, next) => {
  const { kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang, is_matkul_wajib } = req.body;
  const { force } = req.query;
  try {
    const userId = req.user!.id;
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
    let currentDay = nowWib.getUTCDay();
    if (currentDay === 0) currentDay = 7;
    const diff = Number(hari_mingguan) - currentDay;
    const checkDate = new Date(nowWib);
    checkDate.setUTCDate(checkDate.getUTCDate() + diff);
    const dateStr = checkDate.toISOString().split('T')[0];
    const normStart = String(jam_mulai).length === 5 ? `${jam_mulai}:00` : String(jam_mulai);
    const normEnd = String(jam_selesai).length === 5 ? `${jam_selesai}:00` : String(jam_selesai);

    if (normEnd <= normStart) {
      return res.status(400).json({ error: 'jam_selesai must be greater than jam_mulai' });
    }

    const startDate = new Date(`${dateStr}T${normStart}+07:00`);
    const endDate = new Date(`${dateStr}T${normEnd}+07:00`);

    const check = await checkConflicts(userId, { start: startDate, end: endDate });
    if (check.hasConflict && force !== 'true') {
      return res.status(409).json(check);
    }

    const { data, error } = await supabase
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
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  const { id } = req.params;
  const { kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang } = req.body;
  const { force } = req.query;
  try {
    const userId = req.user!.id;
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
    let currentDay = nowWib.getUTCDay();
    if (currentDay === 0) currentDay = 7;
    const diff = Number(hari_mingguan) - currentDay;
    const checkDate = new Date(nowWib);
    checkDate.setUTCDate(checkDate.getUTCDate() + diff);
    const dateStr = checkDate.toISOString().split('T')[0];
    const normStart = String(jam_mulai).length === 5 ? `${jam_mulai}:00` : String(jam_mulai);
    const normEnd = String(jam_selesai).length === 5 ? `${jam_selesai}:00` : String(jam_selesai);

    if (normEnd <= normStart) {
      return res.status(400).json({ error: 'jam_selesai must be greater than jam_mulai' });
    }

    const startDate = new Date(`${dateStr}T${normStart}+07:00`);
    const endDate = new Date(`${dateStr}T${normEnd}+07:00`);

    const check = await checkConflicts(userId, { start: startDate, end: endDate, excludeId: Number(id), excludeType: 'rutin' });
    if (check.hasConflict && force !== 'true') {
      return res.status(409).json(check);
    }

    const updatePayload: any = { kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang };
    if (req.body.is_matkul_wajib !== undefined) {
      updatePayload.is_matkul_wajib = Boolean(req.body.is_matkul_wajib);
    }

    const { data, error } = await supabase
      .from('kegiatan_rutin')
      .update(updatePayload)
      .eq('id', Number(id))
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  const { id } = req.params;
  try {
    const userId = req.user!.id;
    const { error } = await supabase
      .from('kegiatan_rutin')
      .delete()
      .eq('id', Number(id))
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
