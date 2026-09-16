import type { ConflictDetail } from '../../lib/types';
import { formatTime } from '../../lib/utils';

interface ConflictModalProps {
  isOpen: boolean;
  conflicts: ConflictDetail[];
  onCancel: () => void;
  onForceSave: () => void;
}

export const ConflictModal = ({ isOpen, conflicts, onCancel, onForceSave }: ConflictModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-red-500/30 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-red-500/10 p-4 flex items-center gap-3 border-b border-red-500/20">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-bold text-red-400">Jadwal Bentrok!</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-300 text-sm mb-4">
            Jadwal yang Anda buat bertabrakan dengan kegiatan berikut:
          </p>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-3 mb-6">
            {conflicts.map(c => (
              <div key={c.conflicting_id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="font-semibold text-white">{c.conflicting_judul}</div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>{formatTime(c.conflicting_start)} - {formatTime(c.conflicting_end)}</span>
                  <span className="uppercase bg-gray-700 px-2 py-0.5 rounded text-[10px]">{c.type}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition"
            >
              Batal
            </button>
            <button 
              onClick={onForceSave}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition"
            >
              Force Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
