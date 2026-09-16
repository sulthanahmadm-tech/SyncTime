-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  semester_start DATE,
  semester_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert default categories for the new user
  INSERT INTO public.kategori (user_id, nama_kategori, warna_hex, kode_led_iot) VALUES
    (NEW.id, 'Kuliah', '#EF4444', 'RED'),
    (NEW.id, 'Acara Kampus', '#F59E0B', 'YELLOW'),
    (NEW.id, 'Tugas', '#3B82F6', 'BLUE'),
    (NEW.id, 'Downtime', '#22C55E', 'GREEN');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Kategori table
CREATE TABLE kategori (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nama_kategori TEXT NOT NULL,
  warna_hex TEXT NOT NULL,
  kode_led_iot TEXT
);

-- Kegiatan Rutin table
CREATE TABLE kegiatan_rutin (
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

-- Kegiatan Dinamis table
CREATE TABLE kegiatan_dinamis (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kategori_id INTEGER NOT NULL REFERENCES kategori(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  waktu_mulai TIMESTAMPTZ NOT NULL,
  waktu_selesai TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Rutin Exceptions table
CREATE TABLE rutin_exceptions (
  id SERIAL PRIMARY KEY,
  kegiatan_rutin_id INTEGER NOT NULL REFERENCES kegiatan_rutin(id) ON DELETE CASCADE,
  tanggal_dilewati DATE NOT NULL
);

-- Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan_rutin ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan_dinamis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutin_exceptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Kategori: users can only CRUD their own
CREATE POLICY "Users can view own kategori" ON kategori FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kategori" ON kategori FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kategori" ON kategori FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kategori" ON kategori FOR DELETE USING (auth.uid() = user_id);

-- Kegiatan Rutin
CREATE POLICY "Users can view own kegiatan rutin" ON kegiatan_rutin FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kegiatan rutin" ON kegiatan_rutin FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kegiatan rutin" ON kegiatan_rutin FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kegiatan rutin" ON kegiatan_rutin FOR DELETE USING (auth.uid() = user_id);

-- Kegiatan Dinamis
CREATE POLICY "Users can view own kegiatan dinamis" ON kegiatan_dinamis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kegiatan dinamis" ON kegiatan_dinamis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kegiatan dinamis" ON kegiatan_dinamis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kegiatan dinamis" ON kegiatan_dinamis FOR DELETE USING (auth.uid() = user_id);

-- Rutin Exceptions
CREATE POLICY "Users can view own rutin exceptions" ON rutin_exceptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own rutin exceptions" ON rutin_exceptions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own rutin exceptions" ON rutin_exceptions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own rutin exceptions" ON rutin_exceptions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM kegiatan_rutin
    WHERE kegiatan_rutin.id = rutin_exceptions.kegiatan_rutin_id
    AND kegiatan_rutin.user_id = auth.uid()
  )
);
