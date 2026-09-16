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
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        // After signup, redirect to onboarding
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-indigo-100 p-3 rounded-full mb-3">
              <Clock className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">SyncTime</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola waktumu dengan lebih baik 🚀</p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setIsLogin(true)}
            >
              Masuk
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setIsLogin(false)}
            >
              Daftar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="email@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Masuk' : 'Daftar'
              )}
            </button>
          </form>
        </div>
        <div className="bg-gray-50 py-4 text-center text-xs text-gray-500 border-t border-gray-100">
          Dengan {isLogin ? 'masuk' : 'mendaftar'}, kamu setuju dengan Syarat dan Ketentuan.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
