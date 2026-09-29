-- =============================================
-- MIGRASI RLS: Optimasi Performa auth.uid()
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================
-- Masalah: auth.uid() dievaluasi ulang per baris (lambat)
-- Solusi: (select auth.uid()) dievaluasi sekali saja (cepat)
-- =============================================

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- ========== KATEGORI ==========
DROP POLICY IF EXISTS "Users can view own kategori" ON kategori;
DROP POLICY IF EXISTS "Users can insert own kategori" ON kategori;
DROP POLICY IF EXISTS "Users can update own kategori" ON kategori;
DROP POLICY IF EXISTS "Users can delete own kategori" ON kategori;

CREATE POLICY "Users can view own kategori" ON kategori FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own kategori" ON kategori FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own kategori" ON kategori FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own kategori" ON kategori FOR DELETE USING ((select auth.uid()) = user_id);

-- ========== KEGIATAN RUTIN ==========
DROP POLICY IF EXISTS "Users can view own kegiatan rutin" ON kegiatan_rutin;
DROP POLICY IF EXISTS "Users can insert own kegiatan rutin" ON kegiatan_rutin;
DROP POLICY IF EXISTS "Users can update own kegiatan rutin" ON kegiatan_rutin;
DROP POLICY IF EXISTS "Users can delete own kegiatan rutin" ON kegiatan_rutin;

CREATE POLICY "Users can view own kegiatan rutin" ON kegiatan_rutin FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own kegiatan rutin" ON kegiatan_rutin FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own kegiatan rutin" ON kegiatan_rutin FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own kegiatan rutin" ON kegiatan_rutin FOR DELETE USING ((select auth.uid()) = user_id);

-- ========== KEGIATAN DINAMIS ==========
DROP POLICY IF EXISTS "Users can view own kegiatan dinamis" ON kegiatan_dinamis;
DROP POLICY IF EXISTS "Users can insert own kegiatan dinamis" ON kegiatan_dinamis;
DROP POLICY IF EXISTS "Users can update own kegiatan dinamis" ON kegiatan_dinamis;
DROP POLICY IF EXISTS "Users can delete own kegiatan dinamis" ON kegiatan_dinamis;

CREATE POLICY "Users can view own kegiatan dinamis" ON kegiatan_dinamis FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own kegiatan dinamis" ON kegiatan_dinamis FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own kegiatan dinamis" ON kegiatan_dinamis FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own kegiatan dinamis" ON kegiatan_dinamis FOR DELETE USING ((select auth.uid()) = user_id);

-- ========== RUTIN EXCEPTIONS ==========
DROP POLICY IF EXISTS "Users can view own rutin exceptions" ON rutin_exceptions;
DROP POLICY IF EXISTS "Users can insert own rutin exceptions" ON rutin_exceptions;
DROP POLICY IF EXISTS "Users can update own rutin exceptions" ON rutin_exceptions;
DROP POLICY IF EXISTS "Users can delete own rutin exceptions" ON rutin_exceptions;

CREATE POLICY "Users can view own rutin exceptions" ON rutin_exceptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = (select auth.uid())
  )
);
CREATE POLICY "Users can insert own rutin exceptions" ON rutin_exceptions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = (select auth.uid())
  )
);
CREATE POLICY "Users can update own rutin exceptions" ON rutin_exceptions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = (select auth.uid())
  )
);
CREATE POLICY "Users can delete own rutin exceptions" ON rutin_exceptions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = (select auth.uid())
  )
);

-- =============================================
-- Selesai! Semua 18 policy sudah dioptimasi.
-- Jalankan Supabase Linter lagi untuk verifikasi.
-- =============================================
