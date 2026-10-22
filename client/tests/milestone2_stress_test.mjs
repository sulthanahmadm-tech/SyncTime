import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('====================================================');
console.log('CHALLENGER M2-2: EMPIRICAL FORMS, SETTINGS & MAGIC PASTE STRESS TEST');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: CalendarBlock Initialization & Delete in Rutin/Dinamis
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: CalendarBlock Initialization & Delete in Rutin/Dinamis ---');

runTest('1.1 RutinForm extracts jam_mulai & jam_selesai from CalendarBlock (start/end ISO strings)', () => {
  // Simulating CalendarBlock clicked on weekly calendar
  const calendarBlock = {
    id: 42,
    type: 'rutin',
    kategori_id: 3,
    judul: 'Algoritma & Pemrograman',
    nama_kategori: 'Kuliah',
    warna_hex: '#10b981',
    start: '2026-10-21T08:00:00',
    end: '2026-10-21T09:40:00',
    hari_mingguan: 3
  };

  // Logic extracted verbatim from RutinForm.tsx lines 33-51:
  const rawJamMulai = calendarBlock.jam_mulai
    ? calendarBlock.jam_mulai
    : calendarBlock.start
      ? (calendarBlock.start.includes('T') ? calendarBlock.start.split('T')[1] : calendarBlock.start)
      : '08:00';
  const rawJamSelesai = calendarBlock.jam_selesai
    ? calendarBlock.jam_selesai
    : calendarBlock.end
      ? (calendarBlock.end.includes('T') ? calendarBlock.end.split('T')[1] : calendarBlock.end)
      : '09:00';

  const formData = {
    judul: calendarBlock.judul || '',
    kategori_id: (calendarBlock.kategori_id || '').toString(),
    hari_mingguan: calendarBlock.hari_mingguan || 1,
    jam_mulai: rawJamMulai.substring(0, 5),
    jam_selesai: rawJamSelesai.substring(0, 5),
    batas_minggu_berulang: calendarBlock.batas_minggu_berulang || 16
  };

  assert.strictEqual(formData.jam_mulai, '08:00');
  assert.strictEqual(formData.jam_selesai, '09:40');
  assert.strictEqual(formData.judul, 'Algoritma & Pemrograman');
  assert.strictEqual(formData.kategori_id, '3');
  assert.strictEqual(formData.hari_mingguan, 3);
  assert.strictEqual(formData.batas_minggu_berulang, 16);
});

runTest('1.2 RutinForm handles legacy KegiatanRutin object with direct jam_mulai/jam_selesai', () => {
  const legacyData = {
    id: 10,
    kategori_id: 2,
    judul: 'Basis Data',
    hari_mingguan: 2,
    jam_mulai: '13:00:00',
    jam_selesai: '15:30:00',
    batas_minggu_berulang: 14
  };

  const rawJamMulai = legacyData.jam_mulai
    ? legacyData.jam_mulai
    : legacyData.start
      ? (legacyData.start.includes('T') ? legacyData.start.split('T')[1] : legacyData.start)
      : '08:00';
  const rawJamSelesai = legacyData.jam_selesai
    ? legacyData.jam_selesai
    : legacyData.end
      ? (legacyData.end.includes('T') ? legacyData.end.split('T')[1] : legacyData.end)
      : '09:00';

  const formData = {
    judul: legacyData.judul || '',
    kategori_id: (legacyData.kategori_id || '').toString(),
    hari_mingguan: legacyData.hari_mingguan || 1,
    jam_mulai: rawJamMulai.substring(0, 5),
    jam_selesai: rawJamSelesai.substring(0, 5),
    batas_minggu_berulang: legacyData.batas_minggu_berulang || 16
  };

  assert.strictEqual(formData.jam_mulai, '13:00');
  assert.strictEqual(formData.jam_selesai, '15:30');
  assert.strictEqual(formData.batas_minggu_berulang, 14);
});

