-- ==============================================================================
-- MIGRASI SUPABASE: Perbaikan Trigger Registrasi Pengguna Baru (handle_new_user)
-- Masalah: Error "Database error saving new user" (500) saat pendaftaran/signup
-- Skrip ini menyamakan fungsi & trigger di database live dengan supabase/schema.sql.
-- ==============================================================================

-- 1. Bersihkan sisa versi lama skrip ini (no-op jika belum pernah dijalankan):
--    Pasang policy INSERT yang aman (hanya auth.uid()), dan bersihkan GRANT berlebih ke role auth.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
REVOKE ALL ON TABLE public.profiles, public.kategori FROM supabase_auth_admin;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM supabase_auth_admin;

-- 2. Fungsi handle_new_user:
--    - SET search_path = public: wajib untuk SECURITY DEFINER (Supabase linter)
--    - ON CONFLICT: aman jika ada trigger duplikat lain di auth.users, sinkronisasi email
--    - EXCEPTION block: mencatat warning di Postgres log tanpa membatalkan registrasi auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.kategori (user_id, nama_kategori, warna_hex) VALUES
    (NEW.id, 'Kuliah', '#EF4444'),
    (NEW.id, 'Acara Kampus', '#F59E0B'),
    (NEW.id, 'Tugas', '#3B82F6'),
    (NEW.id, 'Downtime', '#22C55E')
  ON CONFLICT (user_id, nama_kategori) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Pasang kembali trigger pada tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Pulihkan akun yang terlanjur dibuat tanpa profil & kategori default (no-op jika tidak ada).
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.kategori (user_id, nama_kategori, warna_hex)
SELECT p.id, c.nama_kategori, c.warna_hex
FROM public.profiles p
CROSS JOIN (
  VALUES 
    ('Kuliah', '#EF4444'),
    ('Acara Kampus', '#F59E0B'),
    ('Tugas', '#3B82F6'),
    ('Downtime', '#22C55E')
) AS c(nama_kategori, warna_hex)
WHERE NOT EXISTS (SELECT 1 FROM public.kategori k WHERE k.user_id = p.id AND k.nama_kategori = c.nama_kategori);

-- ==============================================================================
-- Selesai! Jalankan seluruh skrip di atas melalui Supabase SQL Editor.
-- ==============================================================================
