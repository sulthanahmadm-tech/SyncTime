import { Telegraf } from 'telegraf';
import { supabase } from '../db/connection';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

export const bot = token && token !== 'YOUR_BOT_TOKEN_HERE' ? new Telegraf(token) : null;

export const sendNotification = async (message: string) => {
  if (!bot || !chatId || chatId === 'YOUR_CHAT_ID_HERE') {
    console.log('[Telegram Mock] Notification:', message);
    return;
  }
  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[Telegram Error] Failed to send notification:', error);
  }
};

if (bot) {
  bot.command('start', (ctx) => {
    ctx.reply('Halo! Saya bot SyncTime. Saya akan mengingatkan jadwalmu 15 menit sebelum dimulai.\n\nGunakan /today untuk melihat jadwal hari ini.');
  });

  bot.command('today', async (ctx) => {
    try {
      const today = new Date();
      let dayOfWeek = today.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      const todayDateStr = today.toISOString().split('T')[0];
      const startOfDay = new Date(`${todayDateStr}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(`${todayDateStr}T23:59:59.999Z`).toISOString();

      // Get all rutin for today (all users - global bot)
      const { data: rutinRes } = await supabase
        .from('kegiatan_rutin')
        .select('*, kategori!inner(nama_kategori)')
        .eq('hari_mingguan', dayOfWeek);

      const { data: dinamisRes } = await supabase
        .from('kegiatan_dinamis')
        .select('*, kategori!inner(nama_kategori)')
        .gte('waktu_mulai', startOfDay)
        .lte('waktu_mulai', endOfDay);

      const schedules: { judul: string; start: Date; end: Date; type: string; kategori: string }[] = [];

      for (const r of (rutinRes || [])) {
        const startDate = new Date(`${todayDateStr}T${r.jam_mulai}`);
        const endDate = new Date(`${todayDateStr}T${r.jam_selesai}`);
        schedules.push({
          judul: r.judul,
          start: startDate,
          end: endDate,
          type: 'Rutin',
          kategori: r.kategori.nama_kategori
        });
      }

      for (const d of (dinamisRes || [])) {
        schedules.push({
          judul: d.judul,
          start: new Date(d.waktu_mulai),
          end: new Date(d.waktu_selesai),
          type: 'Dinamis',
          kategori: d.kategori.nama_kategori
        });
      }

      if (schedules.length === 0) {
        return ctx.reply('Tidak ada jadwal untuk hari ini! Waktunya bersantai. 🎉');
      }

      schedules.sort((a, b) => a.start.getTime() - b.start.getTime());

      let message = `📅 *Jadwal Hari Ini (${todayDateStr})*\n\n`;
      for (const s of schedules) {
        const startTime = s.start.toTimeString().substring(0, 5);
        const endTime = s.end.toTimeString().substring(0, 5);
        message += `⏰ ${startTime} - ${endTime}\n`;
        message += `📝 *${s.judul}* [${s.kategori}]\n`;
        message += `_Tipe: ${s.type}_\n\n`;
      }

      ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error(error);
      ctx.reply('Maaf, terjadi kesalahan saat mengambil data jadwal.');
    }
  });

  bot.launch().then(() => console.log('Telegram Bot is running!')).catch(err => console.error('Telegram Bot failed to launch:', err.message));

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.log('Telegram Bot not started: TELEGRAM_BOT_TOKEN is missing or not set.');
}
