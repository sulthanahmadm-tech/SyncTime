"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
function migrate() {
    try {
        connection_1.db.exec(`
      DROP TABLE IF EXISTS kegiatan_dinamis;
      DROP TABLE IF EXISTS kegiatan_rutin;
      DROP TABLE IF EXISTS kategori;

      CREATE TABLE kategori (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kategori TEXT NOT NULL,
        warna_hex TEXT NOT NULL,
        kode_led_iot TEXT
      );

      CREATE TABLE kegiatan_rutin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kategori_id INTEGER NOT NULL REFERENCES kategori(id) ON DELETE CASCADE,
        judul TEXT NOT NULL,
        hari_mingguan INTEGER NOT NULL CHECK (hari_mingguan BETWEEN 1 AND 7),
        jam_mulai TEXT NOT NULL,
        jam_selesai TEXT NOT NULL,
        batas_minggu_berulang INTEGER DEFAULT 16
      );

      CREATE TABLE kegiatan_dinamis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kategori_id INTEGER NOT NULL REFERENCES kategori(id) ON DELETE CASCADE,
        judul TEXT NOT NULL,
        waktu_mulai TEXT NOT NULL,
        waktu_selesai TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0
      );

      CREATE TABLE rutin_exceptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kegiatan_rutin_id INTEGER NOT NULL REFERENCES kegiatan_rutin(id) ON DELETE CASCADE,
        tanggal_dilewati TEXT NOT NULL
      );
    `);
        console.log('Migration successful');
    }
    catch (error) {
        console.error('Migration failed:', error);
    }
    finally {
        connection_1.db.close();
    }
}
migrate();
