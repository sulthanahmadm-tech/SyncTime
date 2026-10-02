import { useState, useEffect } from 'react';
import { magicPaste } from '../../lib/api';

interface MagicPasteBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const MagicPasteBox = ({ isOpen, onClose, onSaved }: MagicPasteBoxProps) => {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    try {
      await magicPaste(rawText);
      alert('Berhasil! Jadwal telah diekstrak dan disimpan.');
      onSaved(); // Refetch calendar
      onClose(); // Close modal
    } catch (error: any) {
      alert(error.message || 'Gagal memproses teks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => { if (!loading) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ✨ Magic Paste Box
          </h2>
          <button 
            onClick={onClose} 
            disabled={loading}
            aria-label="Tutup"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Paste teks berantakan yang berisi jadwal (misal dari SIAKAD, chat dosen, atau pengumuman). AI akan otomatis mengubahnya menjadi jadwal rutin.
            </p>
            <textarea
              required
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste jadwal dari SIAKAD atau chat asisten dosen di sini..."
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 active:bg-gray-600 text-gray-900 dark:text-white transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-lg text-sm font-medium bg-emerald-600 dark:bg-indigo-600 hover:bg-emerald-700 dark:bg-indigo-700 active:bg-indigo-800 text-gray-900 dark:text-white transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses AI...
                </>
              ) : (
                'Generate & Simpan Jadwal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
