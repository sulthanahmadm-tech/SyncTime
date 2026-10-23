import { useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { CategoryChart } from '../Analytics/CategoryChart';
import { Checkbox } from '../UI/Checkbox';
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
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
      onClick={onClose}
      data-testid="filter-sheet-backdrop"
    >
      <div 
        className="w-full max-w-lg mx-auto bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl backdrop-saturate-150 border-t border-black/[0.08] dark:border-white/[0.12] rounded-t-3xl p-5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 text-[#1D1D1F] dark:text-[#F5F5F7] animate-in slide-in-from-bottom-5 duration-200"
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
        <div className="sticky -top-5 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl backdrop-saturate-150 pt-2 pb-3 -mt-2 -mx-5 px-5 border-b border-black/[0.06] dark:border-white/[0.08] z-10">
          <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-3 shrink-0" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
              Filter & Analisis
            </h3>
            <button 
              onClick={onClose}
              data-testid="filter-close"
              className="w-9 h-9 rounded-full bg-[#F2F2F7] hover:bg-black/10 dark:bg-[#2C2C2E] dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] flex items-center justify-center transition cursor-pointer min-w-[44px] min-h-[44px]"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter checkboxes */}
        <div>
          <h4 className="text-[#6E6E73] dark:text-[#8E8E93] text-[11px] font-semibold uppercase tracking-wider mb-2">Filter Tampilan</h4>
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] min-h-[44px] flex items-center">
              <Checkbox
                checked={filters.rutin}
                onChange={(checked) => onFilterChange({ ...filters, rutin: checked })}
                label="Tampilkan Jadwal Rutin"
                variant="smooth"
              />
            </div>
            <div className="p-3 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] min-h-[44px] flex items-center">
              <Checkbox
                checked={filters.dinamis}
                onChange={(checked) => onFilterChange({ ...filters, dinamis: checked })}
                label="Tampilkan Jadwal Dinamis"
                variant="smooth"
              />
            </div>
          </div>
        </div>

        {/* Kategori list */}
        <div>
          <h4 className="text-[#6E6E73] dark:text-[#8E8E93] text-[11px] font-semibold uppercase tracking-wider mb-2">Kategori Jadwal</h4>
          {kategoriList.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
              {kategoriList.map(kat => (
                <div key={kat.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: kat.warna_hex }} />
                  <span className="truncate font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{kat.nama_kategori}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8E8E93] italic py-2">Belum ada kategori yang dibuat</p>
          )}
        </div>

        {/* Analytics CategoryChart */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <CategoryChart weekStart={weekStart} />
        </div>
      </div>
    </div>
  );
};
