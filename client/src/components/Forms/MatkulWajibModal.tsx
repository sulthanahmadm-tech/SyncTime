import React, { useState, useEffect } from 'react';
import type { KegiatanRutin, Kategori, Profile } from '../../lib/types';
import { getMatkulWajib, getProfile, createRutin, deleteRutin, updateRutin, updateProfile } from '../../lib/api';

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
    try {
      await updateProfile({ semester_start: semesterStart, semester_end: semesterEnd });
      setIsEditingSemester(false);
      onSaved();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMatkul = async () => {
    try {
      await createRutin({
        judul: newMatkul.judul,
        kategori_id: kuliahKategoriId,
        hari_mingguan: newMatkul.hari_mingguan,
        jam_mulai: newMatkul.jam_mulai + ':00',
        jam_selesai: newMatkul.jam_selesai + ':00',
        batas_minggu_berulang: 16,
        is_matkul_wajib: true
      });
      setIsAdding(false);
      setNewMatkul({ judul: '', hari_mingguan: 1, jam_mulai: '', jam_selesai: '' });
      fetchData();
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Gagal menambah matkul');
    }
  };

  const handleUpdateMatkul = async (id: number) => {
    try {
      await updateRutin(id, {
        judul: editForm.judul,
        kategori_id: kuliahKategoriId,
        hari_mingguan: editForm.hari_mingguan,
        jam_mulai: editForm.jam_mulai + (editForm.jam_mulai.length === 5 ? ':00' : ''),
        jam_selesai: editForm.jam_selesai + (editForm.jam_selesai.length === 5 ? ':00' : ''),
        batas_minggu_berulang: 16,
        is_matkul_wajib: true
      });
      setEditingId(null);
      fetchData();
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah matkul');
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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      data-testid="matkul-modal-backdrop"
    >
      <div 
        className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl text-white my-8 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        data-testid="matkul-modal-card"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📚 Matkul Wajib
          </h2>
          <button 
            onClick={onClose} 
            data-testid="matkul-modal-close"
            aria-label="Tutup"
            className="text-gray-400 hover:text-white transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-8 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-200">Periode Semester</h3>
              {!isEditingSemester && (
                <button onClick={() => setIsEditingSemester(true)} className="text-sm text-indigo-400 hover:text-indigo-300">
                  Edit Periode
                </button>
              )}
            </div>
            
            {isEditingSemester ? (
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Mulai</label>
                  <input type="date" value={semesterStart} onChange={e => setSemesterStart(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Selesai</label>
                  <input type="date" value={semesterEnd} onChange={e => setSemesterEnd(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
                </div>
                <button onClick={handleSaveSemester} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition">
                  Simpan
                </button>
                <button onClick={() => setIsEditingSemester(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                  Batal
                </button>
              </div>
            ) : (
              <p className="text-gray-300">
                {profile?.semester_start ? new Date(profile.semester_start).toLocaleDateString() : 'Belum diatur'} 
                {' - '}
                {profile?.semester_end ? new Date(profile.semester_end).toLocaleDateString() : 'Belum diatur'}
              </p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-gray-200">Daftar Matkul</h3>
            {matkulList.length === 0 && <p className="text-gray-500 text-sm">Belum ada matkul wajib.</p>}
            
            {matkulList.map(m => (
              <div key={m.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                {editingId === m.id ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-4">
                      <input type="text" value={editForm.judul} onChange={e => setEditForm({...editForm, judul: e.target.value})} placeholder="Nama Matkul" className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
                    </div>
                    <select value={editForm.hari_mingguan} onChange={e => setEditForm({...editForm, hari_mingguan: parseInt(e.target.value)})} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white">
                      {[1,2,3,4,5,6,7].map(h => <option key={h} value={h}>{HARI_MAP[h]}</option>)}
                    </select>
                    <input type="time" value={editForm.jam_mulai} onChange={e => setEditForm({...editForm, jam_mulai: e.target.value})} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
                    <input type="time" value={editForm.jam_selesai} onChange={e => setEditForm({...editForm, jam_selesai: e.target.value})} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateMatkul(m.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded py-2 transition text-sm">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2 transition text-sm">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-lg">{m.judul}</h4>
                      <p className="text-gray-400 text-sm">{HARI_MAP[m.hari_mingguan]} • {m.jam_mulai.slice(0,5)} - {m.jam_selesai.slice(0,5)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(m)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">Edit</button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded text-sm transition">Hapus</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isAdding ? (
            <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 py-4 rounded-lg transition font-medium">
              + Tambah Matkul Baru
            </button>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-3">Tambah Matkul Baru</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-4">
                  <input type="text" value={newMatkul.judul} onChange={e => setNewMatkul({...newMatkul, judul: e.target.value})} placeholder="Nama Matkul" className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
                </div>
                <select value={newMatkul.hari_mingguan} onChange={e => setNewMatkul({...newMatkul, hari_mingguan: parseInt(e.target.value)})} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white">
                  {[1,2,3,4,5,6,7].map(h => <option key={h} value={h}>{HARI_MAP[h]}</option>)}
                </select>
                <input type="time" value={newMatkul.jam_mulai} onChange={e => setNewMatkul({...newMatkul, jam_mulai: e.target.value})} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
                <input type="time" value={newMatkul.jam_selesai} onChange={e => setNewMatkul({...newMatkul, jam_selesai: e.target.value})} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
                <div className="col-span-2 sm:col-span-4 flex gap-3 mt-2">
                  <button onClick={handleAddMatkul} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 transition font-medium">Simpan Matkul</button>
                  <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2 transition font-medium">Batal</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
