import { useState } from 'react';
import { magicPaste } from '../../lib/api';

interface MagicPasteBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const MagicPasteBox = ({ isOpen, onClose, onSaved }: MagicPasteBoxProps) => {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            ✨ Magic Paste Box
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-3">
              Paste teks berantakan yang berisi jadwal (misal dari SIAKAD, chat dosen, atau pengumuman). AI akan otomatis mengubahnya menjadi jadwal rutin.
            </p>
            <textarea
              required
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste jadwal dari SIAKAD atau chat asisten dosen di sini..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center gap-2"
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
