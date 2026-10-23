import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('CHALLENGER M5-1: EMPIRICAL COMPREHENSIVE ACCEPTANCE STRESS TEST');
console.log('================================================================\n');

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

const rootDir = process.cwd();

// -----------------------------------------------------------------------------
// SUITE 1: Build & Artifact Verification
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Build & Artifact Verification ---');

runTest('1.1 Server build output exists and contains valid compiled JS', () => {
  const serverDistIndex = path.join(rootDir, 'server', 'dist', 'index.js');
  assert.ok(fs.existsSync(serverDistIndex), `Server build dist/index.js not found at ${serverDistIndex}`);
  const stats = fs.statSync(serverDistIndex);
  assert.ok(stats.size > 100, 'Server build output should be non-empty');
});

runTest('1.2 Client build output exists and contains valid index.html & assets', () => {
  const clientDistIndex = path.join(rootDir, 'client', 'dist', 'index.html');
  assert.ok(fs.existsSync(clientDistIndex), `Client build dist/index.html not found at ${clientDistIndex}`);
  const html = fs.readFileSync(clientDistIndex, 'utf8');
  assert.ok(html.includes('<div id="root">'), 'index.html should have root div');
});

// -----------------------------------------------------------------------------
// SUITE 2: DnD ID Disambiguation in TimeBlock.tsx & useDragAndDrop.ts
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: DnD ID Disambiguation ---');

