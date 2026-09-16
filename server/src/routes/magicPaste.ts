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

    const prompt = `Kamu adalah sistem ekstraksi data jadwal. Ubah teks berantakan yang diberikan user menjadi format JSON array murni. Key yang harus ada di setiap objek: judul (string), hari_mingguan (integer 1-7, di mana 1 adalah Senin), jam_mulai (string format HH:MM:SS), jam_selesai (string format HH:MM:SS). Jangan tambahkan format markdown seperti \`\`\`json, jangan ada teks pembuka/penutup, kembalikan HANYA array JSON yang valid agar bisa langsung di-parse dengan JSON.parse().\n\nTeks Jadwal:\n${rawText}`;

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

    // Get default Kuliah category for this user
    const { data: kuliahKat } = await supabase
      .from('kategori')
      .select('id')
      .eq('user_id', userId)
      .eq('nama_kategori', 'Kuliah')
      .single();

    let kategoriId: number;
    if (kuliahKat) {
      kategoriId = kuliahKat.id;
    } else {
      // Fallback to first category
      const { data: firstKat } = await supabase
        .from('kategori')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();
      kategoriId = firstKat?.id || 1;
    }

    const batasMinggu = 16;

    // Build insert array
    const insertData = scheduleData
      .filter(sched => sched.judul && sched.hari_mingguan && sched.jam_mulai && sched.jam_selesai)
      .map(sched => ({
        user_id: userId,
        kategori_id: kategoriId,
        judul: sched.judul,
        hari_mingguan: sched.hari_mingguan,
        jam_mulai: sched.jam_mulai,
        jam_selesai: sched.jam_selesai,
        batas_minggu_berulang: batasMinggu
      }));

    const { data: insertedData, error } = await supabase
      .from('kegiatan_rutin')
      .insert(insertData)
      .select();

    if (error) throw error;

    res.json({ message: 'Jadwal berhasil diekstrak dan disimpan.', data: insertedData });
  } catch (error: any) {
    console.error('Magic Paste Error:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server saat memproses AI.' });
  }
});

export default router;
