import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock } from 'lucide-react';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        // Check if onboarding is completed
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Use fetch with auth header to check profile
          const res = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          
          if (res.ok) {
            const profile = await res.json();
            if (!profile.onboarding_completed) {
              navigate('/onboarding');
            } else {
              navigate('/dashboard');
            }
          } else {
             // Fallback if profile fails
             navigate('/dashboard');
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        // Inform student that account is created and onboarding is required
        setInfoMessage('Akun kamu berhasil dibuat! Mengarahkan ke halaman onboarding untuk melengkapi data semester dan jadwal kuliah...');
        setTimeout(() => {
          navigate('/onboarding');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-black p-4 sm:p-6 text-[#1D1D1F] dark:text-[#F5F5F7] relative overflow-hidden">
      {/* Subtle ambient illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60 dark:opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 122, 255, 0.10) 0%, transparent 60%)'
        }}
      />

      <div
        className="relative bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl backdrop-saturate-150 w-full max-w-[400px] rounded-[24px] border border-black/[0.08] dark:border-white/[0.10] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.65)] overflow-hidden"
        style={{
          borderRadius: '24px',
          WebkitBorderRadius: '24px',
        }}
      >
        <div className="p-7 sm:p-8">
          <div className="flex flex-col items-center justify-center mb-7 text-center">
            <div className="w-14 h-14 bg-[#007AFF] dark:bg-[#0A84FF] rounded-[16px] shadow-[0_6px_16px_rgba(0,122,255,0.28)] flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-white stroke-[2]" />
            </div>
            <h1 className="text-[26px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white leading-tight">SyncTime</h1>
            <p className="text-[#6E6E73] dark:text-[#98989D] text-[13px] mt-1">
              Kalender akademik & manajemen waktu mahasiswa
            </p>
          </div>

          {/* iOS Segmented Control */}
          <div className="flex mb-6 bg-[#E5E5EA]/80 dark:bg-[#2C2C2E] rounded-[11px] p-1 border border-black/[0.03] dark:border-white/[0.04]">
            <button
              type="button"
              className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer ${
                isLogin
                  ? 'bg-white dark:bg-[#3A3A3C] shadow-[0_1px_3px_rgba(0,0,0,0.12)] text-[#1D1D1F] dark:text-white'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
              onClick={() => { setIsLogin(true); setError(''); setInfoMessage(''); }}
            >
              Masuk
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-white dark:bg-[#3A3A3C] shadow-[0_1px_3px_rgba(0,0,0,0.12)] text-[#1D1D1F] dark:text-white'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
              onClick={() => { setIsLogin(false); setError(''); setInfoMessage(''); }}
            >
              Daftar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-[#FF3B30]/10 text-[#D70015] dark:text-[#FF453A] text-xs font-medium rounded-[12px] border border-[#FF3B30]/20">
              {error}
            </div>
          )}

          {infoMessage && (
            <div
              data-testid="registration-info-banner"
              className="mb-4 p-3.5 bg-[#34C759]/10 dark:bg-[#30D158]/15 text-[#248A3D] dark:text-[#30D158] text-xs font-medium rounded-[12px] border border-[#34C759]/25 dark:border-[#30D158]/30"
            >
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D] mb-1.5">Email Kampus</label>
              <input
                type="email"
                required
                className="w-full px-3.5 py-2.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] rounded-[12px] text-[15px] text-[#1D1D1F] dark:text-white placeholder:text-[#8E8E93] focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] dark:focus:border-[#0A84FF] outline-none transition-all"
                placeholder="email@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D] mb-1.5">Kata Sandi</label>
              <input
                type="password"
                required
                className="w-full px-3.5 py-2.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] rounded-[12px] text-[15px] text-[#1D1D1F] dark:text-white placeholder:text-[#8E8E93] focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] dark:focus:border-[#0A84FF] outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 bg-[#007AFF] hover:bg-[#0062CC] dark:bg-[#0A84FF] dark:hover:bg-[#0070E0] active:scale-[0.99] text-white rounded-[12px] text-[15px] font-semibold shadow-xs transition-all disabled:opacity-60 flex items-center justify-center mt-6 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Masuk' : 'Daftar'
              )}
            </button>
          </form>
        </div>
        <div className="bg-[#F2F2F7]/70 dark:bg-[#2C2C2E]/50 py-3.5 px-6 text-center text-[11px] text-[#6E6E73] dark:text-[#98989D] border-t border-black/[0.06] dark:border-white/[0.08]">
          Dengan {isLogin ? 'masuk' : 'mendaftar'}, kamu menyetujui Ketentuan Layanan SyncTime.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

