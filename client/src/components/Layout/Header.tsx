import { SlidersHorizontal, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { parseLocalDate } from '../../lib/utils';
import { UserProfilePopover } from './UserProfilePopover';

export type MobileViewMode = '1d' | '3d' | '7d';

interface HeaderProps {
  currentWeekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenFilter?: () => void;
  mobileViewMode?: MobileViewMode;
  onMobileViewModeChange?: (mode: MobileViewMode) => void;
}

export const Header = ({
  currentWeekStart,
  onPrev,
  onNext,
  onToday,
  onOpenFilter,
  mobileViewMode = '3d',
  onMobileViewModeChange
}: HeaderProps) => {
  const startDate = parseLocalDate(currentWeekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const weekRange = `${startDate.toLocaleDateString('en-US', formatOpts)} – ${endDate.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' })}`;

  return (
    <header className="min-h-14 pt-[env(safe-area-inset-top,0px)] flex flex-col justify-center px-3 sm:px-5 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] bg-white/80 dark:bg-[#1C1C1E]/85 backdrop-blur-xl backdrop-saturate-150 border-b border-black/[0.08] dark:border-white/[0.08] text-[#1D1D1F] dark:text-white relative z-40 shrink-0">
      {/* Primary Toolbar Row */}
      <div className="h-14 flex items-center justify-between gap-2">
        {/* Brand & Date Range */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <span className="text-base sm:text-[17px] font-semibold tracking-tight flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 rounded-[8px] bg-[#007AFF] dark:bg-[#0A84FF] text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
            </span>
            <span data-testid="brand-name" className="hidden sm:inline text-[#1D1D1F] dark:text-white">SyncTime</span>
          </span>

          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 hidden sm:block shrink-0" />

          <span className="font-semibold text-xs sm:text-sm text-center min-w-0 px-0.5 truncate text-gray-700 dark:text-gray-200 tabular-nums">
            {weekRange}
          </span>
        </div>

        {/* Center/Right Controls: macOS Segmented Navigation Group + Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* macOS Segmented Pill Control: [ ‹ | Hari Ini | › ] */}
          <div
            data-testid="segmented-week-nav"
            className="inline-flex items-center bg-[#F2F2F7] dark:bg-[#2C2C2E] p-0.5 rounded-[10px] border border-black/[0.06] dark:border-white/[0.08]"
          >
            <button
              onClick={onPrev}
              aria-label="Minggu Sebelumnya"
              data-testid="nav-prev"
              className="px-2 sm:px-2.5 py-1.5 hover:bg-white dark:hover:bg-[#3A3A3C] active:scale-95 rounded-[8px] text-[#1D1D1F] dark:text-white transition-all cursor-pointer min-w-[34px] sm:min-w-[36px] min-h-[32px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>
            <div className="w-[1px] h-3.5 bg-black/[0.08] dark:bg-white/[0.10]" />
            <button
              onClick={onToday}
              data-testid="nav-today"
              className="px-2.5 sm:px-3 py-1.5 hover:bg-white dark:hover:bg-[#3A3A3C] active:scale-95 rounded-[8px] text-[11px] sm:text-xs font-semibold text-[#1D1D1F] dark:text-white transition-all cursor-pointer min-h-[32px] flex items-center justify-center whitespace-nowrap"
            >
              Hari Ini
            </button>
            <div className="w-[1px] h-3.5 bg-black/[0.08] dark:bg-white/[0.10]" />
            <button
              onClick={onNext}
              aria-label="Minggu Berikutnya"
              data-testid="nav-next"
              className="px-2 sm:px-2.5 py-1.5 hover:bg-white dark:hover:bg-[#3A3A3C] active:scale-95 rounded-[8px] text-[#1D1D1F] dark:text-white transition-all cursor-pointer min-w-[34px] sm:min-w-[36px] min-h-[32px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {onOpenFilter && (
            <button
              onClick={onOpenFilter}
              aria-label="Filter dan Analisis"
              data-testid="header-filter-button"
              className="md:hidden p-1.5 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] active:scale-95 rounded-[10px] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <UserProfilePopover />
        </div>
      </div>

      {/* Mobile iOS Calendar Segmented View Switcher (< 768px): 1 Hari / 3 Hari / Minggu */}
      {onMobileViewModeChange && (
        <div
          data-testid="mobile-view-switcher"
          className="md:hidden pb-2 pt-0.5 flex items-center justify-center"
        >
          <div className="w-full flex bg-[#E5E5EA]/80 dark:bg-[#2C2C2E] p-0.5 rounded-[9px] border border-black/[0.04] dark:border-white/[0.06]">
            {([
              { id: '1d', label: '1 Hari' },
              { id: '3d', label: '3 Hari' },
              { id: '7d', label: 'Minggu' }
            ] as const).map((item) => {
              const active = mobileViewMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`view-mode-${item.id}`}
                  aria-pressed={active}
                  onClick={() => onMobileViewModeChange(item.id)}
                  className={`flex-1 py-1 rounded-[7px] text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                      : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

