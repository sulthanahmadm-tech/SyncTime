import { useState, useEffect } from 'react';
import { 
  Calendar, 
  PlusCircle, 
  BookOpen, 
  Settings, 
  Share2, 
  Sparkles, 
  Clock, 
  Check
} from 'lucide-react';

interface BottomNavigationProps {
  onAddRutin: () => void;
  onAddDinamis: () => void;
  onAddMagicPaste: () => void;
  onOpenMatkulWajib: () => void;
  isMatkulWajibOpen?: boolean;
  onCloseMatkulWajib?: () => void;
  onCloseForm?: () => void;
  onOpenSettings: () => void;
  isSettingsOpen?: boolean;
  onCloseSettings?: () => void;
  onCloseFilter?: () => void;
  weekStart: string;
  userId?: string;
}

export const BottomNavigation = ({
  onAddRutin,
  onAddDinamis,
  onAddMagicPaste,
  onOpenMatkulWajib,
  isMatkulWajibOpen = false,
  onCloseMatkulWajib,
  onCloseForm,
  onOpenSettings,
  isSettingsOpen = false,
  onCloseSettings,
  onCloseFilter,
  weekStart,
  userId,
}: BottomNavigationProps) => {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActionSheetOpen(false);
      }
    };
    if (actionSheetOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionSheetOpen]);

  // Lock body scroll when a sheet is open to prevent background scroll passthrough
  useEffect(() => {
    if (actionSheetOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [actionSheetOpen]);

  // Dismiss mobile sheets when viewport is resized to desktop (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setActionSheetOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCopyLink = async () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);

    const url = `${window.location.origin}/shared?week_start=${weekStart}${userId ? `&user_id=${userId}` : ''}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Jadwal SyncTime',
          text: 'Lihat jadwal saya di SyncTime:',
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch {
      // ignore
    }

    try {
      const input = document.createElement('input');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.focus();
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    } catch {
      // ignore
    }
  };

  const isScheduleActive = !actionSheetOpen && !isMatkulWajibOpen && !isSettingsOpen;

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div 
          data-testid="share-toast"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl backdrop-saturate-150 border border-black/[0.08] dark:border-white/[0.12] rounded-full shadow-2xl flex items-center gap-2 text-[#1D1D1F] dark:text-white text-sm font-medium animate-in fade-in slide-in-from-top-4"
        >
          <div className="w-5 h-5 rounded-full bg-[#34C759]/20 text-[#248A3D] dark:text-[#30D158] flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>Link jadwal berhasil disalin!</span>
        </div>
      )}

      {/* Action Sheet: Tambah Jadwal Baru (Apple HIG Action Sheet) */}
      {actionSheetOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col md:hidden"
          onClick={() => setActionSheetOpen(false)}
          data-testid="action-sheet-backdrop"
        >
          <div 
            className="w-full max-w-md mx-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2.5"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Card */}
            <div 
              className="backdrop-blur-2xl backdrop-saturate-150 bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl overflow-hidden shadow-2xl divide-y divide-black/[0.06] dark:divide-white/[0.08]"
              data-testid="action-sheet"
              style={{ 
                borderRadius: '24px', 
                WebkitBorderRadius: '24px',
                ...({
                  cornerShape: 'squircle',
                  WebkitCornerSmoothing: 'continuous',
                } as any)
              }}
            >
              <div className="py-3 px-4 text-center">
                <p className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D] uppercase tracking-wider">Tambah Jadwal Baru</p>
              </div>

              {/* Jadwal Rutin */}
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onAddRutin();
                }}
                data-testid="action-add-rutin"
                className="w-full min-h-[52px] px-5 py-3.5 flex items-center gap-3.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.08] dark:active:bg-white/[0.10] transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/12 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Jadwal Rutin</p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">Jadwal kuliah atau kegiatan mingguan berulang</p>
                </div>
              </button>

              {/* Jadwal Dinamis */}
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onAddDinamis();
                }}
                data-testid="action-add-dinamis"
                className="w-full min-h-[52px] px-5 py-3.5 flex items-center gap-3.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.08] dark:active:bg-white/[0.10] transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/12 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Jadwal Dinamis</p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">Tugas, belajar mandiri, atau event fleksibel</p>
                </div>
              </button>

              {/* Magic Paste AI */}
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onAddMagicPaste();
                }}
                data-testid="action-add-magic-paste"
                className="w-full min-h-[52px] px-5 py-3.5 flex items-center gap-3.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.08] dark:active:bg-white/[0.10] transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/12 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#007AFF] dark:text-[#0A84FF]">Magic Paste AI</p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">Ekstrak jadwal instan dari teks chat / silabus</p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setActionSheetOpen(false)}
              data-testid="action-cancel"
              className="w-full min-h-[48px] py-3 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 bg-white/95 dark:bg-[#1C1C1E]/95 hover:bg-white dark:hover:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] font-semibold text-sm border border-black/[0.08] dark:border-white/[0.12] transition shadow-lg text-center cursor-pointer"
              style={{ 
                borderRadius: '20px', 
                WebkitBorderRadius: '20px',
                ...({
                  cornerShape: 'squircle',
                  WebkitCornerSmoothing: 'continuous',
                } as any)
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar (Apple HIG Tab Bar) */}
      <nav 
        data-testid="bottom-navigation-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-xl backdrop-saturate-150 border-t border-black/[0.08] dark:border-white/[0.10] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] select-none"
      >
        <div className="flex items-center justify-around px-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Tab 1: Jadwal */}
          <button
            onClick={() => {
              setActionSheetOpen(false);
              onCloseMatkulWajib?.();
              onCloseSettings?.();
              onCloseFilter?.();
              onCloseForm?.();
            }}
            data-testid="bottom-nav-jadwal"
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isScheduleActive ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
            aria-label="Jadwal Kalender"
            aria-pressed={isScheduleActive}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Jadwal</span>
          </button>

          {/* Tab 2: Tambah */}
          <button
            onClick={() => {
              setActionSheetOpen(prev => !prev);
            }}
            data-testid="bottom-nav-tambah"
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              actionSheetOpen ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
            aria-label="Tambah Jadwal"
            aria-expanded={actionSheetOpen}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Tambah</span>
          </button>

          {/* Tab 3: Matkul */}
          <button
            onClick={() => {
              setActionSheetOpen(false);
              onCloseSettings?.();
              if (isMatkulWajibOpen) {
                onCloseMatkulWajib?.();
              } else {
                onOpenMatkulWajib();
              }
            }}
            data-testid="bottom-nav-matkul"
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isMatkulWajibOpen ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
            aria-label="Matkul Wajib"
            aria-pressed={isMatkulWajibOpen}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Matkul</span>
          </button>

          {/* Tab 4: Pengaturan */}
          <button
            onClick={() => {
              setActionSheetOpen(false);
              onCloseMatkulWajib?.();
              if (isSettingsOpen) {
                onCloseSettings?.();
              } else {
                onOpenSettings();
              }
            }}
            data-testid="bottom-nav-settings"
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isSettingsOpen ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
            aria-label="Pengaturan"
            aria-pressed={isSettingsOpen}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Pengaturan</span>
          </button>

          {/* Tab 5: Bagikan */}
          <button
            onClick={handleCopyLink}
            data-testid="bottom-nav-share"
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 text-[#6E6E73] dark:text-[#98989D] hover:text-[#007AFF] dark:hover:text-[#0A84FF] cursor-pointer"
            aria-label="Bagikan Jadwal"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Bagikan</span>
          </button>
        </div>
      </nav>
    </>
  );
};

