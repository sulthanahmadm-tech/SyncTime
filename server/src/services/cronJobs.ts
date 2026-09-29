import cron from 'node-cron';
import { supabase } from '../db/connection';
import { sendEmailNotification } from './emailNotifier';

export const startCronJobs = () => {
  // Check every minute for upcoming schedules
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const targetTime = new Date(now.getTime() + 20 * 60000); // 20 minutes ahead

      let dayOfWeek = targetTime.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      const targetTimeStr = targetTime.toTimeString().substring(0, 5) + ':00';

      // Get all users with email
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email')
        .not('email', 'is', null);

      if (usersError || !users) {
        console.error('[Cron] Failed to fetch users:', usersError);
        return;
      }

      for (const user of users) {
        if (!user.email) continue;

        // Check Rutin for this user
        const { data: rutinRes } = await supabase
          .from('kegiatan_rutin')
          .select('*, kategori!inner(nama_kategori)')
          .eq('user_id', user.id)
          .eq('hari_mingguan', dayOfWeek)
          .eq('jam_mulai', targetTimeStr);

        for (const r of (rutinRes || [])) {
          const subject = `⏰ Pengingat: ${r.judul} dimulai 20 menit lagi`;
          const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
              <h2 style="color: #818cf8; margin-top: 0;">🔔 Pengingat Jadwal Rutin</h2>
              <div style="background: #16213e; padding: 16px; border-radius: 8px; border-left: 4px solid #818cf8;">
                <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: #fff;">${r.judul}</p>
                <p style="margin: 4px 0; color: #a5b4fc;">📂 Kategori: ${r.kategori.nama_kategori}</p>
                <p style="margin: 4px 0; color: #a5b4fc;">🕐 Pukul: ${r.jam_mulai.substring(0, 5)}</p>
                <p style="margin: 4px 0; color: #a5b4fc;">📅 Tipe: Rutin Mingguan</p>
              </div>
              <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">Dikirim otomatis oleh SyncTime</p>
            </div>
          `;
          await sendEmailNotification(user.email, subject, html);
        }

        // Check Dinamis for this user
        const targetTimeStart = new Date(targetTime);
        targetTimeStart.setSeconds(0, 0);
        const targetTimeEnd = new Date(targetTimeStart.getTime() + 60000);

        const { data: dinamisRes } = await supabase
          .from('kegiatan_dinamis')
          .select('*, kategori!inner(nama_kategori)')
          .eq('user_id', user.id)
          .gte('waktu_mulai', targetTimeStart.toISOString())
          .lt('waktu_mulai', targetTimeEnd.toISOString())
          .eq('is_completed', false);

        for (const d of (dinamisRes || [])) {
          const timeStr = new Date(d.waktu_mulai).toTimeString().substring(0, 5);
          const subject = `⏰ Pengingat: ${d.judul} dimulai 20 menit lagi`;
          const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
              <h2 style="color: #818cf8; margin-top: 0;">🔔 Pengingat Jadwal</h2>
              <div style="background: #16213e; padding: 16px; border-radius: 8px; border-left: 4px solid #818cf8;">
                <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: #fff;">${d.judul}</p>
                <p style="margin: 4px 0; color: #a5b4fc;">📂 Kategori: ${d.kategori.nama_kategori}</p>
                <p style="margin: 4px 0; color: #a5b4fc;">🕐 Pukul: ${timeStr}</p>
                <p style="margin: 4px 0; color: #a5b4fc;">📅 Tipe: Dinamis</p>
              </div>
              <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">Dikirim otomatis oleh SyncTime</p>
            </div>
          `;
          await sendEmailNotification(user.email, subject, html);
        }
      }
    } catch (error) {
      console.error('[Cron] Error in email notification job:', error);
    }
  });

  console.log('Email notification cron jobs scheduled (every minute, 20min ahead).');
};
