import { useState, useEffect } from 'react';
import { X, Moon, Sun, Settings, Clock, Tag, Trash2, Edit2, Plus } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { getAllRutin, getAllDinamis, getKategori, deleteKategori, deleteRutin, deleteDinamis, createKategori, updateKategori } from '../../lib/api';
import type { Kategori, KegiatanRutin, KegiatanDinamis } from '../../lib/types';
import { formatTime } from '../../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditRutin: (data: any) => void;
  onEditDinamis: (data: any) => void;
  onRefresh: () => void;
}

export const SettingsModal = ({ isOpen, onClose, onEditRutin, onEditDinamis, onRefresh }: SettingsModalProps) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'kategori' | 'rutin' | 'dinamis'>('general');
  
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [rutinList, setRutinList] = useState<KegiatanRutin[]>([]);
  const [dinamisList, setDinamisList] = useState<KegiatanDinamis[]>([]);
  const [loading, setLoading] = useState(false);

  // Kategori Form State
  const [editingKat, setEditingKat] = useState<Kategori | null>(null);
  const [katName, setKatName] = useState('');
  const [katColor, setKatColor] = useState('#10b981');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kat, rut, din] = await Promise.all([
        getKategori(),
        getAllRutin(),
        getAllDinamis()
      ]);
      setKategoriList(kat);
      setRutinList(rut);
      setDinamisList(din);
    } catch (error) {
      console.error('Failed to fetch settings data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKat) {
        await updateKategori(editingKat.id, { nama_kategori: katName, warna_hex: katColor });
      } else {
        await createKategori({ nama_kategori: katName, warna_hex: katColor });
      }
      setEditingKat(null);
      setKatName('');
      setKatColor('#10b981');
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteKat = async (id: number) => {
    if (!confirm('Hapus kategori ini? Semua jadwal yang menggunakan kategori ini akan ikut terhapus!')) return;
    try {
      await deleteKategori(id);
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRutin = async (id: number) => {
    if (!confirm('Hapus jadwal rutin ini?')) return;
    try {
      await deleteRutin(id);
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteDinamis = async (id: number) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await deleteDinamis(id);
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors duration-200">
        
        {/* Sidebar Tabs */}
        <div className="w-64 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2 shrink-0 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 px-2 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Settings
          </h2>
          
          <button onClick={() => setActiveTab('general')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'general' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
            <Settings className="w-4 h-4" /> General
          </button>
          
          <button onClick={() => setActiveTab('kategori')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'kategori' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
            <Tag className="w-4 h-4" /> Kategori
          </button>
          
          <button onClick={() => setActiveTab('rutin')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'rutin' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
            <Clock className="w-4 h-4" /> Jadwal Rutin
          </button>

          <button onClick={() => setActiveTab('dinamis')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'dinamis' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
            <Clock className="w-4 h-4" /> Jadwal Dinamis
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{activeTab} Settings</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 relative">
            {loading && <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">Loading...</div>}
            
            {activeTab === 'general' && (
              <div className="max-w-xl">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Appearance</h4>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Theme Preference</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred lighting</p>
                  </div>
                  
                  <div className="flex bg-gray-200 dark:bg-gray-950 p-1 rounded-lg">
                    <button onClick={() => setTheme('light')} className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                      <Sun className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-gray-800 shadow-sm text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'kategori' && (
              <div className="max-w-3xl flex flex-col gap-6">
                <form onSubmit={handleSaveKategori} className="flex gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Kategori</label>
                    <input type="text" required value={katName} onChange={e => setKatName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-emerald-500" placeholder="Contoh: Kuliah" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warna</label>
                    <input type="color" value={katColor} onChange={e => setKatColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center gap-2">
                    {editingKat ? <><Edit2 className="w-4 h-4"/> Update</> : <><Plus className="w-4 h-4"/> Tambah</>}
                  </button>
                  {editingKat && (
                    <button type="button" onClick={() => {setEditingKat(null); setKatName(''); setKatColor('#10b981');}} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-medium transition">
                      Batal
                    </button>
                  )}
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kategoriList.map(k => (
                    <div key={k.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: k.warna_hex }}></span>
                        <span className="font-medium text-gray-900 dark:text-white">{k.nama_kategori}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingKat(k); setKatName(k.nama_kategori); setKatColor(k.warna_hex); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteKat(k.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'rutin' && (
              <div className="max-w-4xl flex flex-col gap-4">
                {rutinList.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 hover:border-emerald-500 transition">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{r.judul}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Setiap {HARI[r.hari_mingguan === 7 ? 0 : r.hari_mingguan]} • {r.jam_mulai.substring(0, 5)} - {r.jam_selesai.substring(0, 5)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { onClose(); onEditRutin(r); }} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">Edit</button>
                      <button onClick={() => handleDeleteRutin(r.id)} className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition">Hapus</button>
                    </div>
                  </div>
                ))}
                {rutinList.length === 0 && <p className="text-gray-500 text-center py-8">Belum ada jadwal rutin</p>}
              </div>
            )}

            {activeTab === 'dinamis' && (
              <div className="max-w-4xl flex flex-col gap-4">
                {dinamisList.map(d => {
                  const start = new Date(d.waktu_mulai);
                  const end = new Date(d.waktu_selesai);
                  return (
                    <div key={d.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 hover:border-emerald-500 transition">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {d.judul} {d.is_completed && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Selesai</span>}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} • {formatTime(d.waktu_mulai)} - {formatTime(d.waktu_selesai)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { onClose(); onEditDinamis(d); }} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">Edit</button>
                        <button onClick={() => handleDeleteDinamis(d.id)} className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition">Hapus</button>
                      </div>
                    </div>
                  )
                })}
                {dinamisList.length === 0 && <p className="text-gray-500 text-center py-8">Belum ada jadwal dinamis</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
