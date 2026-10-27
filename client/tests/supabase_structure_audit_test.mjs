import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('AUDIT TEST: SUPABASE STRUCTURE, LOGIC INTEGRITY & DEAD CODE');
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
// SUITE 1: Supabase schema.sql Integrity & Idempotency
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Supabase schema.sql Integrity & Best Practices ---');

const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

runTest('1.1 Table creation order: tables defined before trigger functions', () => {
  const profilePos = schemaContent.indexOf('CREATE TABLE IF NOT EXISTS profiles');
  const kategoriPos = schemaContent.indexOf('CREATE TABLE IF NOT EXISTS kategori');
  const rutinPos = schemaContent.indexOf('CREATE TABLE IF NOT EXISTS kegiatan_rutin');
  const dinamisPos = schemaContent.indexOf('CREATE TABLE IF NOT EXISTS kegiatan_dinamis');
  const excPos = schemaContent.indexOf('CREATE TABLE IF NOT EXISTS rutin_exceptions');
  const funcPos = schemaContent.indexOf('FUNCTION public.handle_new_user()');

  assert.ok(profilePos !== -1, 'profiles table must exist');
  assert.ok(kategoriPos !== -1, 'kategori table must exist');
  assert.ok(rutinPos !== -1, 'kegiatan_rutin table must exist');
  assert.ok(dinamisPos !== -1, 'kegiatan_dinamis table must exist');
  assert.ok(excPos !== -1, 'rutin_exceptions table must exist');
  
  assert.ok(profilePos < kategoriPos, 'profiles must be created before kategori');
  assert.ok(kategoriPos < rutinPos, 'kategori must be created before kegiatan_rutin');
  assert.ok(kategoriPos < dinamisPos, 'kategori must be created before kegiatan_dinamis');
  assert.ok(rutinPos < excPos, 'kegiatan_rutin must be created before rutin_exceptions');
  assert.ok(kategoriPos < funcPos, 'kategori table must be created before handle_new_user function');
});

runTest('1.2 Performance indexes defined on all foreign keys', () => {
  assert.ok(schemaContent.includes('idx_kategori_user_id'), 'Index on kategori(user_id) missing');
  assert.ok(schemaContent.includes('idx_kegiatan_rutin_user_id'), 'Index on kegiatan_rutin(user_id) missing');
  assert.ok(schemaContent.includes('idx_kegiatan_rutin_kategori_id'), 'Index on kegiatan_rutin(kategori_id) missing');
  assert.ok(schemaContent.includes('idx_kegiatan_dinamis_user_id'), 'Index on kegiatan_dinamis(user_id) missing');
  assert.ok(schemaContent.includes('idx_kegiatan_dinamis_kategori_id'), 'Index on kegiatan_dinamis(kategori_id) missing');
  assert.ok(schemaContent.includes('idx_kegiatan_dinamis_waktu'), 'Index on kegiatan_dinamis(user_id, waktu_mulai, waktu_selesai) missing');
  assert.ok(schemaContent.includes('idx_rutin_exceptions_rutin_id'), 'Index on rutin_exceptions(kegiatan_rutin_id) missing');
  assert.ok(schemaContent.includes('idx_rutin_exceptions_lookup'), 'Index on rutin_exceptions lookup missing');
});

runTest('1.3 Unique constraint on rutin_exceptions prevents duplicate records', () => {
  assert.ok(
    schemaContent.includes('CONSTRAINT uq_rutin_exception UNIQUE (kegiatan_rutin_id, tanggal_dilewati)'),
    'rutin_exceptions must enforce unique constraint on (kegiatan_rutin_id, tanggal_dilewati)'
  );
});

runTest('1.4 handle_new_user trigger function includes EXCEPTION safeguard', () => {
  assert.ok(schemaContent.includes('SECURITY DEFINER'), 'handle_new_user must be SECURITY DEFINER');
  assert.ok(schemaContent.includes('SET search_path = public'), 'handle_new_user must set search_path');
  assert.ok(schemaContent.includes('ON CONFLICT (id) DO NOTHING'), 'handle_new_user must handle id conflict');
  assert.ok(schemaContent.includes('EXCEPTION'), 'handle_new_user must have EXCEPTION block');
  assert.ok(schemaContent.includes('WHEN OTHERS THEN'), 'handle_new_user must catch all exceptions');
  assert.ok(schemaContent.includes('RAISE WARNING'), 'handle_new_user must log warning on exception');
  assert.ok(schemaContent.includes('RETURN NEW;'), 'handle_new_user must return NEW to permit auth signup');
});

