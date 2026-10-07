import { SlidersHorizontal } from 'lucide-react';
import { parseLocalDate } from '../../lib/utils';
import { UserProfilePopover } from './UserProfilePopover';

interface HeaderProps {
  currentWeekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenFilter?: () => void;
}

export const Header = ({ currentWeekStart, onPrev, onNext, onToday, onOpenFilter }: HeaderProps) => {
  const startDate = parseLocalDate(currentWeekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const weekRange = `${startDate.toLocaleDateString('en-US', formatOpts)} - ${endDate.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' })}`;

  return (
    <header className="min-h-16 h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-3 sm:px-6 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] bg-gray-50 dark:bg-gray-950/90 backdrop-blur-md backdrop-saturate-150 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white relative z-50 shrink-0">
      {/* Brand / Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base sm:text-xl font-bold tracking-tight flex items-center gap-1.5 sm:gap-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span data-testid="brand-name" className="hidden sm:inline">SyncTime</span>
        </span>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center gap-1 sm:gap-3 min-w-0">
        <button 
          onClick={onPrev} 
          aria-label="Minggu Sebelumnya"
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:bg-gray-700 rounded-lg text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
        >
          &lt; <span className="hidden md:inline ml-1">Prev</span>
        </button>
        <span className="font-medium text-xs sm:text-sm text-center min-w-0 sm:min-w-36 px-1 truncate text-gray-200">
          {weekRange}
        </span>
        <button 
          onClick={onNext} 
          aria-label="Minggu Berikutnya"
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:bg-gray-700 rounded-lg text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
        >
          <span className="hidden md:inline mr-1">Next</span> &gt;
        </button>
        <button 
          onClick={onToday} 
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 active:bg-gray-600 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer min-h-[44px] flex items-center justify-center shrink-0"
        >
          Today
        </button>
      </div>

      {/* User Profile Popover Card & Filter */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            aria-label="Filter dan Analisis"
            className="md:hidden p-1.5 sm:p-2 hover:bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        )}
        <UserProfilePopover />
      </div>
    </header>
  );
};
