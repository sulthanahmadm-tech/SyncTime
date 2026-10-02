import { useState } from 'react';
import { X, Moon, Sun, Settings, Clock, Tag } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'kategori' | 'rutin' | 'dinamis'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors duration-200">
        
        {/* Sidebar Tabs */}
        <div className="w-64 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2 shrink-0 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 px-2 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Settings
          </h2>
          
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'general' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            <Settings className="w-4 h-4" /> General
          </button>
          
          <button 
            onClick={() => setActiveTab('kategori')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'kategori' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            <Tag className="w-4 h-4" /> Kategori
          </button>
          
          <button 
            onClick={() => setActiveTab('rutin')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'rutin' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            <Clock className="w-4 h-4" /> Jadwal Rutin
          </button>

          <button 
            onClick={() => setActiveTab('dinamis')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'dinamis' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            <Clock className="w-4 h-4" /> Jadwal Dinamis
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{activeTab} Settings</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="max-w-xl">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Appearance</h4>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Theme Preference</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred lighting</p>
                  </div>
                  
                  <div className="flex bg-gray-200 dark:bg-gray-950 p-1 rounded-lg">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-gray-800 shadow-sm text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'kategori' && (
              <div className="text-center mt-10">
                <p className="text-gray-500 dark:text-gray-400">Kategori management coming soon...</p>
              </div>
            )}
            
            {activeTab === 'rutin' && (
              <div className="text-center mt-10">
                <p className="text-gray-500 dark:text-gray-400">Jadwal Rutin management coming soon...</p>
              </div>
            )}

            {activeTab === 'dinamis' && (
              <div className="text-center mt-10">
                <p className="text-gray-500 dark:text-gray-400">Jadwal Dinamis management coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
