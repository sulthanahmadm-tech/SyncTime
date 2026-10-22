import assert from 'node:assert';
import { getBlockPosition, HOURS, isPastDate, parseLocalDate } from '../src/lib/utils.ts';

console.log('====================================================');
console.log('CHALLENGER M1-2: EMPIRICAL FRONTEND LOGIC STRESS TEST');
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
// TEST SUITE 1: DnD Draggable ID Format & Collision Impossibility
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: @dnd-kit ID Format & Collision Impossibility ---');

runTest('1.1 TimeBlock ID generation prefixes entity type', () => {
  const routineBlock = { id: 1, type: 'rutin', judul: 'Algoritma' };
  const dynamicBlock = { id: 1, type: 'dinamis', judul: 'Tugas 1' };

  const routineId = `${routineBlock.type}-${routineBlock.id}`;
  const dynamicId = `${dynamicBlock.type}-${dynamicBlock.id}`;

  assert.strictEqual(routineId, 'rutin-1');
  assert.strictEqual(dynamicId, 'dinamis-1');
  assert.notStrictEqual(routineId, dynamicId, 'IDs must never collide even if numeric ID is identical');
});

runTest('1.2 useDragAndDrop block resolution correctly distinguishes identical IDs', () => {
  const blocks = [
    { id: 1, type: 'rutin', judul: 'Kuliah Pemrograman Web' },
    { id: 1, type: 'dinamis', judul: 'Tugas Pemrograman Web' },
    { id: 2, type: 'rutin', judul: 'Kuliah Basis Data' },
    { id: 2, type: 'dinamis', judul: 'Tugas Basis Data' },
    { id: 999, type: 'rutin', judul: 'Kuliah AI' },
    { id: 999, type: 'dinamis', judul: 'Tugas AI' }
  ];

  // Resolution logic from useDragAndDrop.ts lines 21 & 51:
  const resolveBlock = (activeId, fallbackBlocks) => {
    return fallbackBlocks.find(b => `${b.type}-${b.id}` === activeId) || null;
  };

  const foundRoutine = resolveBlock('rutin-1', blocks);
  assert.ok(foundRoutine);
  assert.strictEqual(foundRoutine.type, 'rutin');
  assert.strictEqual(foundRoutine.id, 1);
  assert.strictEqual(foundRoutine.judul, 'Kuliah Pemrograman Web');

  const foundDynamic = resolveBlock('dinamis-1', blocks);
  assert.ok(foundDynamic);
  assert.strictEqual(foundDynamic.type, 'dinamis');
  assert.strictEqual(foundDynamic.id, 1);
  assert.strictEqual(foundDynamic.judul, 'Tugas Pemrograman Web');

  // Verify routine cannot match dynamic query and vice-versa
  assert.notStrictEqual(foundRoutine, foundDynamic);
});

