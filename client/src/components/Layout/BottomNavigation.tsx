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

  const isScheduleActive = !actionSheetOpen && !isMatkulWajibOpen;

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div 
          data-testid="share-toast"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-white dark:bg-gray-900/90 backdrop-blur-xl backdrop-saturate-150 border border-white/20 rounded-full shadow-2xl flex items-center gap-2 text-gray-900 dark:text-white text-sm font-medium animate-in fade-in slide-in-from-top-4"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>Link jadwal berhasil disalin!</span>
        </div>
      )}

      {/* Action Sheet: Tambah Jadwal Baru (Apple HIG Action Sheet) */}
      {actionSheetOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col md:hidden"
          onClick={() => setActionSheetOpen(false)}
          data-testid="action-sheet-backdrop"
        >
          <div 
            className="w-full max-w-md mx-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] mt-auto flex flex-col gap-3"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Card */}
            <div 
              className="backdrop-blur-xl backdrop-saturate-150 bg-white dark:bg-gray-900/90 border border-white/15 rounded-3xl overflow-hidden shadow-2xl divide-y divide-white/10"
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
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tambah Jadwal Baru</p>
              </div>

              {/* Jadwal Rutin */}
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onAddRutin();
                }}
                data-testid="action-add-rutin"
                className="w-full min-h-[52px] px-5 py-3.5 flex items-center gap-3.5 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-emerald-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-emerald-500 dark:border-indigo-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Jadwal Rutin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jadwal kuliah atau kegiatan mingguan berulang</p>
                </div>
              </button>

              {/* Jadwal Dinamis */}
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onAddDinamis();
                }}
                data-testid="action-add-dinamis"
                className="w-full min-h-[52px] px-5 py-3.5 flex items-center gap-3.5 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Jadwal Dinamis</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tugas, belajar mandiri, atau event fleksibel</p>
                </div>
              </button>

              {/* Magic Paste AI */}
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onAddMagicPaste();
                }}
                data-testid="action-add-magic-paste"
                className="w-full min-h-[52px] px-5 py-3.5 flex items-center gap-3.5 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-300">✨ Magic Paste AI</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ekstrak jadwal instan dari teks chat / silabus</p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setActionSheetOpen(false)}
              data-testid="action-cancel"
              className="w-full min-h-[48px] py-3 rounded-2xl backdrop-blur-xl backdrop-saturate-150 bg-white dark:bg-gray-900/90 hover:bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-sm border border-white/15 transition shadow-lg text-center cursor-pointer"
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-50 dark:bg-gray-950/85 backdrop-blur-xl backdrop-saturate-150 border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] select-none"
      >
        <div className="flex items-center justify-around px-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Tab 1: Jadwal */}
          <button
            onClick={() => {
              setActionSheetOpen(false);
              onCloseMatkulWajib?.();
              onCloseForm?.();
            }}
            data-testid="bottom-nav-jadwal"
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isScheduleActive ? 'text-emerald-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-200'
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
              actionSheetOpen ? 'text-emerald-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-200'
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
              if (isMatkulWajibOpen) {
                onCloseMatkulWajib?.();
              } else {
                onOpenMatkulWajib();
              }
            }}
            data-testid="bottom-nav-matkul"
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isMatkulWajibOpen ? 'text-emerald-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-amber-400'
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
              onOpenSettings();
            }}
            data-testid="bottom-nav-settings"
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 text-gray-500 dark:text-gray-400 hover:text-gray-200 cursor-pointer"
            aria-label="Pengaturan"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Pengaturan</span>
          </button>

          {/* Tab 5: Bagikan */}
          <button
            onClick={handleCopyLink}
            data-testid="bottom-nav-share"
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 text-gray-500 dark:text-gray-400 hover:text-sky-400 cursor-pointer"
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
