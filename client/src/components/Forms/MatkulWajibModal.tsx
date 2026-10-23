import React, { useState, useEffect } from 'react';
import { BookOpen, X, Plus } from 'lucide-react';
import type { KegiatanRutin, Kategori, Profile, ConflictDetail } from '../../lib/types';
import { getMatkulWajib, getProfile, createRutin, deleteRutin, updateRutin, updateProfile, ConflictError } from '../../lib/api';
import { ConflictModal } from '../Calendar/ConflictModal';

interface MatkulWajibModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  kategoriList: Kategori[];
}

const HARI_MAP: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu'
};

export const MatkulWajibModal: React.FC<MatkulWajibModalProps> = ({ isOpen, onClose, onSaved, kategoriList }) => {
  const [matkulList, setMatkulList] = useState<KegiatanRutin[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newMatkul, setNewMatkul] = useState({
    judul: '',
    hari_mingguan: 1,
    jam_mulai: '',
    jam_selesai: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    judul: '',
    hari_mingguan: 1,
    jam_mulai: '',
    jam_selesai: ''
  });

  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    conflicts: ConflictDetail[];
    onForceSave: () => void;
  }>({
    isOpen: false,
    conflicts: [],
    onForceSave: () => {}
  });

  const fetchData = async () => {
    try {
      const [matkul, prof] = await Promise.all([
        getMatkulWajib(),
        getProfile()
      ]);
      setMatkulList(matkul);
      setProfile(prof);
      if (prof) {
        setSemesterStart(prof.semester_start?.split('T')[0] || '');
        setSemesterEnd(prof.semester_end?.split('T')[0] || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  if (!isOpen) return null;

  const kuliahKategori = kategoriList.find(k => k.nama_kategori.toLowerCase() === 'kuliah' || k.nama_kategori.toLowerCase() === 'matkul');
  const kuliahKategoriId = kuliahKategori ? kuliahKategori.id : (kategoriList.length > 0 ? kategoriList[0].id : 0);

  const handleSaveSemester = async () => {
    if (semesterStart && semesterEnd && semesterEnd <= semesterStart) {
      alert('Tanggal selesai semester harus lebih akhir dari tanggal mulai');
      return;
    }
    try {
      await updateProfile({ semester_start: semesterStart, semester_end: semesterEnd });
      setIsEditingSemester(false);
      onSaved();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMatkul = async (force: boolean = false) => {
    if (newMatkul.jam_selesai <= newMatkul.jam_mulai) {
      alert('Jam selesai harus lebih akhir dari jam mulai');
      return;
    }
    const payload = {
      judul: newMatkul.judul,
      kategori_id: kuliahKategoriId,
      hari_mingguan: newMatkul.hari_mingguan,
      jam_mulai: newMatkul.jam_mulai + ':00',
      jam_selesai: newMatkul.jam_selesai + ':00',
      batas_minggu_berulang: 16,
      is_matkul_wajib: true
    };
    try {
      await createRutin(payload, force);
      setIsAdding(false);
      setNewMatkul({ judul: '', hari_mingguan: 1, jam_mulai: '', jam_selesai: '' });
      setConflictModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
      onSaved();
    } catch (e: any) {
      if (e instanceof ConflictError || e.name === 'ConflictError') {
        setConflictModal({
          isOpen: true,
          conflicts: e.conflicts || [],
          onForceSave: () => handleAddMatkul(true)
        });
      } else {
        console.error(e);
        alert(e.message || 'Gagal menambah matkul');
      }
    }
  };

  const handleUpdateMatkul = async (id: number, force: boolean = false) => {
    if (editForm.jam_selesai <= editForm.jam_mulai) {
      alert('Jam selesai harus lebih akhir dari jam mulai');
      return;
    }
    const payload = {
      judul: editForm.judul,
      kategori_id: kuliahKategoriId,
      hari_mingguan: editForm.hari_mingguan,
      jam_mulai: editForm.jam_mulai + (editForm.jam_mulai.length === 5 ? ':00' : ''),
      jam_selesai: editForm.jam_selesai + (editForm.jam_selesai.length === 5 ? ':00' : ''),
      batas_minggu_berulang: 16,
      is_matkul_wajib: true
    };
    try {
      await updateRutin(id, payload, force);
      setEditingId(null);
      setConflictModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
      onSaved();
    } catch (e: any) {
      if (e instanceof ConflictError || e.name === 'ConflictError') {
        setConflictModal({
          isOpen: true,
          conflicts: e.conflicts || [],
          onForceSave: () => handleUpdateMatkul(id, true)
        });
      } else {
        console.error(e);
        alert(e.message || 'Gagal mengubah matkul');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus matkul ini?')) {
      try {
        await deleteRutin(id);
        fetchData();
        onSaved();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const startEdit = (m: KegiatanRutin) => {
    setEditingId(m.id);
    setEditForm({
      judul: m.judul,
      hari_mingguan: m.hari_mingguan,
      jam_mulai: m.jam_mulai.slice(0, 5),
      jam_selesai: m.jam_selesai.slice(0, 5)
    });
  };

  const inputClass = "bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF]/20 dark:focus:ring-[#0A84FF]/20 outline-none transition-all";

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      data-testid="matkul-modal-backdrop"
    >
      <div 
        className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-[22px] apple-squircle shadow-2xl w-full max-w-2xl text-[#1D1D1F] dark:text-[#F5F5F7] my-8 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        data-testid="matkul-modal-card"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] sticky top-0 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl z-10">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
              <BookOpen className="w-4 h-4" />
            </span>
            Matkul Wajib
          </h2>
          <button 
            onClick={onClose} 
            data-testid="matkul-modal-close"
            aria-label="Tutup"
            className="text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93]">Periode Semester</h3>
              {!isEditingSemester && (
                <button onClick={() => setIsEditingSemester(true)} className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline cursor-pointer">
                  Edit Periode
                </button>
              )}
            </div>
            
            {isEditingSemester ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs text-[#6E6E73] dark:text-[#8E8E93] mb-1">Mulai</label>
                  <input type="date" value={semesterStart} onChange={e => setSemesterStart(e.target.value)} className={`w-full ${inputClass} tabular-nums`} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs text-[#6E6E73] dark:text-[#8E8E93] mb-1">Selesai</label>
                  <input type="date" value={semesterEnd} onChange={e => setSemesterEnd(e.target.value)} className={`w-full ${inputClass} tabular-nums`} />
                </div>
                <button onClick={handleSaveSemester} className="bg-[#007AFF] dark:bg-[#0A84FF] hover:bg-[#0062CC] dark:hover:bg-[#0070E0] text-white px-4 py-2 min-h-[38px] rounded-xl text-sm transition font-semibold cursor-pointer">
                  Simpan
                </button>
                <button onClick={() => setIsEditingSemester(false)} className="bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] text-[#1D1D1F] dark:text-[#F5F5F7] px-4 py-2 min-h-[38px] rounded-xl text-sm transition font-medium cursor-pointer">
                  Batal
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                {profile?.semester_start ? new Date(profile.semester_start).toLocaleDateString() : 'Belum diatur'} 
                {' – '}
                {profile?.semester_end ? new Date(profile.semester_end).toLocaleDateString() : 'Belum diatur'}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93]">Daftar Matkul</h3>
            {matkulList.length === 0 && <p className="text-[#8E8E93] text-sm py-2">Belum ada matkul wajib.</p>}
            
            {matkulList.map(m => (
              <div key={m.id} className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.06] rounded-2xl p-4">
                {editingId === m.id ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-4">
                      <input type="text" value={editForm.judul} onChange={e => setEditForm({...editForm, judul: e.target.value})} placeholder="Nama Matkul" className={`w-full ${inputClass}`} />
                    </div>
                    <select value={editForm.hari_mingguan} onChange={e => setEditForm({...editForm, hari_mingguan: parseInt(e.target.value)})} className={inputClass}>
                      {[1,2,3,4,5,6,7].map(h => <option key={h} value={h}>{HARI_MAP[h]}</option>)}
                    </select>
                    <input type="time" value={editForm.jam_mulai} onChange={e => setEditForm({...editForm, jam_mulai: e.target.value})} className={`${inputClass} tabular-nums`} />
                    <input type="time" value={editForm.jam_selesai} onChange={e => setEditForm({...editForm, jam_selesai: e.target.value})} className={`${inputClass} tabular-nums`} />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateMatkul(m.id, false)} className="flex-1 bg-[#34C759] hover:bg-[#2DB14E] text-white rounded-xl py-2 transition text-sm font-semibold cursor-pointer">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-[#1D1D1F] dark:text-[#F5F5F7] rounded-xl py-2 transition text-sm font-medium cursor-pointer">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h4 className="font-semibold text-base text-[#1D1D1F] dark:text-[#F5F5F7]">{m.judul}</h4>
                      <p className="text-[#6E6E73] dark:text-[#8E8E93] text-xs mt-0.5 tabular-nums">{HARI_MAP[m.hari_mingguan]} • {m.jam_mulai.slice(0,5)} - {m.jam_selesai.slice(0,5)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(m)} className="px-3 py-1.5 bg-white dark:bg-[#3A3A3C] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] rounded-xl text-xs font-medium transition cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] dark:text-[#FF453A] rounded-xl text-xs font-medium transition cursor-pointer">Hapus</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isAdding ? (
            <button onClick={() => setIsAdding(true)} className="w-full border border-dashed border-black/15 dark:border-white/15 text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/[0.04] dark:hover:bg-[#0A84FF]/[0.08] py-3.5 rounded-2xl transition font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Matkul Baru
            </button>
          ) : (
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.06] rounded-2xl p-4">
              <h4 className="text-sm font-semibold mb-3">Tambah Matkul Baru</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-4">
                  <input type="text" value={newMatkul.judul} onChange={e => setNewMatkul({...newMatkul, judul: e.target.value})} placeholder="Nama Matkul" className={`w-full ${inputClass}`} />
                </div>
                <select value={newMatkul.hari_mingguan} onChange={e => setNewMatkul({...newMatkul, hari_mingguan: parseInt(e.target.value)})} className={inputClass}>
                  {[1,2,3,4,5,6,7].map(h => <option key={h} value={h}>{HARI_MAP[h]}</option>)}
                </select>
                <input type="time" value={newMatkul.jam_mulai} onChange={e => setNewMatkul({...newMatkul, jam_mulai: e.target.value})} className={`${inputClass} tabular-nums`} />
                <input type="time" value={newMatkul.jam_selesai} onChange={e => setNewMatkul({...newMatkul, jam_selesai: e.target.value})} className={`${inputClass} tabular-nums`} />
                <div className="col-span-2 sm:col-span-4 flex gap-2.5 mt-2">
                  <button onClick={() => handleAddMatkul(false)} className="flex-1 bg-[#007AFF] dark:bg-[#0A84FF] hover:bg-[#0062CC] dark:hover:bg-[#0070E0] text-white rounded-xl py-2.5 text-sm transition font-semibold cursor-pointer">Simpan Matkul</button>
                  <button onClick={() => setIsAdding(false)} className="flex-1 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-[#1D1D1F] dark:text-[#F5F5F7] rounded-xl py-2.5 text-sm transition font-medium cursor-pointer">Batal</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {conflictModal.isOpen && (
        <ConflictModal
          isOpen={conflictModal.isOpen}
          conflicts={conflictModal.conflicts}
          onCancel={() => setConflictModal(prev => ({ ...prev, isOpen: false }))}
          onForceSave={conflictModal.onForceSave}
        />
      )}
    </div>
  );
};
