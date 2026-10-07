import { useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { CategoryChart } from '../Analytics/CategoryChart';
import type { Kategori } from '../../lib/types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: { rutin: boolean; dinamis: boolean };
  onFilterChange: (filters: { rutin: boolean; dinamis: boolean }) => void;
  kategoriList: Kategori[];
  weekStart: string;
}

export const FilterModal = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  kategoriList,
  weekStart
}: FilterModalProps) => {
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

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
      onClick={onClose}
      data-testid="filter-sheet-backdrop"
    >
      <div 
        className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900/95 backdrop-blur-xl backdrop-saturate-150 border-t border-white/15 rounded-t-3xl p-5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 text-gray-900 dark:text-white animate-in slide-in-from-bottom-5 duration-200"
        onClick={e => e.stopPropagation()}
        data-testid="filter-sheet"
        style={{ 
          borderTopLeftRadius: '24px', 
          borderTopRightRadius: '24px',
          WebkitBorderTopLeftRadius: '24px',
          WebkitBorderTopRightRadius: '24px',
          ...({
            cornerShape: 'squircle',
            WebkitCornerSmoothing: 'continuous',
          } as any)
        }}
      >
        {/* Grab handle & sticky header */}
        <div className="sticky -top-5 bg-white dark:bg-gray-900/95 backdrop-blur-xl backdrop-saturate-150 pt-2 pb-3 -mt-2 -mx-5 px-5 border-b border-white/10 z-10">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3 shrink-0" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-emerald-600 dark:text-indigo-400" />
              Filter & Analisis
            </h3>
            <button 
              onClick={onClose}
              data-testid="filter-close"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white flex items-center justify-center transition cursor-pointer min-w-[44px] min-h-[44px]"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter checkboxes */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2.5">Filter Tampilan</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition min-h-[44px]">
              <input 
                type="checkbox" 
                checked={filters.rutin} 
                onChange={e => onFilterChange({ ...filters, rutin: e.target.checked })} 
                className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-emerald-600 dark:text-indigo-500 focus:ring-emerald-500 dark:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-200">Tampilkan Jadwal Rutin</span>
            </label>
            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition min-h-[44px]">
              <input 
                type="checkbox" 
                checked={filters.dinamis} 
                onChange={e => onFilterChange({ ...filters, dinamis: e.target.checked })} 
                className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-emerald-600 dark:text-indigo-500 focus:ring-emerald-500 dark:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-200">Tampilkan Jadwal Dinamis</span>
            </label>
          </div>
        </div>

        {/* Kategori list */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2.5">Kategori Jadwal</h4>
          {kategoriList.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
              {kategoriList.map(kat => (
                <div key={kat.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: kat.warna_hex }} />
                  <span className="truncate font-medium">{kat.nama_kategori}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-2">Belum ada kategori yang dibuat</p>
          )}
        </div>

        {/* Analytics CategoryChart */}
        <div className="pt-3 border-t border-white/10">
          <h4 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2.5">Distribusi Waktu Minggu Ini</h4>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <CategoryChart weekStart={weekStart} />
          </div>
        </div>
      </div>
    </div>
  );
};
