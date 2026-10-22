import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { checkConflicts } from '../utils/conflictChecker';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('kegiatan_dinamis')
      .select('*, kategori!inner(warna_hex, nama_kategori)')
      .eq('user_id', userId)
      .order('waktu_mulai', { ascending: true });
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
  const { kategori_id, judul, waktu_mulai, waktu_selesai } = req.body;
  const { force } = req.query;

  try {
    const userId = req.user!.id;
    const start = new Date(waktu_mulai);
    const end = new Date(waktu_selesai);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      return res.status(400).json({ error: 'waktu_selesai must be greater than waktu_mulai' });
    }

    const check = await checkConflicts(userId, { start, end });
    if (check.hasConflict && force !== 'true') {
      return res.status(409).json(check);
    }

    const { data, error } = await supabase
      .from('kegiatan_dinamis')
      .insert({
        user_id: userId,
        kategori_id,
        judul,
        waktu_mulai: start.toISOString(),
        waktu_selesai: end.toISOString()
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
  const { kategori_id, judul, waktu_mulai, waktu_selesai, is_completed } = req.body;
  const { force } = req.query;

  try {
    const userId = req.user!.id;
    const start = new Date(waktu_mulai);
    const end = new Date(waktu_selesai);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      return res.status(400).json({ error: 'waktu_selesai must be greater than waktu_mulai' });
    }

    const check = await checkConflicts(userId, { start, end, excludeId: Number(id), excludeType: 'dinamis' });
    if (check.hasConflict && force !== 'true') {
      return res.status(409).json(check);
    }

    const completed = Boolean(is_completed);
    const { data, error } = await supabase
      .from('kegiatan_dinamis')
      .update({
        kategori_id,
        judul,
        waktu_mulai: start.toISOString(),
        waktu_selesai: end.toISOString(),
        is_completed: completed
      })
      .eq('id', Number(id))
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/complete', async (req: AuthenticatedRequest, res, next) => {
  const { id } = req.params;
  try {
    const userId = req.user!.id;
    const { data: current, error: getError } = await supabase
      .from('kegiatan_dinamis')
      .select('is_completed')
      .eq('id', Number(id))
      .eq('user_id', userId)
      .single();
      
    if (getError || !current) return res.status(404).json({ error: 'Not found' });
    
    const newVal = !current.is_completed;
    
    const { data, error } = await supabase
      .from('kegiatan_dinamis')
      .update({ is_completed: newVal })
      .eq('id', Number(id))
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) throw error;
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
      .from('kegiatan_dinamis')
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
