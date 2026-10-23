import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Calendar, Clock, Sparkles, BookOpen, Share2, Check, Sliders } from 'lucide-react';
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

export const Sidebar = ({
  kategoriList,
  onAddRutin,
  onAddDinamis,
  onAddMagicPaste,
  onOpenMatkulWajib,
  filters,
  onFilterChange,
  weekStart,
  onOpenSettings,
  userId
}: SidebarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
    <aside
      data-testid="desktop-sidebar"
      className="hidden md:flex w-68 h-full bg-[#F5F5F7]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-r border-black/[0.08] dark:border-white/[0.08] px-3.5 py-4 text-[#1D1D1F] dark:text-[#F5F5F7] flex-col gap-5 overflow-y-auto shrink-0 select-none"
    >
      {/* Primary Action: + Jadwal Baru */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full bg-[#007AFF] dark:bg-[#0A84FF] hover:bg-[#0062CC] dark:hover:bg-[#0070E0] active:scale-[0.99] text-white py-2.5 px-3.5 rounded-[11px] text-[13px] font-semibold shadow-xs transition-all flex justify-between items-center cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[2.4]" />
            <span>Jadwal Baru</span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute top-full mt-1.5 w-full bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-2xl rounded-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-1.5 z-30 border border-black/[0.08] dark:border-white/[0.10] space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => { onAddRutin(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-[9px] hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/20 transition flex items-center gap-2.5 cursor-pointer group"
            >
              <Calendar className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-[#1D1D1F] dark:text-white">Jadwal Rutin</p>
                <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D]">Kuliah atau agenda mingguan</p>
              </div>
            </button>
            <button
              onClick={() => { onAddDinamis(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-[9px] hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/20 transition flex items-center gap-2.5 cursor-pointer group"
            >
              <Clock className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-[#1D1D1F] dark:text-white">Jadwal Dinamis</p>
                <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D]">Tugas atau kegiatan satu waktu</p>
              </div>
            </button>
            <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.08]" />
            <button
              onClick={() => { onAddMagicPaste(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-[9px] hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/20 transition flex items-center gap-2.5 cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#007AFF] dark:text-[#0A84FF]">Magic Paste AI</p>
                <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D]">Ekstrak dari teks SIAKAD / chat</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* macOS Sidebar Section: Menu Akademik */}
      <div>
        <h3 className="px-2 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D] mb-1.5 tracking-tight">
          Menu Akademik
        </h3>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onOpenMatkulWajib}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] transition cursor-pointer text-left"
          >
            <BookOpen className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
            <span>Matkul Wajib</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium transition cursor-pointer text-left ${
              copied
                ? 'bg-[#34C759]/12 text-[#248A3D] dark:bg-[#30D158]/20 dark:text-[#30D158]'
                : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#34C759] dark:text-[#30D158] shrink-0" />
            ) : (
              <Share2 className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
            )}
            <span>{copied ? 'Tautan Berhasil Disalin' : 'Bagikan Jadwal'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] transition cursor-pointer text-left"
          >
            <Sliders className="w-4 h-4 text-[#6E6E73] dark:text-[#98989D] shrink-0" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>

      {/* macOS Sidebar Section: Filter Kalender */}
      <div>
        <h3 className="px-2 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D] mb-2 tracking-tight">
          Tampilan Kalender
        </h3>
        <div className="flex flex-col gap-2 px-2">
          <Checkbox
            checked={filters.rutin}
            onChange={(checked) => onFilterChange({ ...filters, rutin: checked })}
            label="Jadwal Rutin"
            variant="smooth"
          />
          <Checkbox
            checked={filters.dinamis}
            onChange={(checked) => onFilterChange({ ...filters, dinamis: checked })}
            label="Jadwal Dinamis"
            variant="smooth"
          />
        </div>
      </div>

      {/* macOS Sidebar Section: Kategori */}
      <div>
        <h3 className="px-2 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D] mb-1.5 tracking-tight">
          Kategori
        </h3>
        <div className="flex flex-col gap-0.5">
          {kategoriList.map(kat => (
            <div key={kat.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px]">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: kat.warna_hex }}
              />
              <span className="text-[13px] text-[#1D1D1F] dark:text-[#E5E5EA] truncate">{kat.nama_kategori}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Apple Screen Time Style Weekly Activity Widget */}
      <div className="mt-auto pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <CategoryChart weekStart={weekStart} />
      </div>
    </aside>
  );
};