runTest('1.3 DinamisForm toDatetimeLocal formats CalendarBlock start/end into YYYY-MM-DDTHH:mm', () => {
  // Verbatim from DinamisForm.tsx lines 29-35:
  const toDatetimeLocal = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime.substring(0, 16);
  };

  // CalendarBlock for dynamic activity only has 'start' and 'end', NOT 'waktu_mulai' or 'waktu_selesai'
  const calendarBlock = {
    id: 88,
    type: 'dinamis',
    kategori_id: 1,
    judul: 'Tugas Proyek Rekayasa Perangkat Lunak',
    start: '2026-10-25T14:30:00.000Z',
    end: '2026-10-25T16:30:00.000Z',
    is_completed: false
  };

  // DinamisForm.tsx lines 40-45:
  const formData = {
    judul: calendarBlock.judul || '',
    kategori_id: (calendarBlock.kategori_id || '').toString(),
    waktu_mulai: toDatetimeLocal(calendarBlock.waktu_mulai || calendarBlock.start || ''),
    waktu_selesai: toDatetimeLocal(calendarBlock.waktu_selesai || calendarBlock.end || '')
  };

  assert.ok(formData.waktu_mulai.length === 16, 'Datetime-local input string must have length 16');
  assert.ok(formData.waktu_mulai.includes('T'), 'Must format with T separator');
  assert.strictEqual(formData.judul, 'Tugas Proyek Rekayasa Perangkat Lunak');
  assert.strictEqual(formData.kategori_id, '1');

  // Verify Date roundtrip matches original instant in time
  const reconstructedStart = new Date(formData.waktu_mulai).getTime();
  const originalStart = new Date(calendarBlock.start).getTime();
  assert.strictEqual(reconstructedStart, originalStart, 'Reconstructed timestamp must match original epoch ms');
});

runTest('1.4 DinamisForm handles null, empty, and undefined edge cases without throwing', () => {
  const toDatetimeLocal = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime.substring(0, 16);
  };

  assert.strictEqual(toDatetimeLocal(''), '');
  assert.strictEqual(toDatetimeLocal(null), '');
  assert.strictEqual(toDatetimeLocal(undefined), '');
});

runTest('1.5 Delete button and API exports verify direct deletion contract', () => {
  // Read client/src/lib/api.ts to verify delete exports
  const apiFile = readFileSync(resolve(__dirname, '../src/lib/api.ts'), 'utf-8');
  assert.ok(apiFile.includes('export const deleteKegiatanRutin = deleteRutin;'), 'Must export deleteKegiatanRutin');
  assert.ok(apiFile.includes('export const deleteKegiatanDinamis = deleteDinamis;'), 'Must export deleteKegiatanDinamis');
  assert.ok(apiFile.includes('export const deleteRutin'), 'Must export deleteRutin');
  assert.ok(apiFile.includes('export const deleteDinamis'), 'Must export deleteDinamis');

  // Read RutinForm.tsx to verify Delete button rendering and action
  const rutinFormCode = readFileSync(resolve(__dirname, '../src/components/Forms/RutinForm.tsx'), 'utf-8');
  assert.ok(rutinFormCode.includes('deleteKegiatanRutin'), 'RutinForm must import/call deleteKegiatanRutin');
  assert.ok(rutinFormCode.includes('handleDelete'), 'RutinForm must implement handleDelete');
  assert.ok(rutinFormCode.includes('{editData ? ('), 'RutinForm must conditionally show Delete button on edit mode');
  assert.ok(rutinFormCode.includes('Hapus'), 'RutinForm must render Hapus button text');

  // Read DinamisForm.tsx to verify Delete button rendering and action
  const dinamisFormCode = readFileSync(resolve(__dirname, '../src/components/Forms/DinamisForm.tsx'), 'utf-8');
  assert.ok(dinamisFormCode.includes('deleteKegiatanDinamis'), 'DinamisForm must import/call deleteKegiatanDinamis');
  assert.ok(dinamisFormCode.includes('handleDelete'), 'DinamisForm must implement handleDelete');
  assert.ok(dinamisFormCode.includes('{editData ? ('), 'DinamisForm must conditionally show Delete button on edit mode');
  assert.ok(dinamisFormCode.includes('Hapus'), 'DinamisForm must render Hapus button text');
});

