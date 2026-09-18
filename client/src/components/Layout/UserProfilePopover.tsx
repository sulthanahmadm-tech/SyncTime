import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';

export const UserProfilePopover = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const rawDisplayName = user.email || (user.user_metadata && user.user_metadata.full_name) || 'Pengguna SyncTime';
  const displayName = rawDisplayName.trim();
  const userInitial = displayName ? displayName[0].toUpperCase() : 'U';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger: User Avatar + Email Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Profil Pengguna"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="user-profile-dialog"
        data-testid="user-profile-trigger"
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl hover:bg-white/10 active:bg-white/15 active:scale-95 transition-all border border-transparent hover:border-white/10 cursor-pointer min-h-[44px] min-w-[44px] select-none"
      >
        {/* Avatar */}
        <div 
          data-testid="user-avatar"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md ring-1 ring-white/20 shrink-0 overflow-hidden"
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-full h-full object-cover" 
              onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            userInitial
          )}
        </div>
        
        {/* Email / Display Name */}
        <span 
          data-testid="user-email"
          className="hidden sm:inline-block text-sm text-gray-200 font-medium max-w-[140px] md:max-w-[180px] truncate" 
          title={displayName}
        >
          {displayName}
        </span>

        {/* Chevron icon */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-white' : ''}`} 
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          id="user-profile-dialog"
          data-testid="user-profile-card"
          role="dialog"
          aria-modal="true"
          aria-label="User Profile"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] z-50 backdrop-blur-xl backdrop-saturate-150 bg-gray-900/85 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-[20px] ring-1 ring-white/10 text-white p-4 animate-in fade-in zoom-in-95 duration-150"
          style={{
            borderRadius: '20px',
            WebkitBorderRadius: '20px',
            ...({
              cornerShape: 'squircle',
              WebkitCornerSmoothing: 'continuous',
            } as any)
          }}
        >
          {/* Header Info with Avatar & Email */}
          <div className="flex items-start gap-3.5 pb-3 border-b border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-white/20 shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover" 
                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm sm:text-base truncate" title={displayName}>
                {displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Akun Aktif</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="my-3 space-y-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-xs">
              <span className="text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                SyncTime ID
              </span>
              <span className="font-mono text-gray-300">
                {user.id ? `${user.id.slice(0, 8)}...` : 'User'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-xs">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Fitur AI
              </span>
              <span className="text-emerald-400 font-medium">Aktif</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-3" />

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 hover:text-rose-300 text-sm font-medium rounded-xl transition border border-rose-500/20 cursor-pointer"
            style={{ 
              borderRadius: '12px', 
              WebkitBorderRadius: '12px',
              ...({
                cornerShape: 'squircle',
                WebkitCornerSmoothing: 'continuous',
              } as any)
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      )}
    </div>
  );
};