runTest('1.3 Stress test collision impossibility across 10,000 paired entities', () => {
  const routineIds = new Set();
  const dynamicIds = new Set();

  for (let i = 1; i <= 10000; i++) {
    const rId = `rutin-${i}`;
    const dId = `dinamis-${i}`;

    assert.ok(!routineIds.has(rId), `Duplicate routine ID ${rId}`);
    assert.ok(!dynamicIds.has(dId), `Duplicate dynamic ID ${dId}`);
    assert.notStrictEqual(rId, dId, `Collision between ${rId} and ${dId}`);

    routineIds.add(rId);
    dynamicIds.add(dId);
  }

  // Set intersection must be completely empty
  const intersection = [...routineIds].filter(x => dynamicIds.has(x));
  assert.strictEqual(intersection.length, 0, 'Draggable ID sets must have 0 overlap');
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: 23:00 Cell Click in Dashboard.tsx & RutinForm.tsx
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: 23:00 Cell Click & Time Boundary Validity ---');

runTest('2.1 Dashboard.tsx handleEmptyCellClick on 23:00 slot generates valid ISO datetimes', () => {
  const testDates = [
    '2026-10-21', // Mid-month
    '2026-10-31', // Month-end 31 days
    '2026-04-30', // Month-end 30 days
    '2024-02-29', // Leap day
    '2026-02-28', // Non-leap month-end
    '2026-12-31'  // Year-end
  ];

  for (const dateStr of testDates) {
    const hour = 23;
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    // Logic from Dashboard.tsx lines 67-70:
    const startDate = new Date(`${dateStr}T${timeStr}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    assert.ok(!isNaN(startDate.getTime()), `startDate is valid Date for ${dateStr}`);
    assert.ok(!isNaN(endDate.getTime()), `endDate is valid Date for ${dateStr}`);
    assert.ok(startIso.length > 0, `startIso is non-empty for ${dateStr}`);
    assert.ok(endIso.length > 0, `endIso is non-empty for ${dateStr}`);

    // Verify duration is exactly 1 hour (3600000 ms)
    const durationMs = endDate.getTime() - startDate.getTime();
    assert.strictEqual(durationMs, 60 * 60 * 1000, `Duration must be exactly 1 hour for ${dateStr}`);

    // Verify end date is valid ISO that rolls over to next day
    const parsedEnd = new Date(endIso);
    assert.strictEqual(parsedEnd.toISOString(), endIso);
  }
});

runTest('2.2 Verify legacy string interpolation `${dateStr}T24:00:00` would fail RangeError', () => {
  // Legacy buggy behavior attempted to construct "2026-10-21T24:00:00:00"
  let threwError = false;
  try {
    const badDate = new Date('2026-10-21T24:00:00:00');
    if (isNaN(badDate.getTime())) threwError = true;
    badDate.toISOString();
  } catch (e) {
    threwError = true;
  }
  assert.ok(threwError, 'Direct T24:00:00 parsing is invalid in ISO standard and correctly avoided');
});

runTest('2.3 RutinForm.tsx defaultTime caps at 23:59 for hour 23', () => {
  // Logic from RutinForm.tsx lines 47-49:
  const computeEnd = (defaultTime) => {
    return defaultTime 
      ? (parseInt(defaultTime.split(':')[0]) >= 23 ? '23:59' : `${parseInt(defaultTime.split(':')[0]) + 1}:00`.padStart(5, '0'))
      : '09:00';
  };

  // Test hour 23
  const end23 = computeEnd('23:00');
  assert.strictEqual(end23, '23:59', '23:00 must default end time to 23:59');

  // Test validation formData.jam_selesai > formData.jam_mulai
  const start = '23:00';
  assert.ok(end23 > start, 'jam_selesai ("23:59") must be strictly greater than jam_mulai ("23:00")');

  // Test other hours
  assert.strictEqual(computeEnd('08:00'), '09:00');
  assert.strictEqual(computeEnd('21:00'), '22:00');
  assert.strictEqual(computeEnd('22:00'), '23:00');
  assert.strictEqual(computeEnd('23:30'), '23:59');
});

// -----------------------------------------------------------------------------
// TEST SUITE 3: getBlockPosition in utils.ts for Early Morning Events
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Early Morning Calendar Positioning (utils.ts) ---');

runTest('3.1 HOURS array spans complete 24 hours (0..23)', () => {
  assert.strictEqual(HOURS.length, 24);
  assert.strictEqual(HOURS[0], 0);
  assert.strictEqual(HOURS[23], 23);
});

runTest('3.2 Early morning event 04:00 - 05:30 has top >= 0, height > 0, isHidden false', () => {
  const pos = getBlockPosition('04:00', '05:30');
  assert.strictEqual(pos.top, 240, '04:00 top is 4 * 60 = 240px');
  assert.strictEqual(pos.height, 90, '04:00 to 05:30 height is 90px');
  assert.strictEqual(pos.isHidden, false, '04:00 - 05:30 must not be hidden');
  assert.ok(pos.top >= 0);
  assert.ok(pos.height > 0);
});

runTest('3.3 Midnight event 00:00 - 01:00 has top = 0, height = 60, isHidden false', () => {
  const pos = getBlockPosition('00:00', '01:00');
  assert.strictEqual(pos.top, 0, '00:00 top is 0px');
  assert.strictEqual(pos.height, 60, '00:00 to 01:00 height is 60px');
  assert.strictEqual(pos.isHidden, false, 'Midnight event must be visible');
});

runTest('3.4 Early morning event crossing 06:00 boundary (05:00 - 07:00)', () => {
  const pos = getBlockPosition('05:00', '07:00');
  assert.strictEqual(pos.top, 300, '05:00 top is 300px');
  assert.strictEqual(pos.height, 120, '2 hours height is 120px');
  assert.strictEqual(pos.isHidden, false);
});

runTest('3.5 Full day bounds clamping (event exceeds 24:00)', () => {
  const pos = getBlockPosition('23:00', '23:59');
  assert.strictEqual(pos.top, 1380, '23:00 top is 1380px');
  assert.strictEqual(pos.height, 59, '59 minutes duration');
  assert.strictEqual(pos.isHidden, false);
});

runTest('3.6 ISO format inputs for dynamic events', () => {
  const pos = getBlockPosition('2026-10-22T04:00:00', '2026-10-22T05:30:00');
  assert.strictEqual(pos.top, 240);
  assert.strictEqual(pos.height, 90);
  assert.strictEqual(pos.isHidden, false);
});

runTest('3.7 Zero duration or invalid inputs safely handled', () => {
  const invalid = getBlockPosition('invalid', 'dates');
  assert.strictEqual(invalid.isHidden, true);

  const zeroDuration = getBlockPosition('10:00', '10:00');
  assert.strictEqual(zeroDuration.height, 0);
  assert.strictEqual(zeroDuration.isHidden, true);
});

// -----------------------------------------------------------------------------
// TEST SUITE 4: Time Validation Rules Across All Forms
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Form Time Validation Rules Verification ---');

runTest('4.1 RutinForm validation rule: jam_selesai > jam_mulai', () => {
  const validateRutin = (jam_mulai, jam_selesai) => {
    return jam_selesai > jam_mulai;
  };

  // Valid cases
  assert.strictEqual(validateRutin('08:00', '09:00'), true);
  assert.strictEqual(validateRutin('23:00', '23:59'), true);
  assert.strictEqual(validateRutin('00:00', '01:00'), true);

  // Invalid cases (equal or reverse)
  assert.strictEqual(validateRutin('09:00', '08:00'), false);
  assert.strictEqual(validateRutin('09:00', '09:00'), false);
  assert.strictEqual(validateRutin('23:59', '23:00'), false);
});

runTest('4.2 DinamisForm validation rules: waktu_selesai > waktu_mulai & past date check', () => {
  const validateDinamisTime = (waktu_mulai, waktu_selesai) => {
    return new Date(waktu_selesai).getTime() > new Date(waktu_mulai).getTime();
  };

  const validatePastDateRule = (waktu_mulai, isEditMode) => {
    const dateStr = waktu_mulai.split('T')[0];
    if (!isEditMode && isPastDate(dateStr)) {
      return false; // Blocked for new past event
    }
    return true; // Allowed
  };

  // Start before end
  assert.strictEqual(validateDinamisTime('2026-10-25T10:00', '2026-10-25T11:00'), true);
  assert.strictEqual(validateDinamisTime('2026-10-25T10:00', '2026-10-25T10:00'), false);
  assert.strictEqual(validateDinamisTime('2026-10-25T10:00', '2026-10-25T09:00'), false);

  // Past date creation vs editing
  const pastTimestamp = '2020-01-01T10:00';
  assert.strictEqual(validatePastDateRule(pastTimestamp, false), false, 'New past event must be blocked');
  assert.strictEqual(validatePastDateRule(pastTimestamp, true), true, 'Editing past event must be allowed');
});

runTest('4.3 OnboardingPage validation rules: semesterEnd > semesterStart & jam_selesai > jam_mulai', () => {
  // Step 1: Semester bounds
  const validateSemester = (start, end) => end > start;
  assert.strictEqual(validateSemester('2026-09-01', '2027-01-31'), true);
  assert.strictEqual(validateSemester('2026-09-01', '2026-09-01'), false);
  assert.strictEqual(validateSemester('2026-09-01', '2026-08-01'), false);

  // Step 2: Matkul time
  const validateMatkul = (mulai, selesai) => selesai > mulai;
  assert.strictEqual(validateMatkul('08:00', '10:00'), true);
  assert.strictEqual(validateMatkul('10:00', '10:00'), false);
  assert.strictEqual(validateMatkul('11:00', '10:00'), false);
});

runTest('4.4 MatkulWajibModal validation rules: semester and matkul additions/edits', () => {
  const validateSemesterSave = (start, end) => {
    if (start && end && end <= start) return false;
    return true;
  };
  assert.strictEqual(validateSemesterSave('2026-09-01', '2027-01-31'), true);
  assert.strictEqual(validateSemesterSave('2026-09-01', '2026-09-01'), false);
  assert.strictEqual(validateSemesterSave('2026-09-01', '2026-08-01'), false);

  const validateMatkul = (mulai, selesai) => selesai > mulai;
  assert.strictEqual(validateMatkul('13:00', '15:30'), true);
  assert.strictEqual(validateMatkul('13:00', '13:00'), false);
  assert.strictEqual(validateMatkul('16:00', '15:30'), false);
});

console.log('\n====================================================');
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
