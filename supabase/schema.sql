-- ==============================================================================
-- SYNCTIME SUPABASE DATABASE SCHEMA (Single Source of Truth)
-- ==============================================================================

-- 1. PROFILES TABLE (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  semester_start DATE,
  semester_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KATEGORI TABLE
CREATE TABLE IF NOT EXISTS kategori (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nama_kategori TEXT NOT NULL,
  warna_hex TEXT NOT NULL,
  CONSTRAINT uq_kategori_user_nama UNIQUE (user_id, nama_kategori)
);

-- 3. KEGIATAN RUTIN TABLE
CREATE TABLE IF NOT EXISTS kegiatan_rutin (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kategori_id INTEGER NOT NULL REFERENCES kategori(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  hari_mingguan INTEGER NOT NULL CHECK (hari_mingguan BETWEEN 1 AND 7),
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  batas_minggu_berulang INTEGER DEFAULT 16,
  is_matkul_wajib BOOLEAN DEFAULT FALSE
);

-- 4. KEGIATAN DINAMIS TABLE
CREATE TABLE IF NOT EXISTS kegiatan_dinamis (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kategori_id INTEGER NOT NULL REFERENCES kategori(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  waktu_mulai TIMESTAMPTZ NOT NULL,
  waktu_selesai TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE
);

-- 5. RUTIN EXCEPTIONS TABLE
CREATE TABLE IF NOT EXISTS rutin_exceptions (
  id SERIAL PRIMARY KEY,
  kegiatan_rutin_id INTEGER NOT NULL REFERENCES kegiatan_rutin(id) ON DELETE CASCADE,
  tanggal_dilewati DATE NOT NULL,
  CONSTRAINT uq_rutin_exception UNIQUE (kegiatan_rutin_id, tanggal_dilewati)
);

-- ==============================================================================
-- PERFORMANCE INDEXES (Foreign Keys & Frequent Range Queries)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_kategori_user_id ON public.kategori(user_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_rutin_user_id ON public.kegiatan_rutin(user_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_rutin_user_hari ON public.kegiatan_rutin(user_id, hari_mingguan);
CREATE INDEX IF NOT EXISTS idx_kegiatan_rutin_kategori_id ON public.kegiatan_rutin(kategori_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_dinamis_user_id ON public.kegiatan_dinamis(user_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_dinamis_kategori_id ON public.kegiatan_dinamis(kategori_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_dinamis_waktu ON public.kegiatan_dinamis(user_id, waktu_mulai, waktu_selesai);
CREATE INDEX IF NOT EXISTS idx_rutin_exceptions_rutin_id ON public.rutin_exceptions(kegiatan_rutin_id);
CREATE INDEX IF NOT EXISTS idx_rutin_exceptions_lookup ON public.rutin_exceptions(kegiatan_rutin_id, tanggal_dilewati);

-- ==============================================================================
-- AUTH SIGNUP TRIGGER (Auto-create Profile and Default Categories)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user (and keep email synced on conflict)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert default categories safely and idempotently
  INSERT INTO public.kategori (user_id, nama_kategori, warna_hex) VALUES
    (NEW.id, 'Kuliah', '#EF4444'),
    (NEW.id, 'Acara Kampus', '#F59E0B'),
    (NEW.id, 'Tugas', '#3B82F6'),
    (NEW.id, 'Downtime', '#22C55E')
  ON CONFLICT (user_id, nama_kategori) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent signup failure even if profile/category creation hits transient issues.
    -- The server API auto-heals missing profiles and categories upon login.
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan_rutin ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan_dinamis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutin_exceptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/insert/edit their own
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- Kategori: users can only CRUD their own
DROP POLICY IF EXISTS "Users can view own kategori" ON kategori;
DROP POLICY IF EXISTS "Users can insert own kategori" ON kategori;
DROP POLICY IF EXISTS "Users can update own kategori" ON kategori;
DROP POLICY IF EXISTS "Users can delete own kategori" ON kategori;
CREATE POLICY "Users can view own kategori" ON kategori FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own kategori" ON kategori FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own kategori" ON kategori FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own kategori" ON kategori FOR DELETE USING ((select auth.uid()) = user_id);

-- Kegiatan Rutin
DROP POLICY IF EXISTS "Users can view own kegiatan rutin" ON kegiatan_rutin;
DROP POLICY IF EXISTS "Users can insert own kegiatan rutin" ON kegiatan_rutin;
DROP POLICY IF EXISTS "Users can update own kegiatan rutin" ON kegiatan_rutin;
DROP POLICY IF EXISTS "Users can delete own kegiatan rutin" ON kegiatan_rutin;
CREATE POLICY "Users can view own kegiatan rutin" ON kegiatan_rutin FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own kegiatan rutin" ON kegiatan_rutin FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own kegiatan rutin" ON kegiatan_rutin FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own kegiatan rutin" ON kegiatan_rutin FOR DELETE USING ((select auth.uid()) = user_id);

-- Kegiatan Dinamis
DROP POLICY IF EXISTS "Users can view own kegiatan dinamis" ON kegiatan_dinamis;
DROP POLICY IF EXISTS "Users can insert own kegiatan dinamis" ON kegiatan_dinamis;
DROP POLICY IF EXISTS "Users can update own kegiatan dinamis" ON kegiatan_dinamis;
DROP POLICY IF EXISTS "Users can delete own kegiatan dinamis" ON kegiatan_dinamis;
CREATE POLICY "Users can view own kegiatan dinamis" ON kegiatan_dinamis FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own kegiatan dinamis" ON kegiatan_dinamis FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own kegiatan dinamis" ON kegiatan_dinamis FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own kegiatan dinamis" ON kegiatan_dinamis FOR DELETE USING ((select auth.uid()) = user_id);

-- Rutin Exceptions
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
