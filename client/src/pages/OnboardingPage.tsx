import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, CheckCircle2, Trash2, Plus, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { setSemester, addMatkulBulk, completeOnboarding } from '../lib/api';

const DAY_MAP: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu'
};

interface MatkulItem {
  judul: string;
  hari_mingguan: number;
  jam_mulai: string;
  jam_selesai: string;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State
  const [semesterStart, setSemesterStart] = useState<string>('');
  const [semesterEnd, setSemesterEnd] = useState<string>('');

  // Step 2 State
  const [matkulList, setMatkulList] = useState<MatkulItem[]>([]);
  const [showMatkulForm, setShowMatkulForm] = useState<boolean>(true);
  const [newMatkul, setNewMatkul] = useState({
    judul: '',
    hari_mingguan: 1,
    jam_mulai: '',
    jam_selesai: ''
  });

  const handleSkip = async () => {
    try {
      setLoading(true);
      await completeOnboarding();
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Gagal melewati onboarding');
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterStart || !semesterEnd) {
      setError('Harap isi kedua tanggal');
      return;
    }
    if (semesterEnd <= semesterStart) {
      setError('Tanggal selesai semester harus lebih akhir dari tanggal mulai');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await setSemester({ semester_start: semesterStart, semester_end: semesterEnd });
      setStep(2);
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan periode semester');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMatkul = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatkul.judul || !newMatkul.jam_mulai || !newMatkul.jam_selesai) {
      setError('Harap isi nama matkul dan jam');
      return;
    }
    if (newMatkul.jam_selesai <= newMatkul.jam_mulai) {
      setError('Jam selesai harus lebih akhir dari jam mulai');
      return;
    }
    
    // Convert HH:MM to HH:MM:SS
    const jam_mulai = newMatkul.jam_mulai.length === 5 ? `${newMatkul.jam_mulai}:00` : newMatkul.jam_mulai;
    const jam_selesai = newMatkul.jam_selesai.length === 5 ? `${newMatkul.jam_selesai}:00` : newMatkul.jam_selesai;
    
    setMatkulList([
      ...matkulList, 
      {
        ...newMatkul,
        jam_mulai,
        jam_selesai,
        hari_mingguan: Number(newMatkul.hari_mingguan)
      }
    ]);
    
    // Reset form
    setNewMatkul({
      judul: '',
      hari_mingguan: 1,
      jam_mulai: '',
      jam_selesai: ''
    });
    setError(null);
  };

  const removeMatkul = (index: number) => {
    setMatkulList(matkulList.filter((_, i) => i !== index));
  };

