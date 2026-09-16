import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Gagal menyelesaikan onboarding');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header & Step Indicator */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-indigo-600' : s < step ? 'w-4 bg-indigo-300' : 'w-4 bg-gray-200'}`}
              />
            ))}
          </div>
          <button 
            onClick={handleSkip}
            disabled={loading}
            className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Lewati
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Atur Periode Semester</h1>
                <p className="text-gray-500">Tentukan kapan semester kamu dimulai dan berakhir</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Tanggal Mulai Semester</label>
                    <input 
                      type="date"
                      value={semesterStart}
                      onChange={(e) => setSemesterStart(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Tanggal Selesai Semester</label>
                    <input 
                      type="date"
                      value={semesterEnd}
                      onChange={(e) => setSemesterEnd(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="bg-indigo-50 text-indigo-700 p-4 rounded-lg flex gap-3 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  <p>Matkul wajib akan berulang setiap minggu selama periode ini (maks. 16 minggu)</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {loading ? 'Menyimpan...' : 'Lanjut'}
                    {!loading && <span>&rarr;</span>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tambah Matkul Wajib</h1>
                <p className="text-gray-500">Masukkan jadwal kuliah rutinmu</p>
              </div>

              {/* Matkul List */}
              {matkulList.length > 0 ? (
                <div className="mb-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {matkulList.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-800">{m.judul}</h4>
                        <p className="text-sm text-gray-500">
                          {DAY_MAP[m.hari_mingguan]}, {m.jam_mulai.substring(0, 5)} - {m.jam_selesai.substring(0, 5)}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeMatkul(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-6 p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500">
                  Belum ada matkul yang ditambahkan
                </div>
              )}

              {/* Add Matkul Form */}
              <div className="mb-8">
                <button 
                  onClick={() => setShowMatkulForm(!showMatkulForm)}
                  className="flex items-center gap-2 text-indigo-600 font-medium mb-4 hover:text-indigo-800 transition-colors"
                >
                  {showMatkulForm ? '− Sembunyikan Form' : '+ Tambah Matkul Baru'}
                </button>
                
                {showMatkulForm && (
                  <form onSubmit={handleAddMatkul} className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Nama Mata Kuliah</label>
                        <input 
                          type="text"
                          value={newMatkul.judul}
                          onChange={(e) => setNewMatkul({...newMatkul, judul: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="Misal: Algoritma dan Pemrograman"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Hari</label>
                        <select 
                          value={newMatkul.hari_mingguan}
                          onChange={(e) => setNewMatkul({...newMatkul, hari_mingguan: Number(e.target.value)})}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                          {Object.entries(DAY_MAP).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">Jam Mulai</label>
                          <input 
                            type="time"
                            value={newMatkul.jam_mulai}
                            onChange={(e) => setNewMatkul({...newMatkul, jam_mulai: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">Jam Selesai</label>
                          <input 
                            type="time"
                            value={newMatkul.jam_selesai}
                            onChange={(e) => setNewMatkul({...newMatkul, jam_selesai: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-6 rounded-lg transition-colors text-sm"
                      >
                        + Tambah ke Daftar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                <button 
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
                >
                  &larr; Kembali
                </button>
                <button 
                  onClick={handleStep2Submit}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {loading ? 'Menyimpan...' : 'Lanjut'}
                  {!loading && <span>&rarr;</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎉</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Semua Siap!</h1>
              <p className="text-gray-500 mb-8">{matkulList.length} matkul wajib berhasil ditambahkan</p>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Ringkasan Setup:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg></div>
                    <div>
                      <p className="font-medium text-gray-800">Periode Semester</p>
                      <p className="text-sm text-gray-500">{semesterStart} s/d {semesterEnd}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg></div>
                    <div>
                      <p className="font-medium text-gray-800">Mata Kuliah Wajib</p>
                      <p className="text-sm text-gray-500">{matkulList.length} jadwal rutin tersimpan</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={handleStep3Submit}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
              >
                {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
                {!loading && <span>&rarr;</span>}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
