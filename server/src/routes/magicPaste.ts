import { Router } from 'express';
import { supabase } from '../db/connection';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

router.post('/magic-paste', async (req: AuthenticatedRequest, res, next) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  try {
    const userId = req.user!.id;
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `Kamu adalah sistem ekstraksi jadwal kuliah dan kegiatan akademik mahasiswa.
Tugasmu adalah mengubah teks input mentah (bisa berupa teks jadwal semester/SIAKAD, pengumuman perkuliahan berulang mingguan, atau agenda/acara dengan tanggal kalender spesifik) menjadi format JSON array murni tanpa pembuka/penutup markdown.

Setiap objek dalam array JSON HARUS memiliki salah satu dari dua format berikut:

Format 1: Jadwal Kuliah Rutin / Berulang Mingguan:
{
  "is_rutin": true,
  "judul": "Nama Mata Kuliah / Kegiatan",
  "hari_mingguan": 1, // integer 1-7 (1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu, 7=Minggu)
  "jam_mulai": "08:00:00", // format HH:MM:SS
  "jam_selesai": "09:40:00" // format HH:MM:SS
}

Format 2: Jadwal Kegiatan Dinamis / Sekali Waktu (kegiatan yang memiliki tanggal kalender spesifik, seminar, ujian bertanggal tertentu, deadline tugas):
{
  "is_rutin": false,
  "judul": "Nama Acara / Ujian / Tugas",
  "waktu_mulai": "2026-10-25T09:00:00", // format ISO 8601 dengan tanggal kalender spesifik
  "waktu_selesai": "2026-10-25T11:00:00" // format ISO 8601 (jika waktu selesai tidak ditulis, buat estimasi 1-2 jam setelah waktu mulai)
}

Aturan klasifikasi:
- Jika teks menyebut nama hari tanpa tanggal kalender spesifik (contoh: "Senin 08.00-10.00 Algoritma"), golongkan ke Format 1 (is_rutin: true).
- Jika teks memiliki tanggal kalender tertentu (contoh: "28 Oktober 2026", "2026-11-05 jam 14:00"), golongkan ke Format 2 (is_rutin: false).
- Jam mulai dan selesai pada jadwal rutin harus format HH:MM:SS (contoh '08:00:00').
- Kembalikan HANYA array JSON yang valid agar bisa langsung di-parse dengan JSON.parse(). Jangan sertakan markdown \`\`\`json.

Teks Masukan:
${rawText}`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (modelError: any) {
      if (modelError.message && modelError.message.includes('404')) {
        console.log('Falling back to gemini-2.5-flash due to 404');
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        result = await model.generateContent(prompt);
      } else {
        throw modelError;
      }
    }

    let textResponse = result.response.text().trim();
    
    // Safety check just in case Gemini still includes markdown blocks
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.replace(/^```json\n?/, '');
      if (textResponse.endsWith('```')) {
        textResponse = textResponse.slice(0, -3).trim();
      }
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.replace(/^```\n?/, '');
      if (textResponse.endsWith('```')) {
        textResponse = textResponse.slice(0, -3).trim();
      }
    }

    let scheduleData: any[];
    try {
      scheduleData = JSON.parse(textResponse);
      if (!Array.isArray(scheduleData)) {
        throw new Error('Parsed JSON is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse);
      return res.status(400).json({ error: 'Gagal mengekstrak JSON valid dari teks yang diberikan.' });
    }

    // Get user semester bounds to calculate batasMinggu
    const { data: profile } = await supabase
      .from('profiles')
      .select('semester_start, semester_end')
      .eq('id', userId)
      .maybeSingle();

    let batasMinggu = 16;
    if (profile?.semester_start && profile?.semester_end) {
      const diffWeeks = Math.ceil(
        (new Date(profile.semester_end).getTime() - new Date(profile.semester_start).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      if (diffWeeks > 0) batasMinggu = diffWeeks;
    }

    // Get default Kuliah category for this user (auto-heal if empty)
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
        .upsert(defaultCategories, { onConflict: 'user_id,nama_kategori', ignoreDuplicates: true })
        .select('id, nama_kategori');
      userCategories = (createdCats && createdCats.length > 0) ? createdCats : (
        await supabase.from('kategori').select('id, nama_kategori').eq('user_id', userId)
      ).data || [];
    }

    const kuliahKat = userCategories?.find(k => k.nama_kategori.toLowerCase() === 'kuliah') || userCategories?.[0];
    const kategoriId = kuliahKat?.id;
    if (!kategoriId) {
      return res.status(400).json({ error: 'Tidak dapat menemukan atau membuat kategori untuk pengguna ini.' });
    }

    // Build insert arrays for both routine and dynamic activities
    const rutinItems: any[] = [];
    const dinamisItems: any[] = [];

    for (const item of scheduleData) {
      const isRutin = item.is_rutin === true || (item.hari_mingguan && !item.waktu_mulai);
      if (isRutin && item.judul && item.hari_mingguan && item.jam_mulai && item.jam_selesai) {
        let jamMulai = String(item.jam_mulai).trim();
        if (jamMulai.length === 5) jamMulai += ':00';
        let jamSelesai = String(item.jam_selesai).trim();
        if (jamSelesai.length === 5) jamSelesai += ':00';

        rutinItems.push({
          user_id: userId,
          kategori_id: kategoriId,
          judul: item.judul,
          hari_mingguan: parseInt(item.hari_mingguan),
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
          batas_minggu_berulang: batasMinggu,
          is_matkul_wajib: true
        });
      } else if (!isRutin && item.judul && item.waktu_mulai) {
        const start = new Date(item.waktu_mulai);
        if (isNaN(start.getTime())) continue;
        let end = item.waktu_selesai ? new Date(item.waktu_selesai) : new Date(start.getTime() + 60 * 60 * 1000);
        if (isNaN(end.getTime()) || end <= start) {
          end = new Date(start.getTime() + 60 * 60 * 1000);
        }

        dinamisItems.push({
          user_id: userId,
          kategori_id: kategoriId,
          judul: item.judul,
          waktu_mulai: start.toISOString(),
          waktu_selesai: end.toISOString(),
          is_completed: false
        });
      }
    }

    let insertedRutin: any[] = [];
    let insertedDinamis: any[] = [];

    if (rutinItems.length > 0) {
      const { data, error } = await supabase
        .from('kegiatan_rutin')
        .insert(rutinItems)
        .select();
      if (error) throw error;
      insertedRutin = data || [];
    }

    if (dinamisItems.length > 0) {
      const { data, error } = await supabase
        .from('kegiatan_dinamis')
        .insert(dinamisItems)
        .select();
      if (error) throw error;
      insertedDinamis = data || [];
    }

    const totalCount = insertedRutin.length + insertedDinamis.length;
    res.json({
      message: `Jadwal berhasil diekstrak dan disimpan (${totalCount} item).`,
      data: [...insertedRutin, ...insertedDinamis],
      rutin: insertedRutin,
      dinamis: insertedDinamis
    });
  } catch (error: any) {
    console.error('Magic Paste Error:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server saat memproses AI.' });
  }
});

export default router;
