import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Set semester period
router.put('/semester', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { semester_start, semester_end } = req.body;

    if (!semester_start || !semester_end) {
      return res.status(400).json({ error: 'semester_start and semester_end are required' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ semester_start, semester_end })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Bulk insert matkul wajib
router.post('/matkul', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { matkul_list } = req.body;

    if (!Array.isArray(matkul_list) || matkul_list.length === 0) {
      return res.status(400).json({ error: 'matkul_list array is required' });
    }

    // Get the 'Kuliah' category for this user
    const { data: kuliahKategori, error: katError } = await supabase
      .from('kategori')
      .select('id')
      .eq('user_id', userId)
      .eq('nama_kategori', 'Kuliah')
      .single();

    if (katError || !kuliahKategori) {
      return res.status(400).json({ error: 'Kategori Kuliah not found for this user' });
    }

    // Get semester info for batas_minggu calculation
    const { data: profile } = await supabase
      .from('profiles')
      .select('semester_start, semester_end')
      .eq('id', userId)
      .single();

    let batasMinggu = 16;
    if (profile?.semester_start && profile?.semester_end) {
      const start = new Date(profile.semester_start);
      const end = new Date(profile.semester_end);
      const diffWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      batasMinggu = Math.min(diffWeeks, 16);
    }

    const insertData = matkul_list.map((m: any) => ({
      user_id: userId,
      kategori_id: kuliahKategori.id,
      judul: m.judul,
      hari_mingguan: m.hari_mingguan,
      jam_mulai: m.jam_mulai,
      jam_selesai: m.jam_selesai,
      batas_minggu_berulang: batasMinggu,
      is_matkul_wajib: true
    }));

    const { data, error } = await supabase
      .from('kegiatan_rutin')
      .insert(insertData)
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Mark onboarding as completed
router.put('/complete', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
