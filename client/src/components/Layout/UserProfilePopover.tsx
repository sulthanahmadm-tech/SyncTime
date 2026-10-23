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
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-[12px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px] select-none"
      >
        {/* Avatar */}
        <div 
          data-testid="user-avatar"
          className="w-7 h-7 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white flex items-center justify-center font-semibold text-xs shadow-2xs shrink-0 overflow-hidden"
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
          className="hidden sm:inline-block text-xs text-[#1D1D1F] dark:text-[#E5E5EA] font-medium max-w-[130px] md:max-w-[160px] truncate" 
          title={displayName}
        >
          {displayName}
        </span>

        {/* Chevron icon */}
        <ChevronDown 
          className={`w-3.5 h-3.5 text-[#6E6E73] dark:text-[#98989D] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#1D1D1F] dark:text-white' : ''}`} 
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
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] z-50 backdrop-blur-2xl backdrop-saturate-150 bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.65)] rounded-[20px] text-[#1D1D1F] dark:text-white p-4 animate-in fade-in zoom-in-95 duration-150"
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
          <div className="flex items-start gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-11 h-11 rounded-[14px] bg-[#007AFF] dark:bg-[#0A84FF] text-white flex items-center justify-center font-semibold text-lg shadow-xs shrink-0 overflow-hidden">
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
              <p className="font-semibold text-[#1D1D1F] dark:text-white text-sm truncate" title={displayName}>
                {displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#34C759] dark:bg-[#30D158] shrink-0" />
                <span className="text-xs text-[#248A3D] dark:text-[#30D158] font-medium">Akun Aktif</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="my-3 space-y-1.5">
            <div className="flex items-center justify-between py-2 px-3 rounded-[11px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs">
              <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#0A84FF]" />
                SyncTime ID
              </span>
              <span className="tabular-nums font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                {user.id ? `${user.id.slice(0, 8)}...` : 'User'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-[11px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs">
              <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#0A84FF]" />
                Fitur AI
              </span>
              <span className="text-[#248A3D] dark:text-[#30D158] font-medium">Aktif</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] my-3" />

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/18 active:bg-[#FF3B30]/25 text-[#D70015] dark:text-[#FF453A] text-xs font-semibold rounded-[12px] transition cursor-pointer"
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