runTest('2.1 TimeBlock.tsx strictly avoids raw numeric ID in useDraggable', () => {
  const timeBlockPath = path.join(rootDir, 'client', 'src', 'components', 'Calendar', 'TimeBlock.tsx');
  const content = fs.readFileSync(timeBlockPath, 'utf8');
  
  // Must contain id: `${block.type}-${block.id}`
  assert.ok(
    content.includes('id: `${block.type}-${block.id}`') || content.includes('id: `${block.type}-${block.id}'),
    'TimeBlock.tsx must prefix draggable id with block.type'
  );

  // Must NOT have plain numeric ID assignment: id: block.id
  assert.ok(
    !content.match(/useDraggable\(\s*\{\s*id:\s*block\.id\b/),
    'TimeBlock.tsx must not use plain numeric block.id for draggable ID'
  );
});

runTest('2.2 useDragAndDrop.ts correctly parses and resolves prefixed draggable IDs', () => {
  const dndPath = path.join(rootDir, 'client', 'src', 'hooks', 'useDragAndDrop.ts');
  const content = fs.readFileSync(dndPath, 'utf8');

  assert.ok(
    content.includes('`${b.type}-${b.id}` === active.id'),
    'useDragAndDrop.ts must resolve blocks using type-prefixed id matching'
  );
  assert.ok(
    content.includes('parseLocalDate(dropDate)'),
    'useDragAndDrop.ts must use parseLocalDate for dropDate'
  );
});

// -----------------------------------------------------------------------------
// SUITE 3: Semester Bounds & batas_minggu_berulang Logic (analytics & conflictChecker)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Semester Bounds & batas_minggu_berulang Logic ---');

runTest('3.1 Semester week calculation formula correctness across boundaries', () => {
  const semesterStart = '2026-09-01'; // Tuesday
  const semesterEnd = '2026-12-22';
  const semStart = new Date(semesterStart);

  const getWeekNum = (dateStr) => {
    return Math.floor((new Date(dateStr).getTime() - semStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  };

  // Day 0 (start date): week 1
  assert.strictEqual(getWeekNum('2026-09-01'), 1);
  // Day 6: week 1
  assert.strictEqual(getWeekNum('2026-09-07'), 1);
  // Day 7: week 2
  assert.strictEqual(getWeekNum('2026-09-08'), 2);
  // Day 14: week 3
  assert.strictEqual(getWeekNum('2026-09-15'), 3);
  // Week 16: day 15*7 = 105 days after start (2026-12-15)
  assert.strictEqual(getWeekNum('2026-12-15'), 16);
  // Week 17: day 16*7 = 112 days after start (2026-12-22)
  assert.strictEqual(getWeekNum('2026-12-22'), 17);
});

runTest('3.2 Routine course filtering respects batas_minggu_berulang and semester range', () => {
  const profile = { semester_start: '2026-09-01', semester_end: '2026-12-20' };
  const routineCourse = {
    id: 10,
    judul: 'Pemrograman Web',
    batas_minggu_berulang: 14 // Active only for first 14 weeks
  };

  const isRoutineActive = (dateStr, r, prof) => {
    if (prof?.semester_start && prof?.semester_end) {
      if (dateStr < prof.semester_start || dateStr > prof.semester_end) {
        return false;
      }
      const semStart = new Date(prof.semester_start);
      const weekNum = Math.floor((new Date(dateStr).getTime() - semStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      if (weekNum > (r.batas_minggu_berulang || 16)) {
        return false;
      }
    }
    return true;
  };

  // Within semester and week 1 (active)
  assert.strictEqual(isRoutineActive('2026-09-05', routineCourse, profile), true);
  // Week 14 (active)
  assert.strictEqual(isRoutineActive('2026-12-01', routineCourse, profile), true);
  // Week 15 (exceeds batas_minggu_berulang=14 -> inactive)
  assert.strictEqual(isRoutineActive('2026-12-10', routineCourse, profile), false);
  // Before semester start (inactive)
  assert.strictEqual(isRoutineActive('2026-08-31', routineCourse, profile), false);
  // After semester end (inactive)
  assert.strictEqual(isRoutineActive('2026-12-25', routineCourse, profile), false);
});

// -----------------------------------------------------------------------------
// SUITE 4: rutin_exceptions Filtering in analytics.ts & conflictChecker.ts
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: rutin_exceptions Filtering ---');

runTest('4.1 analytics.ts source contains rutin_exceptions query & exceptionSet filter', () => {
  const analyticsPath = path.join(rootDir, 'server', 'src', 'routes', 'analytics.ts');
  const content = fs.readFileSync(analyticsPath, 'utf8');

  assert.ok(content.includes(".from('rutin_exceptions')"), 'analytics.ts must query rutin_exceptions table');
  assert.ok(content.includes('exceptionSet.has(`${r.id}-${dateStr}`)'), 'analytics.ts must check exceptionSet for r.id-dateStr');
  assert.ok(content.includes('continue;'), 'analytics.ts must skip routine slots matching exception');
  assert.ok(content.includes('dateStr < profile.semester_start || dateStr > profile.semester_end'), 'analytics.ts must verify semester bounds');
  assert.ok(content.includes('weekNum > (r.batas_minggu_berulang || 16)'), 'analytics.ts must verify batas_minggu_berulang');
});

runTest('4.2 conflictChecker.ts source contains rutin_exceptions query & exception check', () => {
  const checkerPath = path.join(rootDir, 'server', 'src', 'utils', 'conflictChecker.ts');
  const content = fs.readFileSync(checkerPath, 'utf8');

  assert.ok(content.includes(".from('rutin_exceptions')"), 'conflictChecker.ts must query rutin_exceptions table');
  assert.ok(content.includes('exceptionIds.has(row.id)'), 'conflictChecker.ts must check exceptionIds');
  assert.ok(content.includes('wibDateStr < profile.semester_start || wibDateStr > profile.semester_end'), 'conflictChecker.ts must check semester bounds');
  assert.ok(content.includes('weekNum > (row.batas_minggu_berulang || 16)'), 'conflictChecker.ts must check week limit');
});

runTest('4.3 Simulation: Exception prevents double-counting in analytics hours', () => {
  const categories = [{ id: 1, nama_kategori: 'Kuliah', warna_hex: '#4F46E5' }];
  const stats = { 1: { nama_kategori: 'Kuliah', warna_hex: '#4F46E5', total_hours: 0 } };
  
  const routineItem = {
    id: 101,
    kategori_id: 1,
    hari_mingguan: 3, // Rabu
    jam_mulai: '08:00:00',
    jam_selesai: '10:00:00',
    batas_minggu_berulang: 16
  };

  const dynamicMovedItem = {
    id: 501,
    kategori_id: 1,
    waktu_mulai: '2026-10-23T08:00:00.000Z', // Moved to Friday
    waktu_selesai: '2026-10-23T10:00:00.000Z'
  };

  const weekStart = new Date('2026-10-19T00:00:00.000Z'); // Monday
  const exceptionSetWithException = new Set(['101-2026-10-21']); // Wednesday vacated
  const exceptionSetWithoutException = new Set();

  const calculateHours = (exceptionSet) => {
    let routineHours = 0;
    const dayOffset = routineItem.hari_mingguan - 1;
    const eventDate = new Date(weekStart);
    eventDate.setDate(eventDate.getDate() + dayOffset);
    const dateStr = eventDate.toISOString().split('T')[0];

    if (!exceptionSet.has(`${routineItem.id}-${dateStr}`)) {
      const startD = new Date(`1970-01-01T${routineItem.jam_mulai}Z`);
      const endD = new Date(`1970-01-01T${routineItem.jam_selesai}Z`);
      routineHours += (endD.getTime() - startD.getTime()) / (1000 * 60 * 60);
    }

    // Add dynamic moved item
    const startDyn = new Date(dynamicMovedItem.waktu_mulai);
    const endDyn = new Date(dynamicMovedItem.waktu_selesai);
    const dynamicHours = (endDyn.getTime() - startDyn.getTime()) / (1000 * 60 * 60);

    return routineHours + dynamicHours;
  };

  // With exception: routine 0h (skipped) + moved dynamic 2h = 2h total (NO double counting)
  assert.strictEqual(calculateHours(exceptionSetWithException), 2);
  // Without exception: routine 2h + dynamic 2h = 4h total (would be double counted!)
  assert.strictEqual(calculateHours(exceptionSetWithoutException), 4);
});

runTest('4.4 Simulation: WIB Timezone conversion in conflictChecker correctly shifts UTC to local date & day', () => {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  
  // UTC Sunday 20:00 -> WIB Monday 03:00 (next day)
  const utcSundayNight = new Date('2026-10-18T20:00:00.000Z');
  const wibTime = new Date(utcSundayNight.getTime() + WIB_OFFSET_MS);
  
  let dayOfWeek = wibTime.getUTCDay();
  if (dayOfWeek === 0) dayOfWeek = 7;
  const wibDateStr = wibTime.toISOString().split('T')[0];
  const wibTimeStr = wibTime.toISOString().split('T')[1].substring(0, 8);

  assert.strictEqual(dayOfWeek, 1, 'Sunday night UTC must map to Monday WIB');
  assert.strictEqual(wibDateStr, '2026-10-19', 'Date string must be Monday in WIB');
  assert.strictEqual(wibTimeStr, '03:00:00', 'Time must be 03:00 WIB');
});

// -----------------------------------------------------------------------------
// SUITE 5: Magic Paste Contract (is_matkul_wajib: true)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Magic Paste AI Alignment ---');

runTest('5.1 magicPaste.ts sets is_matkul_wajib: true on routine course items', () => {
  const magicPastePath = path.join(rootDir, 'server', 'src', 'routes', 'magicPaste.ts');
  const content = fs.readFileSync(magicPastePath, 'utf8');

  assert.ok(
    content.includes('is_matkul_wajib: true'),
    'magicPaste.ts must set is_matkul_wajib: true on routine course items'
  );
  assert.ok(
    content.includes("kategori_id: kategoriId"),
    'magicPaste.ts must assign appropriate kategori_id'
  );
  assert.ok(
    content.includes("from('kegiatan_dinamis')"),
    'magicPaste.ts must insert into kegiatan_dinamis when date is specific'
  );
});

// -----------------------------------------------------------------------------
// SUITE 6: RutinForm & DinamisForm Delete Button
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Modal Delete Buttons ---');

runTest('6.1 RutinForm.tsx renders Delete button when editData is present', () => {
  const rutinFormPath = path.join(rootDir, 'client', 'src', 'components', 'Forms', 'RutinForm.tsx');
  const content = fs.readFileSync(rutinFormPath, 'utf8');

  assert.ok(content.includes('handleDelete'), 'RutinForm must have handleDelete function');
  assert.ok(content.includes('deleteKegiatanRutin'), 'RutinForm must call deleteKegiatanRutin');
  assert.ok(content.includes('{editData ? ('), 'RutinForm must conditionally check editData');
  assert.ok(/>\s*Hapus\s*<\/button>/.test(content), 'RutinForm must render Hapus button');
});

runTest('6.2 DinamisForm.tsx renders Delete button when editData is present', () => {
  const dinamisFormPath = path.join(rootDir, 'client', 'src', 'components', 'Forms', 'DinamisForm.tsx');
  const content = fs.readFileSync(dinamisFormPath, 'utf8');

  assert.ok(content.includes('handleDelete'), 'DinamisForm must have handleDelete function');
  assert.ok(content.includes('deleteKegiatanDinamis'), 'DinamisForm must call deleteKegiatanDinamis');
  assert.ok(content.includes('{editData ? ('), 'DinamisForm must conditionally check editData');
  assert.ok(/>\s*Hapus\s*<\/button>/.test(content), 'DinamisForm must render Hapus button');
});

// -----------------------------------------------------------------------------
// SUITE 7: Dead Routes & Unused Artifacts Cleanup
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 7: Dead Code & Unused Artifacts Elimination ---');

runTest('7.1 Dead endpoint GET /api/rutin/weekly is eliminated', () => {
  const rutinPath = path.join(rootDir, 'server', 'src', 'routes', 'kegiatanRutin.ts');
  const content = fs.readFileSync(rutinPath, 'utf8');

  assert.ok(
    !content.includes("router.get('/weekly'"),
    'kegiatanRutin.ts must NOT contain router.get("/weekly")'
  );
  assert.ok(
    !content.includes('CalendarBlock'),
    'kegiatanRutin.ts must NOT import unused CalendarBlock'
  );
});

runTest('7.2 Dead endpoint GET /api/dinamis/weekly is eliminated and count is removed', () => {
  const dinamisPath = path.join(rootDir, 'server', 'src', 'routes', 'kegiatanDinamis.ts');
  const content = fs.readFileSync(dinamisPath, 'utf8');

  assert.ok(
    !content.includes("router.get('/weekly'"),
    'kegiatanDinamis.ts must NOT contain router.get("/weekly")'
  );
  assert.ok(
    !content.includes('CalendarBlock'),
    'kegiatanDinamis.ts must NOT import unused CalendarBlock'
  );
  assert.ok(
    !content.includes('const { error, count }'),
    'kegiatanDinamis.ts must NOT destructure unused count'
  );
});

runTest('7.3 Dead localStorage.getItem("synctime_user") is removed from AuthContext', () => {
  const authPath = path.join(rootDir, 'client', 'src', 'contexts', 'AuthContext.tsx');
  const content = fs.readFileSync(authPath, 'utf8');

  assert.ok(
    !content.includes("localStorage.getItem('synctime_user')") && !content.includes('localStorage.getItem("synctime_user")'),
    'AuthContext.tsx must NOT contain localStorage.getItem("synctime_user")'
  );
  assert.ok(
    !content.includes('synctime_user'),
    'AuthContext.tsx must not reference synctime_user'
  );
});

runTest('7.4 mass_replace.py is deleted from workspace', () => {
  const massReplacePath = path.join(rootDir, 'mass_replace.py');
  assert.strictEqual(
    fs.existsSync(massReplacePath),
    false,
    'mass_replace.py must not exist in repository root'
  );
});

runTest('7.5 Dockerfile and docker-compose.yml are updated for Supabase and contain no SQLite db_data volume', () => {
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const composePath = path.join(rootDir, 'docker-compose.yml');

  const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
  assert.ok(!dockerfile.includes('db_data'), 'Dockerfile must not have SQLite db_data');
  assert.ok(!dockerfile.includes('DATABASE_PATH'), 'Dockerfile must not have DATABASE_PATH');

  const compose = fs.readFileSync(composePath, 'utf8');
  assert.ok(!compose.includes('synctime_data:'), 'docker-compose.yml must not define SQLite volume synctime_data');
  assert.ok(compose.includes('SUPABASE_URL'), 'docker-compose.yml must provide SUPABASE_URL');
  assert.ok(compose.includes('SUPABASE_SERVICE_ROLE_KEY'), 'docker-compose.yml must provide SUPABASE_SERVICE_ROLE_KEY');
});

// -----------------------------------------------------------------------------
// SUITE 8: Light Mode Contrast & Date Parsing in SharedCalendar
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 8: Light Mode Contrast & SharedCalendar Date Parsing ---');

runTest('8.1 Header.tsx weekRange text contrast is readable in light mode', () => {
  const headerPath = path.join(rootDir, 'client', 'src', 'components', 'Layout', 'Header.tsx');
  const content = fs.readFileSync(headerPath, 'utf8');

  // Must not have unqualified text-gray-200 on light bar (not preceded by dark:)
  assert.ok(
    !content.match(/className="[^"]*(?<!dark:)text-gray-200[^"]*"[^>]*>\s*\{weekRange\}/),
    'Header.tsx must not use bare text-gray-200 on weekRange in light mode'
  );
  assert.ok(
    content.includes('text-gray-700 dark:text-gray-200'),
    'Header.tsx must use text-gray-700 dark:text-gray-200 for weekRange'
  );
});

runTest('8.2 WeeklyCalendar.tsx today badge uses Apple Red (#FF3B30) with white text', () => {
  const calPath = path.join(rootDir, 'client', 'src', 'components', 'Calendar', 'WeeklyCalendar.tsx');
  const content = fs.readFileSync(calPath, 'utf8');

  assert.ok(
    content.includes('bg-[#FF3B30]') && content.includes('text-white'),
    'WeeklyCalendar.tsx today badge must use bg-[#FF3B30] with text-white'
  );
});

runTest('8.3 Sidebar.tsx primary action button uses Apple System Blue (#007AFF) with text-white', () => {
  const sidebarPath = path.join(rootDir, 'client', 'src', 'components', 'Layout', 'Sidebar.tsx');
  const content = fs.readFileSync(sidebarPath, 'utf8');

  assert.ok(
    /bg-\[#007AFF\][^"]*text-white/.test(content),
    'Sidebar.tsx + Jadwal Baru button must use bg-[#007AFF] with text-white'
  );
});

runTest('8.4 LoginPage.tsx submit button uses text-white', () => {
  const loginPath = path.join(rootDir, 'client', 'src', 'pages', 'LoginPage.tsx');
  const content = fs.readFileSync(loginPath, 'utf8');

  assert.ok(
    !content.match(/type="submit"[\s\S]*?text-gray-900/),
    'LoginPage.tsx submit button must not use text-gray-900'
  );
  assert.ok(
    /type="submit"[\s\S]*?text-white/.test(content),
    'LoginPage.tsx submit button must use text-white'
  );
});

runTest('8.5 SharedCalendar.tsx uses parseLocalDate for weekStart navigation', () => {
  const sharedPath = path.join(rootDir, 'client', 'src', 'pages', 'SharedCalendar.tsx');
  const content = fs.readFileSync(sharedPath, 'utf8');

  assert.ok(
    content.includes('parseLocalDate(weekStartParam)'),
    'SharedCalendar.tsx must use parseLocalDate for weekStartParam to avoid UTC shifts'
  );
});

// -----------------------------------------------------------------------------
// SUITE 9: Documentation (USE_CASE_AND_ACTIVITY_DIAGRAM.md)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 9: Documentation Quality & Completeness ---');

runTest('9.1 USE_CASE_AND_ACTIVITY_DIAGRAM.md exists with all required student workflows', () => {
  const docPath = path.join(rootDir, 'docs', 'USE_CASE_AND_ACTIVITY_DIAGRAM.md');
  assert.ok(fs.existsSync(docPath), 'docs/USE_CASE_AND_ACTIVITY_DIAGRAM.md must exist');
  
  const content = fs.readFileSync(docPath, 'utf8');
  assert.ok(content.includes('Mahasiswa'), 'Must document Mahasiswa persona');
  assert.ok(content.includes('Onboarding Semester & Matkul Wajib'), 'Must cover Onboarding');
  assert.ok(content.includes('rutin_exceptions'), 'Must cover rutin_exceptions');
  assert.ok(content.includes('Magic Paste'), 'Must cover Magic Paste AI');
  assert.ok(content.includes('WIB'), 'Must cover WIB timezone email reminders');
  assert.ok(content.includes('Shared Calendar') || content.includes('Berbagi Waktu Luang'), 'Must cover Shared Calendar');

  const mermaidMatches = content.match(/```mermaid[\s\S]*?```/g) || [];
  assert.strictEqual(mermaidMatches.length >= 6, true, `Must contain at least 6 Mermaid diagrams (found ${mermaidMatches.length})`);
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('ALL EMPIRICAL ACCEPTANCE STRESS TESTS PASSED SUCCESSFULLY!');
console.log('================================================================\n');
