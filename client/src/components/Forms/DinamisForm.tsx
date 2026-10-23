import { useState, useEffect } from 'react';
import type { Kategori, KegiatanDinamis } from '../../lib/types';
import { createDinamis, updateDinamis, createKategori, deleteKegiatanDinamis } from '../../lib/api';
import { isPastDate } from '../../lib/utils';

interface DinamisFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  kategoriList: Kategori[];
  onKategoriAdded?: () => void;
  editData?: KegiatanDinamis | null;
  defaultStart?: string;
  defaultEnd?: string;
  setConflictState: (conflicts: any[], onForce: () => void) => void;
}

export const DinamisForm = ({ isOpen, onClose, onSaved, kategoriList, onKategoriAdded, editData, defaultStart, defaultEnd, setConflictState }: DinamisFormProps) => {
  const [formData, setFormData] = useState({
    judul: '',
    kategori_id: '',
    waktu_mulai: '',
    waktu_selesai: ''
  });

  const [isAddingKategori, setIsAddingKategori] = useState(false);
  const [newKategori, setNewKategori] = useState({ nama: '', warna: '#007AFF' });

  const toDatetimeLocal = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime.substring(0, 16);
  };

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          judul: editData.judul || '',
          kategori_id: (editData.kategori_id || '').toString(),
          waktu_mulai: toDatetimeLocal((editData as any).waktu_mulai || (editData as any).start || ''),
          waktu_selesai: toDatetimeLocal((editData as any).waktu_selesai || (editData as any).end || '')
        });
      } else {
        setFormData({
          judul: '',
          kategori_id: kategoriList[0]?.id.toString() || '',
          waktu_mulai: defaultStart ? toDatetimeLocal(defaultStart) : '',
          waktu_selesai: defaultEnd ? toDatetimeLocal(defaultEnd) : ''
        });
      }
    }
  }, [isOpen, editData, defaultStart, defaultEnd, kategoriList]);

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

  const handleKategoriChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'new') {
      setIsAddingKategori(true);
      setFormData({...formData, kategori_id: ''});
    } else {
      setFormData({...formData, kategori_id: e.target.value});
    }
  };

  const handleCreateKategori = async () => {
    if (!newKategori.nama) return;
    try {
      const created = await createKategori({
        nama_kategori: newKategori.nama,
        warna_hex: newKategori.warna
      });
      if (onKategoriAdded) await onKategoriAdded();
      setFormData({...formData, kategori_id: created.id.toString()});
      setIsAddingKategori(false);
      setNewKategori({ nama: '', warna: '#007AFF' });
    } catch (err: any) {
      alert('Gagal membuat kategori: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!formData.kategori_id) {
      alert('Pilih kategori terlebih dahulu');
      return;
    }
    
    const dateStr = formData.waktu_mulai.split('T')[0];
    if (!editData && isPastDate(dateStr)) {
      alert('Peringatan: Tidak bisa menambahkan jadwal ke hari yang sudah berlalu.');
      return;
    }

    if (new Date(formData.waktu_selesai).getTime() <= new Date(formData.waktu_mulai).getTime()) {
      alert('Waktu selesai harus lebih akhir dari waktu mulai');
      return;
    }

    const payload = {
      judul: formData.judul,
      kategori_id: parseInt(formData.kategori_id),
      waktu_mulai: new Date(formData.waktu_mulai).toISOString(),
      waktu_selesai: new Date(formData.waktu_selesai).toISOString()
    };

    try {
      if (editData) {
        await updateDinamis(editData.id, payload, force);
      } else {
        await createDinamis(payload as any, force);
      }
      onSaved();
      onClose();
    } catch (error: any) {
      if (error.name === 'ConflictError') {
        setConflictState(error.conflicts, () => handleSubmit(e, true));
      } else {
        console.error(error);
        alert(error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!editData) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      try {
        await deleteKegiatanDinamis(editData.id);
        onSaved();
        onClose();
      } catch (err: any) {
        alert('Gagal menghapus jadwal: ' + err.message);
      }
    }
  };

  const inputClass = "w-full bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF]/40 dark:focus:border-[#0A84FF]/40 rounded-xl px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF]/20 dark:focus:ring-[#0A84FF]/20 outline-none transition-all";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#8E8E93] mb-1.5";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-[22px] apple-squircle shadow-2xl max-w-md w-full p-6 text-[#1D1D1F] dark:text-[#F5F5F7] my-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight mb-5">{editData ? 'Edit Jadwal Dinamis' : 'Tambah Jadwal Dinamis'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Judul</label>
            <input required type="text" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} placeholder="Contoh: Rapat Organisasi" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kategori</label>
            {!isAddingKategori ? (
              <select required value={formData.kategori_id} onChange={handleKategoriChange} className={inputClass}>
                <option value="" disabled>Pilih Kategori...</option>
                {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                <option value="new" className="font-semibold text-[#007AFF] dark:text-[#0A84FF]">+ Tambah Kategori Baru</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input required autoFocus type="text" placeholder="Nama Kategori" value={newKategori.nama} onChange={e => setNewKategori({...newKategori, nama: e.target.value})} className={`flex-1 ${inputClass}`} />
                <input type="color" value={newKategori.warna} onChange={e => setNewKategori({...newKategori, warna: e.target.value})} className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0 shrink-0" title="Warna Kategori" />
                <button type="button" onClick={handleCreateKategori} className="bg-[#007AFF] dark:bg-[#0A84FF] px-3.5 min-h-[44px] rounded-xl text-sm hover:bg-[#0062CC] dark:hover:bg-[#0070E0] transition font-medium cursor-pointer text-white">Simpan</button>
                <button type="button" onClick={() => setIsAddingKategori(false)} className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 min-h-[44px] rounded-xl text-sm hover:bg-black/10 dark:hover:bg-white/10 transition font-medium cursor-pointer">Batal</button>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Tanggal & Jam Mulai</label>
            <input required type="datetime-local" value={formData.waktu_mulai} onChange={e => setFormData({...formData, waktu_mulai: e.target.value})} className={`${inputClass} tabular-nums`} />
          </div>
          <div>
            <label className={labelClass}>Tanggal & Jam Selesai</label>
            <input required type="datetime-local" value={formData.waktu_selesai} onChange={e => setFormData({...formData, waktu_selesai: e.target.value})} className={`${inputClass} tabular-nums`} />
          </div>
          <div className="flex justify-between items-center gap-3 mt-5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            {editData ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium bg-[#FF3B30] hover:bg-[#D70015] active:bg-[#B80012] text-white transition cursor-pointer flex items-center justify-center"
              >
                Hapus
              </button>
            ) : <div />}
            <div className="flex gap-2.5">
              <button type="button" onClick={onClose} className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-xl text-sm font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#1D1D1F] dark:text-[#F5F5F7] transition cursor-pointer flex items-center justify-center">Batal</button>
              <button type="submit" className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-xl text-sm font-semibold bg-[#007AFF] dark:bg-[#0A84FF] hover:bg-[#0062CC] dark:hover:bg-[#0070E0] text-white shadow-sm transition cursor-pointer flex items-center justify-center">Simpan</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
