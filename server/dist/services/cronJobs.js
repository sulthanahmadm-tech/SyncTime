"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = exports.checkAndSendDailySchedule = exports.checkAndSendReminders = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const connection_1 = require("../db/connection");
const emailNotifier_1 = require("./emailNotifier");
const checkAndSendReminders = async () => {
    try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + 20 * 60000); // 20 minutes ahead
        let dayOfWeek = targetTime.getDay();
        if (dayOfWeek === 0)
            dayOfWeek = 7;
        const targetTimeStr = targetTime.toTimeString().substring(0, 5) + ':00';
        // Get all users with email
        const { data: users, error: usersError } = await connection_1.supabase
            .from('profiles')
            .select('id, email')
            .not('email', 'is', null);
        if (usersError || !users) {
            console.error('[Cron] Failed to fetch users:', usersError);
            return;
        }
        for (const user of users) {
            if (!user.email)
                continue;
            // Check Rutin for this user
            const { data: rutinRes } = await connection_1.supabase
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
              <p style="margin: 4px 0; color: #a5b4fc;">🕗 Pukul: ${r.jam_mulai.substring(0, 5)}</p>
              <p style="margin: 4px 0; color: #a5b4fc;">📅 Tipe: Rutin Mingguan</p>
            </div>
            <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">Dikirim otomatis oleh SyncTime</p>
          </div>
        `;
                await (0, emailNotifier_1.sendEmailNotification)(user.email, subject, html);
            }
            // Check Dinamis for this user
            const targetTimeStart = new Date(targetTime);
            targetTimeStart.setSeconds(0, 0);
            const targetTimeEnd = new Date(targetTimeStart.getTime() + 60000);
            const { data: dinamisRes } = await connection_1.supabase
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
              <p style="margin: 4px 0; color: #a5b4fc;">🕗 Pukul: ${timeStr}</p>
              <p style="margin: 4px 0; color: #a5b4fc;">📅 Tipe: Dinamis</p>
            </div>
            <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">Dikirim otomatis oleh SyncTime</p>
          </div>
        `;
                await (0, emailNotifier_1.sendEmailNotification)(user.email, subject, html);
            }
        }
    }
    catch (error) {
        console.error('[Cron] Error in email notification job:', error);
    }
};
exports.checkAndSendReminders = checkAndSendReminders;
const checkAndSendDailySchedule = async () => {
    try {
        const now = new Date();
        const gmt7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const gmt7Hour = gmt7Time.getUTCHours();
        let isTomorrow = false;
        let labelHari = 'Hari Ini';
        // If it's afternoon/evening in GMT+7 (e.g., 20:00), prepare schedule for tomorrow.
        // If it's morning (e.g., 06:00), prepare schedule for today.
        if (gmt7Hour >= 12) {
            gmt7Time.setUTCDate(gmt7Time.getUTCDate() + 1);
            isTomorrow = true;
            labelHari = 'Besok';
        }
        const targetYear = gmt7Time.getUTCFullYear();
        const targetMonth = gmt7Time.getUTCMonth();
        const targetDate = gmt7Time.getUTCDate();
        let dayOfWeek = gmt7Time.getUTCDay();
        if (dayOfWeek === 0)
            dayOfWeek = 7; // 1-7 (Mon-Sun)
        const targetStartUTC = new Date(Date.UTC(targetYear, targetMonth, targetDate, -7, 0, 0, 0));
        const targetEndUTC = new Date(Date.UTC(targetYear, targetMonth, targetDate, 16, 59, 59, 999));
        const dateStr = `${String(targetDate).padStart(2, '0')}/${String(targetMonth + 1).padStart(2, '0')}/${targetYear}`;
        // Get all users with email
        const { data: users, error: usersError } = await connection_1.supabase
            .from('profiles')
            .select('id, email')
            .not('email', 'is', null);
        if (usersError || !users) {
            console.error('[Daily Cron] Failed to fetch users:', usersError);
            return;
        }
        for (const user of users) {
            if (!user.email)
                continue;
            const { data: rutinRes } = await connection_1.supabase
                .from('kegiatan_rutin')
                .select('*, kategori!inner(nama_kategori)')
                .eq('user_id', user.id)
                .eq('hari_mingguan', dayOfWeek);
            const { data: dinamisRes } = await connection_1.supabase
                .from('kegiatan_dinamis')
                .select('*, kategori!inner(nama_kategori)')
                .eq('user_id', user.id)
                .gte('waktu_mulai', targetStartUTC.toISOString())
                .lt('waktu_mulai', targetEndUTC.toISOString());
            const scheduleItems = [];
            (rutinRes || []).forEach(r => {
                scheduleItems.push({
                    judul: r.judul,
                    kategori: r.kategori?.nama_kategori || '-',
                    waktu: r.jam_mulai.substring(0, 5),
                    tipe: 'Rutin Mingguan'
                });
            });
            (dinamisRes || []).forEach(d => {
                const dateObj = new Date(d.waktu_mulai);
                const gmt7Dinamis = new Date(dateObj.getTime() + 7 * 3600 * 1000);
                const h = String(gmt7Dinamis.getUTCHours()).padStart(2, '0');
                const m = String(gmt7Dinamis.getUTCMinutes()).padStart(2, '0');
                scheduleItems.push({
                    judul: d.judul,
                    kategori: d.kategori?.nama_kategori || '-',
                    waktu: `${h}:${m}`,
                    tipe: 'Dinamis'
                });
            });
            scheduleItems.sort((a, b) => a.waktu.localeCompare(b.waktu));
            const subject = `📅 Rekap Jadwal ${labelHari}: ${dateStr}`;
            let itemsHtml = '';
            if (scheduleItems.length === 0) {
                itemsHtml = '<p style="color: #a5b4fc;">Tidak ada jadwal. Waktunya bersantai!</p>';
            }
            else {
                itemsHtml = scheduleItems.map(item => `
          <div style="background: #16213e; padding: 12px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #818cf8;">
            <p style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; color: #fff;">${item.judul}</p>
            <p style="margin: 2px 0; color: #a5b4fc; font-size: 14px;">📂 Kategori: ${item.kategori}</p>
            <p style="margin: 2px 0; color: #a5b4fc; font-size: 14px;">🕗 Pukul: ${item.waktu}</p>
            <p style="margin: 2px 0; color: #a5b4fc; font-size: 14px;">📅 Tipe: ${item.tipe}</p>
          </div>
        `).join('');
            }
            const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
          <h2 style="color: #818cf8; margin-top: 0;">📅 Rekap Jadwal ${labelHari}</h2>
          <p style="color: #e0e0e0; margin-bottom: 24px;">Halo Pengguna, ini adalah jadwal Anda untuk tanggal <strong>${dateStr}</strong>:</p>
          ${itemsHtml}
          <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">Dikirim otomatis oleh SyncTime</p>
        </div>
      `;
            await (0, emailNotifier_1.sendEmailNotification)(user.email, subject, html);
        }
    }
    catch (error) {
        console.error('[Daily Cron] Error in daily schedule job:', error);
    }
};
exports.checkAndSendDailySchedule = checkAndSendDailySchedule;
const startCronJobs = () => {
    // Check every minute for upcoming schedules
    node_cron_1.default.schedule('* * * * *', async () => {
        await (0, exports.checkAndSendReminders)();
    });
    console.log('Email notification cron jobs scheduled (every minute, 20min ahead).');
};
exports.startCronJobs = startCronJobs;
