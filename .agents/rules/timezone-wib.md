# Aturan Penanganan Zona Waktu (WIB / GMT+7) & Konsistensi Jadwal SyncTime

Setiap kali menulis, mengubah, atau me-review kode yang berkaitan dengan waktu, tanggal, kalender, deteksi bentrok (`conflictChecker`), atau cron job (`cronJobs`) di project **SyncTime**, agen WAJIB mematuhi aturan berikut tanpa pengecualian:

## 1. Larangan Method Waktu Lokal OS di Backend
Server production (Vercel / Cloud) berjalan dalam zona waktu **UTC (`GMT+0`)**, sedangkan jadwal pengguna (`kegiatan_rutin.jam_mulai`, `jam_selesai`, `hari_mingguan`) merepresentasikan waktu **WIB (`GMT+7` / `Asia/Jakarta`)**.
- **DILARANG KERAS** menggunakan `.getDay()`, `.getHours()`, `.getMinutes()`, `.getDate()`, `.toTimeString()`, atau `.toLocaleTimeString()` tanpa parameter `timeZone: 'Asia/Jakarta'` di sisi server untuk membandingkan atau memformat jadwal.
- **DILARANG KERAS** membuat objek `Date` dari string tanggal dan jam lokal tanpa offset eksplisit (contoh salah: `new Date(\`\${dateStr}T\${jam_mulai}\`)`). Gunakan selalu offset eksplisit `+07:00`:
  ```ts
  const startDate = new Date(`${dateStr}T${normStart}+07:00`);
  ```

## 2. Pola Standar Konversi Epoch ke WIB (GMT+7)
Untuk mengekstrak hari (`1-7`), tanggal (`YYYY-MM-DD`), atau jam (`HH:MM:SS`) dalam WIB secara deterministik di lingkungan OS apa pun (baik lokal Windows GMT+7 maupun server Linux UTC), geser timestamp sebesar `+7 jam` (`WIB_OFFSET_MS`) lalu gunakan **UTC getters**:
```ts
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const wibDate = new Date(timestamp.getTime() + WIB_OFFSET_MS);

// Hari mingguan (1 = Senin ... 7 = Minggu)
let dayOfWeek = wibDate.getUTCDay();
if (dayOfWeek === 0) dayOfWeek = 7;

// Tanggal YYYY-MM-DD dalam WIB
const dateStr = wibDate.toISOString().split('T')[0];

// Jam HH:MM:SS dalam WIB
const timeStr = wibDate.toISOString().split('T')[1].substring(0, 8);
```

## 3. Kewajiban Filter `rutin_exceptions`
Setiap fitur yang mengambil daftar `kegiatan_rutin` untuk tanggal spesifik (seperti tampilan kalender mingguan, pengiriman pengingat H-20 menit, rekap jadwal harian, atau pencarian waktu luang) **WAJIB** memeriksa tabel `rutin_exceptions` pada tanggal WIB terkait (`tanggal_dilewati = dateStr`) agar jadwal rutin yang sedang dipindahkan sementara tidak muncul atau ternotifikasi dua kali.
