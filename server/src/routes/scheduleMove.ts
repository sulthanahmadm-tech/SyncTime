import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { checkConflicts } from '../utils/conflictChecker';

const router = Router();

router.put('/move', async (req: AuthenticatedRequest, res, next) => {
  const { id, type, newDate, newStartTime, newEndTime, newStartIso, newEndIso, isTemporary } = req.body;
  const force = req.query.force || req.body.force;

  if (!id || !type || !newDate || !newStartTime || !newEndTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userId = req.user!.id;

    if (type === 'dinamis') {
      const start = new Date(newStartIso);
      const end = new Date(newEndIso);

      if (force !== 'true' && force !== true) {
        const check = await checkConflicts(userId, { start, end, excludeId: Number(id), excludeType: 'dinamis' });
        if (check.hasConflict) {
          return res.status(409).json(check);
        }
      }

      const { data: updatedDinamis, error } = await supabase
        .from('kegiatan_dinamis')
        .update({ waktu_mulai: newStartIso, waktu_selesai: newEndIso })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!updatedDinamis) return res.status(404).json({ error: 'Kegiatan dinamis tidak ditemukan' });
      return res.json({ message: 'Kegiatan dinamis berhasil dipindahkan' });
    }

    if (type === 'rutin') {
      if (!isTemporary) {
        // Permanent move
        const [y, m, d] = newDate.split('-').map(Number);
        const dateUtc = new Date(Date.UTC(y, m - 1, d));
        let hariMingguan = dateUtc.getUTCDay() === 0 ? 7 : dateUtc.getUTCDay();

        const jamMulai = newStartTime.includes('T') ? newStartTime.split('T')[1].substring(0, 8) : newStartTime.substring(0, 8);
        const jamSelesai = newEndTime.includes('T') ? newEndTime.split('T')[1].substring(0, 8) : newEndTime.substring(0, 8);

        const start = new Date(newStartIso || `${newDate}T${jamMulai}+07:00`);
        const end = new Date(newEndIso || `${newDate}T${jamSelesai}+07:00`);

        if (force !== 'true' && force !== true) {
          const check = await checkConflicts(userId, { start, end, excludeId: Number(id), excludeType: 'rutin' });
          if (check.hasConflict) {
            return res.status(409).json(check);
          }
        }

        const { data: updatedRutin, error } = await supabase
          .from('kegiatan_rutin')
          .update({ hari_mingguan: hariMingguan, jam_mulai: jamMulai, jam_selesai: jamSelesai })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!updatedRutin) return res.status(404).json({ error: 'Kegiatan rutin tidak ditemukan' });
        return res.json({ message: 'Kegiatan rutin berhasil dipindahkan permanen' });
      } else {
        // Temporary move
        const { originalDate } = req.body;
        if (!originalDate) {
          return res.status(400).json({ error: 'originalDate is required for temporary move' });
        }

        const start = new Date(newStartIso);
        const end = new Date(newEndIso);

        if (force !== 'true' && force !== true) {
          const check = await checkConflicts(userId, { start, end });
          if (check.hasConflict) {
            return res.status(409).json(check);
          }
        }

        // Get the original rutin event
        const { data: rutinEvent, error: fetchError } = await supabase
          .from('kegiatan_rutin')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError || !rutinEvent) {
          return res.status(404).json({ error: 'Kegiatan rutin not found' });
        }

        // Insert exception if not already recorded
        const { data: existingExc } = await supabase
          .from('rutin_exceptions')
          .select('id')
          .eq('kegiatan_rutin_id', id)
          .eq('tanggal_dilewati', originalDate)
          .maybeSingle();

        if (!existingExc) {
          const { error: excError } = await supabase
            .from('rutin_exceptions')
            .insert({ kegiatan_rutin_id: id, tanggal_dilewati: originalDate });

          if (excError) throw excError;
        }

        // Insert temporary dinamis
        const { error: dinError } = await supabase
          .from('kegiatan_dinamis')
          .insert({
            user_id: userId,
            kategori_id: rutinEvent.kategori_id,
            judul: rutinEvent.judul,
            waktu_mulai: newStartIso,
            waktu_selesai: newEndIso
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
