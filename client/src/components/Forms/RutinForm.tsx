import { useState, useEffect } from 'react';
import type { Kategori, KegiatanRutin } from '../../lib/types';
import { createRutin, updateRutin, createKategori } from '../../lib/api';

interface RutinFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  kategoriList: Kategori[];
  onKategoriAdded?: () => void;
  editData?: KegiatanRutin | null;
  defaultDay?: number;
  defaultTime?: string;
  setConflictState: (conflicts: any[], onForce: () => void) => void;
}

export const RutinForm = ({ isOpen, onClose, onSaved, kategoriList, onKategoriAdded, editData, defaultDay, defaultTime, setConflictState }: RutinFormProps) => {
  const [formData, setFormData] = useState({
    judul: '',
    kategori_id: '',
    hari_mingguan: 1,
    jam_mulai: '08:00',
    jam_selesai: '09:00',
    batas_minggu_berulang: 16
  });

  const [isAddingKategori, setIsAddingKategori] = useState(false);
  const [newKategori, setNewKategori] = useState({ nama: '', warna: '#4F46E5' });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          judul: editData.judul,
          kategori_id: editData.kategori_id.toString(),
          hari_mingguan: editData.hari_mingguan,
          jam_mulai: editData.jam_mulai.substring(0, 5),
          jam_selesai: editData.jam_selesai.substring(0, 5),
          batas_minggu_berulang: editData.batas_minggu_berulang
        });
      } else {
        setFormData({
          judul: '',
          kategori_id: kategoriList[0]?.id.toString() || '',
          hari_mingguan: defaultDay || 1,
          jam_mulai: defaultTime || '08:00',
          jam_selesai: defaultTime ? `${parseInt(defaultTime.split(':')[0]) + 1}:00`.padStart(5, '0') : '09:00',
          batas_minggu_berulang: 16
        });
      }
    }
  }, [isOpen, editData, defaultDay, defaultTime, kategoriList]);

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
    const payload = {
      judul: formData.judul,
      kategori_id: parseInt(formData.kategori_id),
      hari_mingguan: formData.hari_mingguan,
      jam_mulai: formData.jam_mulai + ':00',
      jam_selesai: formData.jam_selesai + ':00',
      batas_minggu_berulang: formData.batas_minggu_berulang
    };

    try {
      if (editData) {
        await updateRutin(editData.id, payload, force);
      } else {
        await createRutin(payload as any, force);
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6 text-white my-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{editData ? 'Edit Jadwal Rutin' : 'Tambah Jadwal Rutin'}</h2>
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
                <button type="button" onClick={handleCreateKategori} className="bg-indigo-600 px-3 min-h-[44px] rounded-lg text-sm hover:bg-indigo-700 transition font-medium cursor-pointer">Simpan</button>
                <button type="button" onClick={() => setIsAddingKategori(false)} className="bg-gray-700 px-3 min-h-[44px] rounded-lg text-sm hover:bg-gray-600 transition font-medium cursor-pointer">Batal</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Hari</label>
            <select required value={formData.hari_mingguan} onChange={e => setFormData({...formData, hari_mingguan: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value={1}>Senin</option><option value={2}>Selasa</option><option value={3}>Rabu</option><option value={4}>Kamis</option><option value={5}>Jumat</option><option value={6}>Sabtu</option><option value={7}>Minggu</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Jam Mulai</label>
              <input required type="time" value={formData.jam_mulai} onChange={e => setFormData({...formData, jam_mulai: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Jam Selesai</label>
              <input required type="time" value={formData.jam_selesai} onChange={e => setFormData({...formData, jam_selesai: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Batas Minggu Berulang</label>
            <input required type="number" min="1" value={formData.batas_minggu_berulang} onChange={e => setFormData({...formData, batas_minggu_berulang: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white transition cursor-pointer flex items-center justify-center">Batal</button>
            <button type="submit" className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition cursor-pointer flex items-center justify-center">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
