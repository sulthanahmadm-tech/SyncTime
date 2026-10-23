import { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Settings, Clock, Tag, Trash2, Edit2, Plus } from 'lucide-react';
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
  const [katColor, setKatColor] = useState('#007AFF');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
      setKatColor('#007AFF');
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
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
      data-testid="settings-modal-backdrop"
    >
      <div 
        className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-[22px] apple-squircle shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col md:flex-row overflow-hidden border border-black/[0.08] dark:border-white/[0.12] transition-colors duration-200"
        onClick={e => e.stopPropagation()}
        data-testid="settings-modal-card"
      >
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-[#F5F5F7]/90 dark:bg-[#151517]/90 border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.08] p-3 md:p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 transition-colors duration-200">
          <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 md:mb-5 px-2.5 flex items-center gap-2 shrink-0">
            <Settings className="w-5 h-5 text-[#007AFF] dark:text-[#0A84FF]" /> Settings
          </h2>
          
          <button onClick={() => setActiveTab('general')} className={`flex items-center gap-3 px-3.5 py-2 md:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'general' ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs' : 'text-[#1D1D1F] hover:bg-black/[0.05] dark:text-[#EBEBF5] dark:hover:bg-white/[0.06]'}`}>
            <Settings className="w-4 h-4" /> General
          </button>
          
          <button onClick={() => setActiveTab('kategori')} className={`flex items-center gap-3 px-3.5 py-2 md:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'kategori' ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs' : 'text-[#1D1D1F] hover:bg-black/[0.05] dark:text-[#EBEBF5] dark:hover:bg-white/[0.06]'}`}>
            <Tag className="w-4 h-4" /> Kategori
          </button>
          
          <button onClick={() => setActiveTab('rutin')} className={`flex items-center gap-3 px-3.5 py-2 md:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'rutin' ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs' : 'text-[#1D1D1F] hover:bg-black/[0.05] dark:text-[#EBEBF5] dark:hover:bg-white/[0.06]'}`}>
            <Clock className="w-4 h-4" /> Jadwal Rutin
          </button>

          <button onClick={() => setActiveTab('dinamis')} className={`flex items-center gap-3 px-3.5 py-2 md:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'dinamis' ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs' : 'text-[#1D1D1F] hover:bg-black/[0.05] dark:text-[#EBEBF5] dark:hover:bg-white/[0.06]'}`}>
            <Clock className="w-4 h-4" /> Jadwal Dinamis
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1C1C1E] transition-colors duration-200">
          <div className="h-14 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between px-6 shrink-0">
            <h3 className="text-base font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] capitalize">{activeTab} Settings</h3>
            <button onClick={onClose} className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-[#F5F5F7] rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 relative">
            {loading && <div className="absolute inset-0 bg-white/50 dark:bg-[#1C1C1E]/50 flex items-center justify-center z-10 text-sm text-[#6E6E73]">Loading...</div>}
            
            {activeTab === 'general' && (
              <div className="max-w-xl">
                <h4 className="text-xs font-semibold text-[#6E6E73] dark:text-[#8E8E93] mb-3 uppercase tracking-wider">Appearance</h4>
                
                <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <p className="font-medium text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">Theme Preference</p>
                    <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-0.5">Choose your preferred lighting</p>
                  </div>
                  
                  <div className="flex bg-black/[0.06] dark:bg-black/40 p-1 rounded-xl gap-1">
                    <button onClick={() => setTheme('light')} className={`p-2 rounded-lg transition-all cursor-pointer ${theme === 'light' ? 'bg-white shadow-xs text-[#007AFF]' : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-[#F5F5F7]'}`} title="Light">
                      <Sun className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-2 rounded-lg transition-all cursor-pointer ${theme === 'dark' ? 'bg-[#3A3A3C] shadow-xs text-[#0A84FF]' : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-[#F5F5F7]'}`} title="Dark">
                      <Moon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTheme('system')} className={`p-2 rounded-lg transition-all cursor-pointer ${theme === 'system' ? 'bg-white dark:bg-[#3A3A3C] shadow-xs text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-[#F5F5F7]'}`} title="System">
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'kategori' && (
              <div className="max-w-3xl flex flex-col gap-6">
                <form onSubmit={handleSaveKategori} className="flex flex-wrap gap-3 items-end bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93] mb-1.5">Nama Kategori</label>
                    <input type="text" required value={katName} onChange={e => setKatName(e.target.value)} className="w-full px-3.5 py-2 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF]/20 outline-none" placeholder="Contoh: Kuliah" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93] mb-1.5">Warna</label>
                    <input type="color" value={katColor} onChange={e => setKatColor(e.target.value)} className="h-9 w-12 rounded-lg cursor-pointer border-0 bg-transparent" />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#007AFF] dark:bg-[#0A84FF] hover:bg-[#0062CC] dark:hover:bg-[#0070E0] text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer">
                    {editingKat ? <><Edit2 className="w-4 h-4"/> Update</> : <><Plus className="w-4 h-4"/> Tambah</>}
                  </button>
                  {editingKat && (
                    <button type="button" onClick={() => {setEditingKat(null); setKatName(''); setKatColor('#007AFF');}} className="px-4 py-2 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-[#1D1D1F] dark:text-[#F5F5F7] rounded-xl text-sm font-medium transition cursor-pointer">
                      Batal
                    </button>
                  )}
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kategoriList.map(k => (
                    <div key={k.id} className="flex items-center justify-between p-3.5 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/60">
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: k.warna_hex }}></span>
                        <span className="font-medium text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{k.nama_kategori}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditingKat(k); setKatName(k.nama_kategori); setKatColor(k.warna_hex); }} className="p-1.5 text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/10 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteKat(k.id)} className="p-1.5 text-[#FF3B30] dark:text-[#FF453A] hover:bg-[#FF3B30]/10 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'rutin' && (
              <div className="max-w-4xl flex flex-col gap-3">
                {rutinList.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/60 hover:border-[#007AFF]/40 transition">
                    <div>
                      <h4 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{r.judul}</h4>
                      <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-0.5 tabular-nums">Setiap {HARI[r.hari_mingguan === 7 ? 0 : r.hari_mingguan]} • {r.jam_mulai.substring(0, 5)} - {r.jam_selesai.substring(0, 5)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { onClose(); onEditRutin(r); }} className="px-3 py-1.5 text-xs bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] rounded-xl font-medium hover:bg-[#007AFF]/20 transition cursor-pointer">Edit</button>
                      <button onClick={() => handleDeleteRutin(r.id)} className="px-3 py-1.5 text-xs bg-[#FF3B30]/10 text-[#FF3B30] dark:text-[#FF453A] rounded-xl font-medium hover:bg-[#FF3B30]/20 transition cursor-pointer">Hapus</button>
                    </div>
                  </div>
                ))}
                {rutinList.length === 0 && <p className="text-[#8E8E93] text-sm text-center py-8">Belum ada jadwal rutin</p>}
              </div>
            )}

            {activeTab === 'dinamis' && (
              <div className="max-w-4xl flex flex-col gap-3">
                {dinamisList.map(d => {
                  const start = new Date(d.waktu_mulai);
                  return (
                    <div key={d.id} className="flex items-center justify-between p-4 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/60 hover:border-[#007AFF]/40 transition">
                      <div>
                        <h4 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                          {d.judul} {d.is_completed && <span className="bg-[#34C759]/15 text-[#34C759] text-[11px] px-2 py-0.5 rounded-full font-medium">Selesai</span>}
                        </h4>
                        <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-0.5 tabular-nums">
                          {start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} • {formatTime(d.waktu_mulai)} - {formatTime(d.waktu_selesai)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { onClose(); onEditDinamis(d); }} className="px-3 py-1.5 text-xs bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] rounded-xl font-medium hover:bg-[#007AFF]/20 transition cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteDinamis(d.id)} className="px-3 py-1.5 text-xs bg-[#FF3B30]/10 text-[#FF3B30] dark:text-[#FF453A] rounded-xl font-medium hover:bg-[#FF3B30]/20 transition cursor-pointer">Hapus</button>
                      </div>
                    </div>
                  )
                })}
                {dinamisList.length === 0 && <p className="text-[#8E8E93] text-sm text-center py-8">Belum ada jadwal dinamis</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
