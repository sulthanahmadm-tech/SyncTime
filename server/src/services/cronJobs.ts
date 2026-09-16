import cron from 'node-cron';
import { supabase } from '../db/connection';
import { sendNotification } from './telegramBot';

export const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const targetTime = new Date(now.getTime() + 15 * 60000);

      let dayOfWeek = targetTime.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      const targetTimeStr = targetTime.toTimeString().substring(0, 5) + ':00';

      // Check Rutin (all users - Telegram bot is global for now)
      const { data: rutinRes } = await supabase
        .from('kegiatan_rutin')
        .select('*, kategori!inner(nama_kategori)')
        .eq('hari_mingguan', dayOfWeek)
        .eq('jam_mulai', targetTimeStr);

      for (const r of (rutinRes || [])) {
        const message = `🔔 *Pengingat Jadwal Rutin*\n\nKegiatan *${r.judul}* [${r.kategori.nama_kategori}] akan dimulai dalam 15 menit (Pukul ${r.jam_mulai.substring(0, 5)}).`;
        sendNotification(message);
      }

      // Check Dinamis
      const targetTimeStart = new Date(targetTime);
      targetTimeStart.setSeconds(0, 0);
      const targetTimeEnd = new Date(targetTimeStart.getTime() + 60000);

      const { data: dinamisRes } = await supabase
        .from('kegiatan_dinamis')
        .select('*, kategori!inner(nama_kategori)')
        .gte('waktu_mulai', targetTimeStart.toISOString())
        .lt('waktu_mulai', targetTimeEnd.toISOString())
        .eq('is_completed', false);

      for (const d of (dinamisRes || [])) {
        const timeStr = new Date(d.waktu_mulai).toTimeString().substring(0, 5);
        const message = `🔔 *Pengingat Jadwal Dinamis*\n\nKegiatan *${d.judul}* [${d.kategori.nama_kategori}] akan dimulai dalam 15 menit (Pukul ${timeStr}).`;
        sendNotification(message);
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });

  console.log('Cron jobs scheduled.');
};