  const handleStep2Submit = async () => {
    try {
      setLoading(true);
      setError(null);
      if (matkulList.length > 0) {
        await addMatkulBulk(matkulList);
      }
      setStep(3);
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    try {
      setLoading(true);
      setError(null);
      await completeOnboarding();
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Gagal menyelesaikan onboarding');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] text-[15px] text-[#1D1D1F] dark:text-white focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] dark:focus:border-[#0A84FF] outline-none transition-all';

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60 dark:opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 122, 255, 0.10) 0%, transparent 65%)'
        }}
      />

      <div
        className="relative bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl backdrop-saturate-150 border border-black/[0.08] dark:border-white/[0.10] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.65)] rounded-[24px] w-full max-w-xl overflow-hidden flex flex-col transition-all duration-300"
        style={{
          borderRadius: '24px',
          WebkitBorderRadius: '24px',
        }}
      >
        {/* Header & Step Indicator */}
        <div className="px-6 sm:px-8 py-5 border-b border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center bg-white/60 dark:bg-[#1C1C1E]/60">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-[#007AFF] dark:bg-[#0A84FF]'
                    : s < step
                      ? 'w-3 bg-[#007AFF]/40 dark:bg-[#0A84FF]/40'
                      : 'w-3 bg-black/10 dark:bg-white/15'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-medium text-[#6E6E73] dark:text-[#98989D] tabular-nums">
              Langkah {step} dari 3
            </span>
          </div>
          <button 
            onClick={handleSkip}
            disabled={loading}
            className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:opacity-80 transition-opacity cursor-pointer"
          >
            Lewati
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#D70015] dark:text-[#FF453A] rounded-[12px] text-xs font-medium">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-7 text-center">
                <div className="w-12 h-12 rounded-[14px] bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center mx-auto mb-3.5">
                  <Calendar className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mb-1.5">Atur Periode Semester</h1>
                <p className="text-sm text-[#6E6E73] dark:text-[#98989D]">Tentukan rentang tanggal mulai dan berakhirnya semester ini</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">Tanggal Mulai Semester</label>
                    <input 
                      type="date"
                      value={semesterStart}
                      onChange={(e) => setSemesterStart(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">Tanggal Selesai Semester</label>
                    <input 
                      type="date"
                      value={semesterEnd}
                      onChange={(e) => setSemesterEnd(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                      required
                    />
                  </div>
                </div>

                <div className="bg-[#007AFF]/[0.08] dark:bg-[#0A84FF]/[0.12] text-[#0062CC] dark:text-[#64D2FF] p-3.5 rounded-[12px] flex items-start gap-3 text-xs leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Jadwal mata kuliah wajib akan diulang otomatis setiap minggu selama periode semester ini.</p>
                </div>

                <div className="pt-3 flex justify-end">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] bg-[#007AFF] hover:bg-[#0062CC] dark:bg-[#0A84FF] dark:hover:bg-[#0070E0] text-white font-semibold text-sm py-2.5 px-6 rounded-[12px] transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <span>{loading ? 'Menyimpan...' : 'Lanjut'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-[14px] bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center mx-auto mb-3.5">
                  <BookOpen className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mb-1.5">Tambah Matkul Wajib</h1>
                <p className="text-sm text-[#6E6E73] dark:text-[#98989D]">Masukkan jadwal perkuliahan mingguanmu</p>
              </div>

              {/* Matkul List */}
              {matkulList.length > 0 ? (
                <div className="mb-5 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {matkulList.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.06] rounded-[14px]">
                      <div>
                        <h4 className="font-semibold text-sm text-[#1D1D1F] dark:text-white">{m.judul}</h4>
                        <p className="text-xs text-[#6E6E73] dark:text-[#98989D] tabular-nums mt-0.5">
                          {DAY_MAP[m.hari_mingguan]} • {m.jam_mulai.substring(0, 5)} – {m.jam_selesai.substring(0, 5)}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeMatkul(idx)}
                        className="p-2 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-5 p-6 text-center bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/40 border border-dashed border-black/15 dark:border-white/15 rounded-[14px] text-xs text-[#6E6E73] dark:text-[#98989D]">
                  Belum ada mata kuliah yang ditambahkan
                </div>
              )}

              {/* Add Matkul Form */}
              <div className="mb-6">
                <button 
                  type="button"
                  onClick={() => setShowMatkulForm(!showMatkulForm)}
                  className="flex items-center gap-1.5 text-xs text-[#007AFF] dark:text-[#0A84FF] font-semibold mb-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {showMatkulForm ? '− Sembunyikan Form' : '+ Tambah Matkul Baru'}
                </button>
                
                {showMatkulForm && (
                  <form onSubmit={handleAddMatkul} className="bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/40 p-4 rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">Nama Mata Kuliah</label>
                        <input 
                          type="text"
                          value={newMatkul.judul}
                          onChange={(e) => setNewMatkul({...newMatkul, judul: e.target.value})}
                          className={inputClass}
                          placeholder="Misal: Algoritma dan Pemrograman"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">Hari</label>
                        <select 
                          value={newMatkul.hari_mingguan}
                          onChange={(e) => setNewMatkul({...newMatkul, hari_mingguan: Number(e.target.value)})}
                          className={inputClass}
                        >
                          {Object.entries(DAY_MAP).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">Jam Mulai</label>
                          <input 
                            type="time"
                            value={newMatkul.jam_mulai}
                            onChange={(e) => setNewMatkul({...newMatkul, jam_mulai: e.target.value})}
                            className={`${inputClass} tabular-nums px-2.5`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">Jam Selesai</label>
                          <input 
                            type="time"
                            value={newMatkul.jam_selesai}
                            onChange={(e) => setNewMatkul({...newMatkul, jam_selesai: e.target.value})}
                            className={`${inputClass} tabular-nums px-2.5`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button 
                        type="submit"
                        className="bg-[#007AFF]/12 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/20 font-semibold py-2 px-4 rounded-[10px] transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah ke Daftar</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-black/[0.06] dark:border-white/[0.08]">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white font-medium px-3 py-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button 
                  type="button"
                  onClick={handleStep2Submit}
                  disabled={loading}
                  className="min-h-[44px] bg-[#007AFF] hover:bg-[#0062CC] dark:bg-[#0A84FF] dark:hover:bg-[#0070E0] text-white font-semibold text-sm py-2.5 px-6 rounded-[12px] transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Menyimpan...' : 'Lanjut'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
              <div className="w-16 h-16 bg-[#34C759]/15 dark:bg-[#30D158]/20 text-[#248A3D] dark:text-[#30D158] rounded-[20px] flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-9 h-9 stroke-[2]" />
              </div>
              
              <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mb-1.5">Semua Siap</h1>
              <p className="text-sm text-[#6E6E73] dark:text-[#98989D] mb-6">{matkulList.length} mata kuliah wajib berhasil dijadwalkan</p>
              
              <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-[16px] p-5 mb-7 text-left border border-black/[0.05] dark:border-white/[0.06]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D] mb-3.5">Ringkasan Konfigurasi</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#007AFF]/15 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Periode Semester</p>
                      <p className="text-xs text-[#6E6E73] dark:text-[#98989D] tabular-nums">{semesterStart} s/d {semesterEnd}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#007AFF]/15 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Mata Kuliah Wajib</p>
                      <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">{matkulList.length} jadwal rutin tersimpan</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={handleStep3Submit}
                disabled={loading}
                className="w-full min-h-[46px] bg-[#007AFF] hover:bg-[#0062CC] dark:bg-[#0A84FF] dark:hover:bg-[#0070E0] text-white font-semibold text-[15px] py-3 px-6 rounded-[12px] transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Memproses...' : 'Buka Kalender SyncTime'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

