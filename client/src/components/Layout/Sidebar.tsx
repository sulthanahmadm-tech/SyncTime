import { useState } from 'react';
import type { Kategori } from '../../lib/types';
import { CategoryChart } from '../Analytics/CategoryChart';

interface SidebarProps {
  kategoriList: Kategori[];
  onAddRutin: () => void;
  onAddDinamis: () => void;
  onAddMagicPaste: () => void;
  onOpenMatkulWajib: () => void;
  filters: { rutin: boolean; dinamis: boolean };
  onFilterChange: (filters: { rutin: boolean; dinamis: boolean }) => void;
  weekStart: string;
}

export const Sidebar = ({ kategoriList, onAddRutin, onAddDinamis, onAddMagicPaste, onOpenMatkulWajib, filters, onFilterChange, weekStart }: SidebarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shared?week_start=${weekStart}`;
    navigator.clipboard.writeText(url);
    alert('Link berhasil disalin! Bagikan ke temanmu.');
  };

  return (
    <aside className="w-72 h-full bg-gray-900 border-r border-gray-800 p-4 text-white flex flex-col gap-6 overflow-y-auto">
      <div className="relative">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition flex justify-center items-center gap-2"
        >
          + Jadwal Baru
        </button>
        
        {menuOpen && (
          <div className="absolute top-full mt-2 w-full bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-700">
            <button onClick={() => { onAddRutin(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 transition">Jadwal Rutin</button>
            <button onClick={() => { onAddDinamis(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 transition border-t border-gray-700">Jadwal Dinamis</button>
            <button onClick={() => { onAddMagicPaste(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 transition border-t border-gray-700 text-indigo-400 font-medium">✨ Magic Paste AI</button>
          </div>
        )}
      </div>

      <button 
        onClick={onOpenMatkulWajib}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition"
      >
        📚 Matkul Wajib
      </button>

      <button 
        onClick={handleCopyLink}
        className="w-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium transition"
      >
        🔗 Copy Share Link
      </button>

      <div>
        <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Filter</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.rutin} onChange={e => onFilterChange({ ...filters, rutin: e.target.checked })} className="rounded bg-gray-800 border-gray-600 text-indigo-500 focus:ring-indigo-500" />
            <span>Show Rutin</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.dinamis} onChange={e => onFilterChange({ ...filters, dinamis: e.target.checked })} className="rounded bg-gray-800 border-gray-600 text-indigo-500 focus:ring-indigo-500" />
            <span>Show Dinamis</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Kategori</h3>
        <div className="flex flex-col gap-2">
          {kategoriList.map(kat => (
            <div key={kat.id} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: kat.warna_hex }}></span>
              <span className="text-sm">{kat.nama_kategori}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-800 pt-4">
        <CategoryChart weekStart={weekStart} />
      </div>
    </aside>
  );
};
