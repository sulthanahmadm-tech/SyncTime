import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => { if (!loading) onClose(); }}
    >
      <div 
        className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-[22px] apple-squircle shadow-2xl w-full max-w-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center">
          <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
              <Sparkles className="w-4 h-4" />
            </span>
            Magic Paste Box
          </h2>
          <button 
            onClick={onClose} 
            disabled={loading}
            aria-label="Tutup"
            className="text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-3 leading-relaxed">
              Paste teks berantakan yang berisi jadwal (misal dari SIAKAD, chat dosen, atau pengumuman). AI akan otomatis mengubahnya menjadi jadwal rutin.
            </p>
            <textarea
              required
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste jadwal dari SIAKAD atau chat asisten dosen di sini..."
              className="w-full bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#007AFF]/40 dark:focus:border-[#0A84FF]/40 rounded-xl p-3.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#8E8E93] focus:ring-2 focus:ring-[#007AFF]/20 dark:focus:ring-[#0A84FF]/20 outline-none resize-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 min-h-[44px] min-w-[80px] rounded-xl text-sm font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#1D1D1F] dark:text-[#F5F5F7] transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2 min-h-[44px] min-w-[80px] rounded-xl text-sm font-semibold bg-[#007AFF] dark:bg-[#0A84FF] hover:bg-[#0062CC] dark:hover:bg-[#0070E0] text-white shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
