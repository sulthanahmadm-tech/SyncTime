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

    if (semester_end <= semester_start) {
      return res.status(400).json({ error: 'semester_end must be greater than semester_start' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ semester_start, semester_end })
      .eq('id', userId)
      .select()
      .maybeSingle();

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

    for (const m of matkul_list) {
      const normStart = String(m.jam_mulai).length === 5 ? `${m.jam_mulai}:00` : String(m.jam_mulai);
      const normEnd = String(m.jam_selesai).length === 5 ? `${m.jam_selesai}:00` : String(m.jam_selesai);
      if (normEnd <= normStart) {
        return res.status(400).json({ error: `jam_selesai must be greater than jam_mulai for ${m.judul || 'matkul'}` });
      }
    }

    // Get the 'Kuliah' category for this user (auto-heal if empty)
    let { data: userCategories } = await supabase
      .from('kategori')
      .select('id, nama_kategori')
      .eq('user_id', userId);

    if (!userCategories || userCategories.length === 0) {
      const defaultCategories = [
        { user_id: userId, nama_kategori: 'Kuliah', warna_hex: '#EF4444' },
        { user_id: userId, nama_kategori: 'Acara Kampus', warna_hex: '#F59E0B' },
        { user_id: userId, nama_kategori: 'Tugas', warna_hex: '#3B82F6' },
        { user_id: userId, nama_kategori: 'Downtime', warna_hex: '#22C55E' }
      ];
      const { data: createdCats } = await supabase
        .from('kategori')
        .insert(defaultCategories)
        .select('id, nama_kategori');
      userCategories = createdCats || [];
    }

    const kuliahKategori = userCategories?.find(k => k.nama_kategori.toLowerCase() === 'kuliah') || userCategories?.[0];
    if (!kuliahKategori) {
      return res.status(400).json({ error: 'Kategori Kuliah not found for this user' });
    }

    // Get semester info for batas_minggu calculation
    const { data: profile } = await supabase
      .from('profiles')
      .select('semester_start, semester_end')
      .eq('id', userId)
      .maybeSingle();

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
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