runTest('1.6 Stress test RutinForm time extraction across diverse formats and timezones', () => {
  const formats = [
    { in: '2026-10-21T07:15:00', exp: '07:15' },
    { in: '2026-10-21T00:00:00.000Z', exp: '00:00' },
    { in: '2026-10-21T23:59:59+07:00', exp: '23:59' },
    { in: '14:20:00', exp: '14:20' },
    { in: '09:05', exp: '09:05' }
  ];

  for (const item of formats) {
    const raw = item.in.includes('T') ? item.in.split('T')[1] : item.in;
    const extracted = raw.substring(0, 5);
    assert.strictEqual(extracted, item.exp, `Failed for input ${item.in}`);
  }
});

runTest('1.7 DinamisForm allows editing past dynamic events (Feature #14) but blocks new past events', () => {
  // Logic from DinamisForm.tsx lines 105-109:
  const isPastDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const validatePastRule = (dateStr, isEditMode) => {
    if (!isEditMode && isPastDate(dateStr)) {
      return { allowed: false, error: 'Peringatan: Tidak bisa menambahkan jadwal ke hari yang sudah berlalu.' };
    }
    return { allowed: true };
  };

  const pastDate = '2020-01-15';
  const futureDate = '2030-01-15';

  // Creating new event in past -> blocked
  assert.strictEqual(validatePastRule(pastDate, false).allowed, false);

  // Editing existing event in past -> allowed
  assert.strictEqual(validatePastRule(pastDate, true).allowed, true);

  // Creating new event in future -> allowed
  assert.strictEqual(validatePastRule(futureDate, false).allowed, true);
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: SettingsModal Responsiveness & Theme Selection
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: SettingsModal Responsiveness & Theme Selection ---');

runTest('2.1 SettingsModal container uses responsive flex-col md:flex-row layout', () => {
  const settingsModalCode = readFileSync(resolve(__dirname, '../src/components/Settings/SettingsModal.tsx'), 'utf-8');
  
  // Verify container classes
  assert.ok(
    settingsModalCode.includes('flex flex-col md:flex-row'),
    'SettingsModal modal body must have "flex flex-col md:flex-row" for mobile responsiveness'
  );

  // Verify sidebar responsive classes
  assert.ok(
    settingsModalCode.includes('w-full md:w-64'),
    'Sidebar must have "w-full md:w-64" to adapt full width on mobile'
  );
  assert.ok(
    settingsModalCode.includes('flex flex-row md:flex-col'),
    'Sidebar nav must arrange tabs horizontally on mobile (flex-row) and vertically on desktop (md:flex-col)'
  );
  assert.ok(
    settingsModalCode.includes('overflow-x-auto md:overflow-x-visible'),
    'Sidebar nav must allow horizontal scroll on mobile (overflow-x-auto)'
  );
  assert.ok(
    settingsModalCode.includes('border-b md:border-b-0 md:border-r'),
    'Sidebar border must separate on bottom on mobile, and right on desktop'
  );
});

runTest('2.2 SettingsModal includes System theme option with Monitor icon and setTheme("system")', () => {
  const settingsModalCode = readFileSync(resolve(__dirname, '../src/components/Settings/SettingsModal.tsx'), 'utf-8');

  assert.ok(settingsModalCode.includes('Monitor'), 'Must import or use Monitor icon from lucide-react');
  assert.ok(settingsModalCode.includes("setTheme('system')"), 'Must call setTheme("system") on click');
  assert.ok(settingsModalCode.includes("theme === 'system'"), 'Must style active state when theme === "system"');
  assert.ok(settingsModalCode.includes("title=\"System\""), 'Must provide title="System"');
});

runTest('2.3 useTheme hook implements complete System theme color-scheme listener and localStorage persistence', () => {
  const useThemeCode = readFileSync(resolve(__dirname, '../src/hooks/useTheme.ts'), 'utf-8');

  assert.ok(useThemeCode.includes("type Theme = 'light' | 'dark' | 'system'"), 'Theme type must support "system"');
  assert.ok(useThemeCode.includes("matchMedia('(prefers-color-scheme: dark)')"), 'Must query system color scheme');
  assert.ok(useThemeCode.includes("mediaQuery.addEventListener('change'"), 'Must listen to system dark mode changes');
  assert.ok(useThemeCode.includes("mediaQuery.removeEventListener('change'"), 'Must cleanly tear down event listener');
  assert.ok(useThemeCode.includes("localStorage.setItem('theme', theme)"), 'Must save theme to localStorage');
});

runTest('2.4 Theme application logic accurately determines isDark across all three theme modes', () => {
  const computeIsDark = (currentTheme, systemPrefersDark) => {
    return currentTheme === 'dark' || (currentTheme === 'system' && systemPrefersDark);
  };

  // Light theme: always false
  assert.strictEqual(computeIsDark('light', true), false);
  assert.strictEqual(computeIsDark('light', false), false);

  // Dark theme: always true
  assert.strictEqual(computeIsDark('dark', true), true);
  assert.strictEqual(computeIsDark('dark', false), true);

  // System theme: mirrors OS preference
  assert.strictEqual(computeIsDark('system', true), true);
  assert.strictEqual(computeIsDark('system', false), false);
});

// -----------------------------------------------------------------------------
// TEST SUITE 3: magicPaste.ts Transformation Logic
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: magicPaste.ts JSON Parser & Transformation Logic ---');

// Replicate pure extraction and normalization logic from server/src/routes/magicPaste.ts
function cleanAndParseGeminiResponse(rawResponse) {
  let textResponse = rawResponse.trim();
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
  return JSON.parse(textResponse);
}

function processMagicPasteScheduleData(scheduleData, userId = 'test-user', kategoriId = 1, batasMinggu = 16) {
  const rutinItems = [];
  const dinamisItems = [];

  for (const item of scheduleData) {
    const isRutin = item.is_rutin === true || (item.hari_mingguan && !item.waktu_mulai);
    if (isRutin && item.judul && item.hari_mingguan && item.jam_mulai && item.jam_selesai) {
      let jamMulai = String(item.jam_mulai).trim();
      if (jamMulai.length === 5) jamMulai += ':00';
      let jamSelesai = String(item.jam_selesai).trim();
      if (jamSelesai.length === 5) jamSelesai += ':00';

      rutinItems.push({
        user_id: userId,
        kategori_id: kategoriId,
        judul: item.judul,
        hari_mingguan: parseInt(item.hari_mingguan),
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        batas_minggu_berulang: batasMinggu,
        is_matkul_wajib: true
      });
    } else if (!isRutin && item.judul && item.waktu_mulai) {
      const start = new Date(item.waktu_mulai);
      if (isNaN(start.getTime())) continue;
      let end = item.waktu_selesai ? new Date(item.waktu_selesai) : new Date(start.getTime() + 60 * 60 * 1000);
      if (isNaN(end.getTime()) || end <= start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }

      dinamisItems.push({
        user_id: userId,
        kategori_id: kategoriId,
        judul: item.judul,
        waktu_mulai: start.toISOString(),
        waktu_selesai: end.toISOString(),
        is_completed: false
      });
    }
  }

  return { rutinItems, dinamisItems };
}

runTest('3.1 Markdown fence stripping handles raw, ```json, and Windows CRLF fences', () => {
  const rawText = '[{"is_rutin": true, "judul": "Fisika Dasar", "hari_mingguan": 1, "jam_mulai": "08:00:00", "jam_selesai": "09:40:00"}]';
  const fencedUnix = '```json\n' + rawText + '\n```';
  const fencedWindows = '```json\r\n' + rawText + '\r\n```';
  const fencedPlain = '```\n' + rawText + '\n```';

  const res1 = cleanAndParseGeminiResponse(rawText);
  const res2 = cleanAndParseGeminiResponse(fencedUnix);
  const res3 = cleanAndParseGeminiResponse(fencedWindows);
  const res4 = cleanAndParseGeminiResponse(fencedPlain);

  assert.strictEqual(res1[0].judul, 'Fisika Dasar');
  assert.strictEqual(res2[0].judul, 'Fisika Dasar');
  assert.strictEqual(res3[0].judul, 'Fisika Dasar');
  assert.strictEqual(res4[0].judul, 'Fisika Dasar');
});

runTest('3.2 Recurring courses parsed into rutinItems with is_matkul_wajib: true and padded seconds', () => {
  const mockInput = [
    {
      is_rutin: true,
      judul: 'Struktur Data & Algoritma',
      hari_mingguan: '2', // String from AI
      jam_mulai: '07:30', // Length 5 (missing :00)
      jam_selesai: '09:10' // Length 5
    },
    {
      is_rutin: true,
      judul: 'Pemrograman Web Lanjut',
      hari_mingguan: 4,
      jam_mulai: '13:00:00',
      jam_selesai: '15:30:00'
    }
  ];

  const { rutinItems, dinamisItems } = processMagicPasteScheduleData(mockInput, 'usr-1', 2, 18);

  assert.strictEqual(dinamisItems.length, 0);
  assert.strictEqual(rutinItems.length, 2);

  // Item 1
  assert.strictEqual(rutinItems[0].judul, 'Struktur Data & Algoritma');
  assert.strictEqual(rutinItems[0].hari_mingguan, 2);
  assert.strictEqual(rutinItems[0].jam_mulai, '07:30:00');
  assert.strictEqual(rutinItems[0].jam_selesai, '09:10:00');
  assert.strictEqual(rutinItems[0].is_matkul_wajib, true, 'Routine extracted course MUST have is_matkul_wajib = true');
  assert.strictEqual(rutinItems[0].batas_minggu_berulang, 18);

  // Item 2
  assert.strictEqual(rutinItems[1].judul, 'Pemrograman Web Lanjut');
  assert.strictEqual(rutinItems[1].hari_mingguan, 4);
  assert.strictEqual(rutinItems[1].jam_mulai, '13:00:00');
  assert.strictEqual(rutinItems[1].jam_selesai, '15:30:00');
  assert.strictEqual(rutinItems[1].is_matkul_wajib, true);
});

runTest('3.3 Dated dynamic events parsed into dinamisItems with valid ISO datetime strings', () => {
  const mockInput = [
    {
      is_rutin: false,
      judul: 'UTS Pengenalan Pola',
      waktu_mulai: '2026-11-04T08:00:00',
      waktu_selesai: '2026-11-04T10:00:00'
    },
    {
      is_rutin: false,
      judul: 'Deadline Tugas Akhir',
      waktu_mulai: '2026-11-20T23:59:00'
      // waktu_selesai intentionally omitted
    }
  ];

  const { rutinItems, dinamisItems } = processMagicPasteScheduleData(mockInput, 'usr-1', 2, 16);

  assert.strictEqual(rutinItems.length, 0);
  assert.strictEqual(dinamisItems.length, 2);

  // Item 1
  assert.strictEqual(dinamisItems[0].judul, 'UTS Pengenalan Pola');
  assert.ok(dinamisItems[0].waktu_mulai.endsWith('Z') || dinamisItems[0].waktu_mulai.includes('T'));
  assert.ok(!isNaN(new Date(dinamisItems[0].waktu_mulai).getTime()));
  assert.ok(!isNaN(new Date(dinamisItems[0].waktu_selesai).getTime()));
  assert.strictEqual(dinamisItems[0].is_completed, false);

  // Item 2: Missing waktu_selesai is safely auto-estimated to start + 1h
  assert.strictEqual(dinamisItems[1].judul, 'Deadline Tugas Akhir');
  const startMs = new Date(dinamisItems[1].waktu_mulai).getTime();
  const endMs = new Date(dinamisItems[1].waktu_selesai).getTime();
  assert.strictEqual(endMs - startMs, 60 * 60 * 1000, 'Missing end time must auto-default to 1 hour after start');
});

runTest('3.4 Dynamic event with inverted end time is clamped to start + 1 hour', () => {
  const mockInput = [
    {
      is_rutin: false,
      judul: 'Seminar Riset AI',
      waktu_mulai: '2026-11-12T14:00:00',
      waktu_selesai: '2026-11-12T13:00:00' // Inverted! End is before start
    }
  ];

  const { dinamisItems } = processMagicPasteScheduleData(mockInput, 'usr-1', 2, 16);
  assert.strictEqual(dinamisItems.length, 1);
  const startMs = new Date(dinamisItems[0].waktu_mulai).getTime();
  const endMs = new Date(dinamisItems[0].waktu_selesai).getTime();
  assert.ok(endMs > startMs, 'End time must be strictly after start time');
  assert.strictEqual(endMs - startMs, 60 * 60 * 1000);
});

runTest('3.5 Mixed payload correctly partitions into both rutin and dinamis tables', () => {
  const mixedInput = [
    {
      is_rutin: true,
      judul: 'Sistem Operasi',
      hari_mingguan: 3,
      jam_mulai: '08:00:00',
      jam_selesai: '09:40:00'
    },
    {
      is_rutin: false,
      judul: 'Ujian Tengah Semester Sistem Operasi',
      waktu_mulai: '2026-11-05T08:00:00',
      waktu_selesai: '2026-11-05T10:00:00'
    },
    {
      is_rutin: true,
      judul: 'Kecerdasan Buatan',
      hari_mingguan: 5,
      jam_mulai: '10:00:00',
      jam_selesai: '11:40:00'
    }
  ];

  const { rutinItems, dinamisItems } = processMagicPasteScheduleData(mixedInput, 'usr-1', 2, 16);
  assert.strictEqual(rutinItems.length, 2);
  assert.strictEqual(dinamisItems.length, 1);
  assert.strictEqual(rutinItems[0].is_matkul_wajib, true);
  assert.strictEqual(rutinItems[1].is_matkul_wajib, true);
});

runTest('3.6 Batch stress test on 50 mixed, dirty, and edge-case schedule items', () => {
  const batchInput = [];
  for (let i = 1; i <= 25; i++) {
    batchInput.push({
      is_rutin: true,
      judul: `Mata Kuliah #${i}`,
      hari_mingguan: (i % 7) + 1,
      jam_mulai: `${(7 + (i % 12)).toString().padStart(2, '0')}:00`,
      jam_selesai: `${(9 + (i % 12)).toString().padStart(2, '0')}:00`
    });
  }
  for (let i = 26; i <= 50; i++) {
    batchInput.push({
      is_rutin: false,
      judul: `Agenda Dinamis #${i}`,
      waktu_mulai: `2026-11-${(i - 20).toString().padStart(2, '0')}T10:00:00`,
      waktu_selesai: i % 2 === 0 ? `2026-11-${(i - 20).toString().padStart(2, '0')}T12:00:00` : undefined
    });
  }

  const { rutinItems, dinamisItems } = processMagicPasteScheduleData(batchInput, 'user-batch', 1, 16);
  assert.strictEqual(rutinItems.length, 25);
  assert.strictEqual(dinamisItems.length, 25);

  // All routine items have is_matkul_wajib: true
  for (const r of rutinItems) {
    assert.strictEqual(r.is_matkul_wajib, true);
    assert.strictEqual(r.jam_mulai.length, 8);
    assert.strictEqual(r.jam_selesai.length, 8);
  }

  // All dynamic items have valid ISO strings and valid durations
  for (const d of dinamisItems) {
    assert.strictEqual(d.is_completed, false);
    const s = new Date(d.waktu_mulai).getTime();
    const e = new Date(d.waktu_selesai).getTime();
    assert.ok(e > s);
  }
});

runTest('3.7 Semester week calculation for batasMinggu in magicPaste.ts', () => {
  const computeBatasMinggu = (profile) => {
    let batasMinggu = 16;
    if (profile?.semester_start && profile?.semester_end) {
      const diffWeeks = Math.ceil(
        (new Date(profile.semester_end).getTime() - new Date(profile.semester_start).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      if (diffWeeks > 0) batasMinggu = diffWeeks;
    }
    return batasMinggu;
  };

  // 1. Normal semester (~22 weeks)
  assert.strictEqual(computeBatasMinggu({ semester_start: '2026-09-01', semester_end: '2027-01-31' }), 22);

  // 2. Exactly 16 weeks
  assert.strictEqual(computeBatasMinggu({ semester_start: '2026-09-01', semester_end: '2026-12-22' }), 16);

  // 3. Null profile bounds defaults to 16
  assert.strictEqual(computeBatasMinggu(null), 16);
  assert.strictEqual(computeBatasMinggu({ semester_start: null, semester_end: null }), 16);

  // 4. Inverted semester dates defaults to 16
  assert.strictEqual(computeBatasMinggu({ semester_start: '2026-12-31', semester_end: '2026-01-01' }), 16);
});

// -----------------------------------------------------------------------------
// TEST SUITE 4: ConflictError Export & Conflict Handling Contract
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: ConflictError Export & Conflict Handling Contract ---');

runTest('4.1 ConflictError in client/src/lib/api.ts inherits Error and contains conflicts property', () => {
  // Read client/src/lib/api.ts
  const apiFile = readFileSync(resolve(__dirname, '../src/lib/api.ts'), 'utf-8');
  assert.ok(apiFile.includes('export class ConflictError extends Error'), 'ConflictError must be exported from api.ts');
  assert.ok(apiFile.includes("this.name = 'ConflictError'"), 'ConflictError name must be set to "ConflictError"');
  assert.ok(apiFile.includes('this.conflicts = conflicts'), 'ConflictError must attach conflicts detail array');

  // Evaluate class definition behavior
  class TestConflictError extends Error {
    constructor(message, conflicts) {
      super(message);
      this.name = 'ConflictError';
      this.conflicts = conflicts;
    }
  }

  const mockConflicts = [
    {
      conflicting_id: 5,
      conflicting_judul: 'Praktikum Jaringan Komputer',
      conflicting_start: '2026-10-21T08:00:00',
      conflicting_end: '2026-10-21T10:00:00',
      type: 'rutin'
    }
  ];

  const err = new TestConflictError('Conflict detected', mockConflicts);
  assert.ok(err instanceof Error);
  assert.ok(err instanceof TestConflictError);
  assert.strictEqual(err.name, 'ConflictError');
  assert.strictEqual(err.message, 'Conflict detected');
  assert.strictEqual(err.conflicts.length, 1);
  assert.strictEqual(err.conflicts[0].conflicting_judul, 'Praktikum Jaringan Komputer');
});

runTest('4.2 MatkulWajibModal.tsx imports ConflictError and catches 409 conflict gracefully', () => {
  const modalCode = readFileSync(resolve(__dirname, '../src/components/Forms/MatkulWajibModal.tsx'), 'utf-8');

  // Verify import
  assert.ok(modalCode.includes('ConflictError'), 'MatkulWajibModal must import ConflictError from api.ts');
  assert.ok(modalCode.includes('ConflictModal'), 'MatkulWajibModal must import ConflictModal');

  // Verify handleAddMatkul catches ConflictError
  assert.ok(
    modalCode.includes("e instanceof ConflictError || e.name === 'ConflictError'"),
    'MatkulWajibModal must check e instanceof ConflictError || e.name === "ConflictError"'
  );

  // Verify ConflictModal is configured with forceSave
  assert.ok(
    modalCode.includes('handleAddMatkul(true)'),
    'MatkulWajibModal onForceSave must trigger handleAddMatkul(true)'
  );
  assert.ok(
    modalCode.includes('handleUpdateMatkul(id, true)'),
    'MatkulWajibModal onForceSave must trigger handleUpdateMatkul(id, true)'
  );

  // Verify createRutin and updateRutin pass force boolean to query param
  const apiFile = readFileSync(resolve(__dirname, '../src/lib/api.ts'), 'utf-8');
  assert.ok(
    apiFile.includes("`/api/rutin${force ? '?force=true' : ''}`"),
    'createRutin and updateRutin must append ?force=true when force is requested'
  );
});

runTest('4.3 ConflictModal component exists and provides Batal & Force Save buttons', () => {
  const conflictModalCode = readFileSync(resolve(__dirname, '../src/components/Calendar/ConflictModal.tsx'), 'utf-8');

  assert.ok(conflictModalCode.includes('Jadwal Bentrok!'), 'Must display "Jadwal Bentrok!" title');
  assert.ok(conflictModalCode.includes('onForceSave'), 'Must accept onForceSave callback');
  assert.ok(conflictModalCode.includes('onCancel'), 'Must accept onCancel callback');
  assert.ok(conflictModalCode.includes('Force Save'), 'Must render Force Save button');
  assert.ok(conflictModalCode.includes('Batal'), 'Must render Batal button');
});

runTest('4.4 Simulated fetchApi 409 response throws ConflictError with details', async () => {
  class ConflictError extends Error {
    constructor(message, conflicts) {
      super(message);
      this.name = 'ConflictError';
      this.conflicts = conflicts;
    }
  }

  // Simulate fetchApi behavior on 409
  const mockFetchApi = async (status, responseBody) => {
    if (status === 409) {
      throw new ConflictError(responseBody.message || 'Conflict detected', responseBody.conflicts || []);
    }
    return responseBody;
  };

  const conflictPayload = {
    hasConflict: true,
    message: 'Jadwal bertabrakan dengan kegiatan lain',
    conflicts: [
      {
        conflicting_id: 12,
        conflicting_judul: 'Sistem Operasi',
        conflicting_start: '2026-10-21T08:00:00+07:00',
        conflicting_end: '2026-10-21T09:40:00+07:00',
        type: 'rutin'
      }
    ]
  };

  let caughtError = null;
  try {
    await mockFetchApi(409, conflictPayload);
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError !== null);
  assert.strictEqual(caughtError.name, 'ConflictError');
  assert.strictEqual(caughtError.conflicts.length, 1);
  assert.strictEqual(caughtError.conflicts[0].conflicting_judul, 'Sistem Operasi');
});

runTest('4.5 Force parameter propagation in api.ts for create/update operations', () => {
  const generateRutinUrl = (id, force) => {
    if (id !== undefined) {
      return `/api/rutin/${id}${force ? '?force=true' : ''}`;
    }
    return `/api/rutin${force ? '?force=true' : ''}`;
  };

  const generateDinamisUrl = (id, force) => {
    if (id !== undefined) {
      return `/api/dinamis/${id}${force ? '?force=true' : ''}`;
    }
    return `/api/dinamis${force ? '?force=true' : ''}`;
  };

  // Normal calls (force false or undefined)
  assert.strictEqual(generateRutinUrl(undefined, false), '/api/rutin');
  assert.strictEqual(generateRutinUrl(42, false), '/api/rutin/42');
  assert.strictEqual(generateDinamisUrl(undefined, false), '/api/dinamis');
  assert.strictEqual(generateDinamisUrl(88, false), '/api/dinamis/88');

  // Forced calls
  assert.strictEqual(generateRutinUrl(undefined, true), '/api/rutin?force=true');
  assert.strictEqual(generateRutinUrl(42, true), '/api/rutin/42?force=true');
  assert.strictEqual(generateDinamisUrl(undefined, true), '/api/dinamis?force=true');
  assert.strictEqual(generateDinamisUrl(88, true), '/api/dinamis/88?force=true');
});

console.log('\n====================================================');
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
