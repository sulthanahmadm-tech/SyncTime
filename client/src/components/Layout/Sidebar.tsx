import { useState } from 'react';
import type { Kategori } from '../../lib/types';
import { CategoryChart } from '../Analytics/CategoryChart';
import { Checkbox } from '../UI/Checkbox';

interface SidebarProps {
  kategoriList: Kategori[];
  onAddRutin: () => void;
  onAddDinamis: () => void;
  onAddMagicPaste: () => void;
  onOpenMatkulWajib: () => void;
  filters: { rutin: boolean; dinamis: boolean };
  onFilterChange: (filters: { rutin: boolean; dinamis: boolean }) => void;
  weekStart: string;
  onOpenSettings: () => void;
  userId?: string;
}

export const Sidebar = ({ kategoriList, onAddRutin, onAddDinamis, onAddMagicPaste, onOpenMatkulWajib, filters, onFilterChange, weekStart, onOpenSettings, userId }: SidebarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/shared?week_start=${weekStart}${userId ? `&user_id=${userId}` : ''}`;
    let success = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(url);
        success = true;
      } catch {
        // Fallback below
      }
    }
    if (!success) {
      try {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        success = true;
      } catch {
        // Silent failure
      }
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  return (
    <aside data-testid="desktop-sidebar" className="hidden md:flex w-72 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 text-gray-900 dark:text-white flex-col gap-6 overflow-y-auto shrink-0">
      <div className="relative">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full bg-emerald-600 dark:bg-indigo-600 hover:bg-emerald-700 dark:bg-indigo-700 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition flex justify-center items-center gap-2"
        >
          + Jadwal Baru
        </button>
        
        {menuOpen && (
          <div className="absolute top-full mt-2 w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-300 dark:border-gray-700">
            <button onClick={() => { onAddRutin(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-200 dark:bg-gray-700 transition">Jadwal Rutin</button>
            <button onClick={() => { onAddDinamis(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-200 dark:bg-gray-700 transition border-t border-gray-300 dark:border-gray-700">Jadwal Dinamis</button>
            <button onClick={() => { onAddMagicPaste(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-200 dark:bg-gray-700 transition border-t border-gray-300 dark:border-gray-700 text-emerald-600 dark:text-indigo-400 font-medium">✨ Magic Paste AI</button>
          </div>
        )}
      </div>

      <button 
        onClick={onOpenMatkulWajib}
        className="w-full bg-amber-600 hover:bg-amber-700 text-gray-900 dark:text-white py-2 rounded-lg text-sm font-medium transition"
      >
        📚 Matkul Wajib
      </button>

      <button 
        onClick={handleCopyLink}
        className={`w-full border text-sm font-medium py-2 rounded-lg transition ${
          copied 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {copied ? '✓ Link Berhasil Disalin!' : '🔗 Copy Share Link'}
      </button>

      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Filter</h3>
        <div className="flex flex-col gap-3">
          <Checkbox 
            checked={filters.rutin}
            onChange={(checked) => onFilterChange({ ...filters, rutin: checked })}
            label="Show Rutin"
            variant="smooth"
          />
          <Checkbox 
            checked={filters.dinamis}
            onChange={(checked) => onFilterChange({ ...filters, dinamis: checked })}
            label="Show Dinamis"
            variant="smooth"
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Kategori</h3>
        <div className="flex flex-col gap-2">
          {kategoriList.map(kat => (
            <div key={kat.id} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: kat.warna_hex }}></span>
              <span className="text-sm">{kat.nama_kategori}</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onOpenSettings}
        className="w-full flex items-center justify-center gap-2 mt-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white py-2 rounded-lg text-sm font-medium transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        Pengaturan
      </button>

      <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4">
        <CategoryChart weekStart={weekStart} />
      </div>
    </aside>
  );
};
