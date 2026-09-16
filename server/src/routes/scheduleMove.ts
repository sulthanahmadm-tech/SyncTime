import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

router.put('/move', async (req: AuthenticatedRequest, res, next) => {
  const { id, type, newDate, newStartTime, newEndTime, isTemporary } = req.body;

  if (!id || !type || !newDate || !newStartTime || !newEndTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userId = req.user!.id;

    if (type === 'dinamis') {
      const startDateTime = `${newDate}T${newStartTime}`;
      const endDateTime = `${newDate}T${newEndTime}`;

      const { error } = await supabase
        .from('kegiatan_dinamis')
        .update({ waktu_mulai: startDateTime, waktu_selesai: endDateTime })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return res.json({ message: 'Kegiatan dinamis berhasil dipindahkan' });
    }

    if (type === 'rutin') {
      if (!isTemporary) {
        // Permanent move
        const dateObj = new Date(newDate);
        let hariMingguan = dateObj.getDay();
        if (hariMingguan === 0) hariMingguan = 7;

        const jamMulai = newStartTime.includes('T') ? newStartTime.split('T')[1].substring(0, 8) : newStartTime.substring(0, 8);
        const jamSelesai = newEndTime.includes('T') ? newEndTime.split('T')[1].substring(0, 8) : newEndTime.substring(0, 8);

        const { error } = await supabase
          .from('kegiatan_rutin')
          .update({ hari_mingguan: hariMingguan, jam_mulai: jamMulai, jam_selesai: jamSelesai })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
        return res.json({ message: 'Kegiatan rutin berhasil dipindahkan permanen' });
      } else {
        // Temporary move
        const { originalDate } = req.body;
        if (!originalDate) {
          return res.status(400).json({ error: 'originalDate is required for temporary move' });
        }

        // Get the original rutin event
        const { data: rutinEvent, error: fetchError } = await supabase
          .from('kegiatan_rutin')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (fetchError || !rutinEvent) {
          return res.status(404).json({ error: 'Kegiatan rutin not found' });
        }

        // Insert exception
        const { error: excError } = await supabase
          .from('rutin_exceptions')
          .insert({ kegiatan_rutin_id: id, tanggal_dilewati: originalDate });

        if (excError) throw excError;

        // Insert temporary dinamis
        const startDateTime = `${newDate}T${newStartTime}`;
        const endDateTime = `${newDate}T${newEndTime}`;

        const { error: dinError } = await supabase
          .from('kegiatan_dinamis')
          .insert({
            user_id: userId,
            kategori_id: rutinEvent.kategori_id,
            judul: rutinEvent.judul,
            waktu_mulai: startDateTime,
            waktu_selesai: endDateTime
          });

        if (dinError) throw dinError;
        return res.json({ message: 'Kegiatan rutin berhasil dipindahkan sementara' });
      }
    }

    res.status(400).json({ error: 'Invalid type' });
  } catch (error) {
    next(error);
  }
});

export default router;
