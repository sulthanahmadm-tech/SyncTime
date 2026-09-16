import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentWeekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const Header = ({ currentWeekStart, onPrev, onNext, onToday }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const startDate = new Date(currentWeekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const weekRange = `${startDate.toLocaleDateString('en-US', formatOpts)} - ${endDate.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' })}`;

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-gray-950 border-b border-gray-800 text-white">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          SyncTime
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onPrev} className="p-2 hover:bg-gray-800 rounded transition">&lt; Prev</button>
        <span className="font-medium min-w-40 text-center">{weekRange}</span>
        <button onClick={onNext} className="p-2 hover:bg-gray-800 rounded transition">Next &gt;</button>
        <button onClick={onToday} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition">Today</button>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-gray-400 max-w-[150px] truncate" title={user.email}>
            {user.email}
          </span>
        )}
        <button 
          onClick={signOut}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