runTest('1.5 All 19 RLS policies are idempotent with DROP POLICY IF EXISTS', () => {
  const dropMatches = schemaContent.match(/DROP POLICY IF EXISTS/g) || [];
  assert.strictEqual(dropMatches.length, 19, `Expected 19 DROP POLICY IF EXISTS statements, found ${dropMatches.length}`);
  
  const createMatches = schemaContent.match(/CREATE POLICY/g) || [];
  assert.strictEqual(createMatches.length, 19, `Expected 19 CREATE POLICY statements, found ${createMatches.length}`);

  assert.ok(schemaContent.includes('"Users can insert own profile" ON profiles'), 'Must have INSERT policy on profiles');

  // Must not evaluate auth.uid() per row (must use subquery)
  assert.ok(!schemaContent.match(/\bauth\.uid\(\)\s*=\s*(?:user_id|id)\b/), 'Must use (select auth.uid())');
  assert.ok(schemaContent.includes('(select auth.uid())'), 'Must optimize RLS with (select auth.uid())');
});

// -----------------------------------------------------------------------------
// SUITE 2: Migration Scripts Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Migration Scripts (fix_auth_signup_trigger & fix_rls_performance) ---');

const fixTriggerPath = path.join(rootDir, 'supabase', 'fix_auth_signup_trigger.sql');
const fixTriggerContent = fs.readFileSync(fixTriggerPath, 'utf8');

runTest('2.1 fix_auth_signup_trigger.sql includes EXCEPTION block and orphan repair', () => {
  assert.ok(fixTriggerContent.includes('EXCEPTION'), 'Must have EXCEPTION block');
  assert.ok(fixTriggerContent.includes('WHEN OTHERS THEN'), 'Must catch WHEN OTHERS');
  assert.ok(fixTriggerContent.includes('RAISE WARNING'), 'Must raise warning');
  assert.ok(fixTriggerContent.includes('INSERT INTO public.profiles (id, email)'), 'Must restore orphaned profiles');
  assert.ok(fixTriggerContent.includes('REVOKE ALL ON TABLE public.profiles, public.kategori FROM supabase_auth_admin'), 'Must revoke unnecessary permissions');
});

const fixRlsPath = path.join(rootDir, 'supabase', 'fix_rls_performance.sql');
const fixRlsContent = fs.readFileSync(fixRlsPath, 'utf8');

runTest('2.2 fix_rls_performance.sql includes performance indexes and unique constraints', () => {
  assert.ok(fixRlsContent.includes('CREATE INDEX IF NOT EXISTS idx_kategori_user_id'), 'Must create category index');
  assert.ok(fixRlsContent.includes('idx_kegiatan_rutin_user_hari'), 'Must create routine user+hari index');
  assert.ok(fixRlsContent.includes('uq_kategori_user_nama'), 'Must add uq_kategori_user_nama constraint');
  assert.ok(fixRlsContent.includes('uq_rutin_exception'), 'Must add uq_rutin_exception constraint');
  const dropMatches = fixRlsContent.match(/DROP POLICY IF EXISTS/g) || [];
  assert.strictEqual(dropMatches.length, 19, 'Must drop all 19 policies');
});

// -----------------------------------------------------------------------------
// SUITE 3: Server Auto-Healing & False Logic Elimination
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Server Auto-Healing & False Logic Elimination ---');

runTest('3.1 server/src/routes/auth.ts auto-heals missing profiles and uses maybeSingle', () => {
  const authPath = path.join(rootDir, 'server', 'src', 'routes', 'auth.ts');
  const content = fs.readFileSync(authPath, 'utf8');

  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle in auth.ts');
  assert.ok(!content.includes('.single()'), 'Must not use single() in auth.ts (causes 500 when not found)');
  assert.ok(content.includes('newProfile'), 'Must auto-heal missing profile');
  assert.ok(content.includes('insert({ id: userId, email: req.user!.email })'), 'Must insert new profile for user');
});

