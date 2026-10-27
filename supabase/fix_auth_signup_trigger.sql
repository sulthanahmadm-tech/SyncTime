-- ==============================================================================
-- MIGRASI SUPABASE: Perbaikan Trigger Registrasi Pengguna Baru (handle_new_user)
-- Masalah: Error "Database error saving new user" (500) saat pendaftaran/signup
-- Skrip ini menyamakan fungsi & trigger di database live dengan supabase/schema.sql.
-- ==============================================================================

-- 1. Bersihkan sisa versi lama skrip ini (no-op jika belum pernah dijalankan):
--    policy INSERT yang mengizinkan request anon, dan GRANT berlebih ke role auth.
--    Fungsi SECURITY DEFINER berjalan sebagai owner tabel, jadi keduanya tidak dibutuhkan.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
REVOKE ALL ON TABLE public.profiles, public.kategori FROM supabase_auth_admin;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM supabase_auth_admin;

-- 2. Fungsi handle_new_user:
--    - SET search_path = public: wajib untuk SECURITY DEFINER (Supabase linter)
--    - ON CONFLICT / IF NOT EXISTS: aman jika ada trigger duplikat lain di auth.users
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
  
  IF NOT EXISTS (SELECT 1 FROM public.kategori WHERE user_id = NEW.id) THEN
    INSERT INTO public.kategori (user_id, nama_kategori, warna_hex) VALUES
      (NEW.id, 'Kuliah', '#EF4444'),
      (NEW.id, 'Acara Kampus', '#F59E0B'),
      (NEW.id, 'Tugas', '#3B82F6'),
      (NEW.id, 'Downtime', '#22C55E');
  END IF;
  
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

-- 4. Pulihkan akun yang terlanjur dibuat tanpa profil (no-op jika tidak ada).
--    Kategori default akan dibuat otomatis oleh GET /api/kategori saat user login.
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- ==============================================================================
-- Selesai! Jalankan seluruh skrip di atas melalui Supabase SQL Editor.
-- ==============================================================================
