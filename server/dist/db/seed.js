"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
function seed() {
    try {
        // Clear existing data
        connection_1.db.exec('DELETE FROM kegiatan_dinamis');
        connection_1.db.exec('DELETE FROM kegiatan_rutin');
        connection_1.db.exec('DELETE FROM kategori');
        // Insert kategori
        const insertKategori = connection_1.db.prepare('INSERT INTO kategori (nama_kategori, warna_hex, kode_led_iot) VALUES (?, ?, ?)');
        insertKategori.run('Kuliah', '#EF4444', 'RED');
        insertKategori.run('Acara Kampus', '#F59E0B', 'YELLOW');
        insertKategori.run('Tugas', '#3B82F6', 'BLUE');
        insertKategori.run('Downtime', '#22C55E', 'GREEN');
        // Insert kegiatan rutin
        const insertRutin = connection_1.db.prepare('INSERT INTO kegiatan_rutin (kategori_id, judul, hari_mingguan, jam_mulai, jam_selesai, batas_minggu_berulang) VALUES (?, ?, ?, ?, ?, ?)');
        insertRutin.run(1, 'Kuliah Informatika', 1, '08:00:00', '10:00:00', 16);
        insertRutin.run(1, 'Kuliah Algoritma', 2, '10:00:00', '12:00:00', 16);
        insertRutin.run(1, 'Kuliah Basis Data', 3, '08:00:00', '10:00:00', 16);
        insertRutin.run(1, 'Kuliah Jaringan Komputer', 4, '13:00:00', '15:00:00', 16);
        insertRutin.run(4, 'Latihan Gitar & Record', 3, '19:00:00', '21:00:00', 16);
        insertRutin.run(4, 'Main EAFC / Fortnite', 5, '20:00:00', '22:00:00', 16);
        insertRutin.run(4, 'Maintenance Kos', 6, '09:00:00', '11:00:00', 16);
        insertRutin.run(4, 'Mengurus Sienna', 7, '08:00:00', '10:00:00', 16);
        // Insert kegiatan dinamis
        const insertDinamis = connection_1.db.prepare('INSERT INTO kegiatan_dinamis (kategori_id, judul, waktu_mulai, waktu_selesai, is_completed) VALUES (?, ?, ?, ?, ?)');
        insertDinamis.run(2, 'Rapat Informatics Championship', '2026-09-25T13:00:00', '2026-09-25T15:00:00', 0);
        insertDinamis.run(2, 'Persiapan Dekorasi IC', '2026-09-27T09:00:00', '2026-09-27T12:00:00', 0);
        insertDinamis.run(3, 'Checkout Komponen Hardware', '2026-09-25T10:00:00', '2026-09-25T11:00:00', 0);
        insertDinamis.run(3, 'Deadline Laporan Basis Data', '2026-09-28T23:59:00', '2026-09-29T00:00:00', 0);
        insertDinamis.run(4, 'Nonton Film Bareng Teman', '2026-09-26T19:00:00', '2026-09-26T21:30:00', 0);
        console.log('Seed successful');
    }
    catch (error) {
        console.error('Seed failed:', error);
    }
    finally {
        connection_1.db.close();
    }
}
seed();