runTest('3.2 server/src/utils/conflictChecker.ts scopes exceptions to userId and uses maybeSingle', () => {
  const checkerPath = path.join(rootDir, 'server', 'src', 'utils', 'conflictChecker.ts');
  const content = fs.readFileSync(checkerPath, 'utf8');

  assert.ok(content.includes('kegiatan_rutin!inner(user_id)'), 'Must join kegiatan_rutin for tenant isolation');
  assert.ok(content.includes("eq('kegiatan_rutin.user_id', userId)"), 'Must scope exception query to userId');
  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle for profile in conflictChecker');
});

runTest('3.3 server/src/routes/magicPaste.ts auto-heals categories and avoids fallback ID 1', () => {
  const pastePath = path.join(rootDir, 'server', 'src', 'routes', 'magicPaste.ts');
  const content = fs.readFileSync(pastePath, 'utf8');

  assert.ok(!content.includes('kategoriId = kuliahKat?.id || 1;'), 'Must NOT fall back to arbitrary kategoriId = 1');
  assert.ok(content.includes('createdCats'), 'Must auto-heal categories if user has none');
  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle for profile in magicPaste.ts');
});

runTest('3.4 server/src/routes/onboarding.ts auto-heals categories and uses case-insensitive match', () => {
  const onbPath = path.join(rootDir, 'server', 'src', 'routes', 'onboarding.ts');
  const content = fs.readFileSync(onbPath, 'utf8');

  assert.ok(content.includes("k.nama_kategori.toLowerCase() === 'kuliah'"), 'Must match Kuliah case-insensitively');
  assert.ok(content.includes('createdCats'), 'Must auto-heal categories if user has none');
  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle in onboarding.ts');
});

runTest('3.5 server/src/routes/scheduleMove.ts checks existing exception before insert', () => {
  const movePath = path.join(rootDir, 'server', 'src', 'routes', 'scheduleMove.ts');
  const content = fs.readFileSync(movePath, 'utf8');

  assert.ok(content.includes('existingExc'), 'Must check existing exception to prevent duplicate insert');
  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle in scheduleMove.ts');
});

runTest('3.6 server/src/routes/shared.ts validates UUID format for user_id', () => {
  const sharedPath = path.join(rootDir, 'server', 'src', 'routes', 'shared.ts');
  const content = fs.readFileSync(sharedPath, 'utf8');

  assert.ok(content.includes('uuidRegex'), 'Must validate user_id with uuidRegex');
  assert.ok(content.includes('Invalid user_id format'), 'Must return 400 for invalid user_id format');
  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle for profile in shared.ts');
});

runTest('3.7 server/src/routes/kegiatanRutin.ts supports is_matkul_wajib update and returns 404 cleanly', () => {
  const rutinPath = path.join(rootDir, 'server', 'src', 'routes', 'kegiatanRutin.ts');
  const content = fs.readFileSync(rutinPath, 'utf8');

  assert.ok(content.includes('updatePayload.is_matkul_wajib'), 'Must support is_matkul_wajib in PUT /:id');
  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle on update so 404 can trigger');
});

runTest('3.8 server/src/routes/kegiatanDinamis.ts uses maybeSingle so 404 triggers cleanly', () => {
  const dinamisPath = path.join(rootDir, 'server', 'src', 'routes', 'kegiatanDinamis.ts');
  const content = fs.readFileSync(dinamisPath, 'utf8');

  assert.ok(content.includes('.maybeSingle()'), 'Must use maybeSingle on update/patch so 404 triggers');
});

// -----------------------------------------------------------------------------
// SUITE 4: Type Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Type Integrity ---');

runTest('4.1 server/src/types/index.ts exports RutinException', () => {
  const typesPath = path.join(rootDir, 'server', 'src', 'types', 'index.ts');
  const content = fs.readFileSync(typesPath, 'utf8');

  assert.ok(content.includes('export interface RutinException'), 'Must export RutinException');
  assert.ok(content.includes('kegiatan_rutin_id: number;'), 'Must have kegiatan_rutin_id');
  assert.ok(content.includes('tanggal_dilewati: string;'), 'Must have tanggal_dilewati');
});

