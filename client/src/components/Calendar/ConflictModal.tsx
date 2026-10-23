import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ConflictDetail } from '../../lib/types';
import { formatTime } from '../../lib/utils';

interface ConflictModalProps {
  isOpen: boolean;
  conflicts: ConflictDetail[];
  onCancel: () => void;
  onForceSave: () => void;
}

export const ConflictModal = ({ isOpen, conflicts, onCancel, onForceSave }: ConflictModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onCancel}
    >
      <div 
        className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-[#FF3B30]/30 rounded-[22px] apple-squircle shadow-2xl max-w-md w-full overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#FF3B30]/10 px-6 py-4 flex items-center gap-3 border-b border-[#FF3B30]/15">
          <span className="w-8 h-8 rounded-full bg-[#FF3B30]/15 flex items-center justify-center text-[#FF3B30] dark:text-[#FF453A] shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-[#FF3B30] dark:text-[#FF453A]">Jadwal Bentrok!</h2>
        </div>
        <div className="p-6">
          <p className="text-[#6E6E73] dark:text-[#8E8E93] text-sm mb-4">
            Jadwal yang Anda buat bertabrakan dengan kegiatan berikut:
          </p>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-2.5 mb-6">
            {conflicts.map(c => (
              <div key={c.conflicting_id} className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3.5 rounded-xl border border-black/[0.05] dark:border-white/[0.06]">
                <div className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{c.conflicting_judul}</div>
                <div className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 flex justify-between items-center tabular-nums">
                  <span>{formatTime(c.conflicting_start)} - {formatTime(c.conflicting_end)}</span>
                  <span className="uppercase bg-black/[0.06] dark:bg-white/[0.1] px-2 py-0.5 rounded-md text-[10px] font-semibold">{c.type}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2.5">
            <button 
              onClick={onCancel}
              className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-xl text-sm font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#1D1D1F] dark:text-[#F5F5F7] transition cursor-pointer flex items-center justify-center"
            >
              Batal
            </button>
            <button 
              onClick={onForceSave}
              className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-xl text-sm font-semibold bg-[#FF3B30] hover:bg-[#D70015] active:bg-[#B80012] text-white transition cursor-pointer flex items-center justify-center shadow-xs"
            >
              Force Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
