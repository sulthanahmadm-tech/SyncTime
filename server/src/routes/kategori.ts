import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    let { data, error } = await supabase
      .from('kategori')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    // Auto-heal: If user has no categories (e.g. trigger failed or legacy user), create defaults
    if (!data || data.length === 0) {
      const defaultCategories = [
        { user_id: userId, nama_kategori: 'Kuliah', warna_hex: '#EF4444', kode_led_iot: 'RED' },
        { user_id: userId, nama_kategori: 'Acara Kampus', warna_hex: '#F59E0B', kode_led_iot: 'YELLOW' },
        { user_id: userId, nama_kategori: 'Tugas', warna_hex: '#3B82F6', kode_led_iot: 'BLUE' },
        { user_id: userId, nama_kategori: 'Downtime', warna_hex: '#22C55E', kode_led_iot: 'GREEN' }
      ];
      
      const { data: insertedData, error: insertError } = await supabase
        .from('kategori')
        .insert(defaultCategories)
        .select('*');
        
      if (insertError) throw insertError;
      data = insertedData;
    }
    
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthenticatedRequest, res, next) => {
  const { nama_kategori, warna_hex, kode_led_iot } = req.body;
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('kategori')
      .insert({ user_id: userId, nama_kategori, warna_hex, kode_led_iot })
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
  const { nama_kategori, warna_hex, kode_led_iot } = req.body;
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('kategori')
      .update({ nama_kategori, warna_hex, kode_led_iot })
      .eq('id', Number(id))
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Kategori not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  const { id } = req.params;
  try {
    const userId = req.user!.id;
    const { error, count } = await supabase
      .from('kategori')
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
