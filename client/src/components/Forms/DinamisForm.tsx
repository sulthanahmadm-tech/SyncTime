import { useState, useEffect } from 'react';
import type { Kategori, KegiatanDinamis } from '../../lib/types';
import { createDinamis, updateDinamis, createKategori } from '../../lib/api';
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
  const [newKategori, setNewKategori] = useState({ nama: '', warna: '#4F46E5' });

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
          judul: editData.judul,
          kategori_id: editData.kategori_id.toString(),
          waktu_mulai: toDatetimeLocal(editData.waktu_mulai),
          waktu_selesai: toDatetimeLocal(editData.waktu_selesai)
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
      setNewKategori({ nama: '', warna: '#4F46E5' });
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
    if (isPastDate(dateStr)) {
      alert('Peringatan: Tidak bisa menambahkan atau menyimpan jadwal ke hari yang sudah berlalu.');
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden p-6 text-white">
        <h2 className="text-xl font-bold mb-4">{editData ? 'Edit Jadwal Dinamis' : 'Tambah Jadwal Dinamis'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Judul</label>
            <input required type="text" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Kategori</label>
            {!isAddingKategori ? (
              <select required value={formData.kategori_id} onChange={handleKategoriChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="" disabled>Pilih Kategori...</option>
                {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                <option value="new" className="font-bold text-indigo-400">+ Tambah Kategori Baru</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input required autoFocus type="text" placeholder="Nama Kategori" value={newKategori.nama} onChange={e => setNewKategori({...newKategori, nama: e.target.value})} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input type="color" value={newKategori.warna} onChange={e => setNewKategori({...newKategori, warna: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0" title="Warna Kategori" />
                <button type="button" onClick={handleCreateKategori} className="bg-indigo-600 px-3 rounded-lg text-sm hover:bg-indigo-700 transition font-medium">Simpan</button>
                <button type="button" onClick={() => setIsAddingKategori(false)} className="bg-gray-700 px-3 rounded-lg text-sm hover:bg-gray-600 transition font-medium">Batal</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal & Jam Mulai</label>
            <input required type="datetime-local" value={formData.waktu_mulai} onChange={e => setFormData({...formData, waktu_mulai: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal & Jam Selesai</label>
            <input required type="datetime-local" value={formData.waktu_selesai} onChange={e => setFormData({...formData, waktu_selesai: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition">Batal</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