runTest('4.2 client/src/lib/types.ts exports RutinException', () => {
  const typesPath = path.join(rootDir, 'client', 'src', 'lib', 'types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');

  assert.ok(content.includes('export interface RutinException'), 'Must export RutinException');
  assert.ok(content.includes('kegiatan_rutin_id: number;'), 'Must have kegiatan_rutin_id');
  assert.ok(content.includes('tanggal_dilewati: string;'), 'Must have tanggal_dilewati');
});

// -----------------------------------------------------------------------------
// SUITE 5: Timezone WIB Integrity & Route Robustness
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Timezone WIB Integrity & Route Robustness ---');

runTest('5.1 server/src/routes/calendar.ts uses explicit +07:00 WIB offset', () => {
  const calPath = path.join(rootDir, 'server', 'src', 'routes', 'calendar.ts');
  const content = fs.readFileSync(calPath, 'utf8');
  assert.ok(content.includes('+07:00'), 'calendar.ts must parse week_start with explicit +07:00');
  assert.ok(!content.includes('new Date(week_start)'), 'calendar.ts must not parse raw week_start without offset');
});

runTest('5.2 server/src/routes/analytics.ts uses explicit +07:00 WIB offset', () => {
  const anaPath = path.join(rootDir, 'server', 'src', 'routes', 'analytics.ts');
  const content = fs.readFileSync(anaPath, 'utf8');
  assert.ok(content.includes('+07:00'), 'analytics.ts must parse week_start with explicit +07:00');
  assert.ok(!content.includes('new Date(week_start)'), 'analytics.ts must not parse raw week_start without offset');
});

runTest('5.3 server/src/routes/shared.ts uses explicit +07:00 WIB offset', () => {
  const sharedPath = path.join(rootDir, 'server', 'src', 'routes', 'shared.ts');
  const content = fs.readFileSync(sharedPath, 'utf8');
  assert.ok(content.includes('+07:00'), 'shared.ts must parse week_start with explicit +07:00');
  assert.ok(!content.includes('new Date(week_start)'), 'shared.ts must not parse raw week_start without offset');
});

runTest('5.4 server/src/routes/scheduleMove.ts returns 404 for missing activities', () => {
  const movePath = path.join(rootDir, 'server', 'src', 'routes', 'scheduleMove.ts');
  const content = fs.readFileSync(movePath, 'utf8');
  assert.ok(content.includes('updatedDinamis'), 'scheduleMove.ts must check updated rows for dinamis');
  assert.ok(content.includes('updatedRutin'), 'scheduleMove.ts must check updated rows for rutin');
  assert.ok(content.includes('dateUtc.getUTCDay()'), 'scheduleMove.ts must use UTC day of week');
});

runTest('5.5 server/src/routes/kategori.ts uses idempotent upsert on category auto-healing', () => {
  const katPath = path.join(rootDir, 'server', 'src', 'routes', 'kategori.ts');
  const content = fs.readFileSync(katPath, 'utf8');
  assert.ok(content.includes('.upsert('), 'kategori.ts must use upsert for default categories');
  assert.ok(content.includes('ignoreDuplicates: true'), 'kategori.ts must set ignoreDuplicates: true');
});

runTest('5.6 WeeklyCalendar.tsx filters UTC ISO blocks by local date', () => {
  const calCompPath = path.join(rootDir, 'client', 'src', 'components', 'Calendar', 'WeeklyCalendar.tsx');
  const content = fs.readFileSync(calCompPath, 'utf8');
  assert.ok(content.includes('getLocalDateString(new Date(b.start)) === dateStr'), 'WeeklyCalendar must resolve local date for UTC blocks');
});

runTest('5.7 AuthContext & LoginPage handle email verification session flow', () => {
  const authPath = path.join(rootDir, 'client', 'src', 'contexts', 'AuthContext.tsx');
  const authContent = fs.readFileSync(authPath, 'utf8');
  assert.ok(authContent.includes('return { data, error };'), 'AuthContext signUp must return data and error');

  const loginPath = path.join(rootDir, 'client', 'src', 'pages', 'LoginPage.tsx');
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  assert.ok(loginContent.includes('data?.session'), 'LoginPage must check data?.session');
  assert.ok(loginContent.includes('inbox email'), 'LoginPage must inform user when verification is needed');
});

console.log('\n================================================================');
console.log(`TOTAL AUDIT TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('ALL SUPABASE STRUCTURE AUDIT TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');
