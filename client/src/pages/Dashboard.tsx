import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import { Header } from '../components/Layout/Header';
import { Sidebar } from '../components/Layout/Sidebar';
import { BottomNavigation } from '../components/Layout/BottomNavigation';
import { WeeklyCalendar } from '../components/Calendar/WeeklyCalendar';
import { DragOverlay } from '../components/Calendar/DragOverlay';
import { ConflictModal } from '../components/Calendar/ConflictModal';
import { FilterModal } from '../components/Calendar/FilterModal';
import { RutinForm } from '../components/Forms/RutinForm';
import { DinamisForm } from '../components/Forms/DinamisForm';
import { MagicPasteBox } from '../components/Forms/MagicPasteBox';
import { MatkulWajibModal } from '../components/Forms/MatkulWajibModal';
import { SettingsModal } from '../components/Settings/SettingsModal';
import { useCalendarData } from '../hooks/useCalendarData';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { toggleComplete } from '../lib/api';
import { isPastDate, parseLocalDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { blocks, kategoriList, currentWeekStart, nextWeek, prevWeek, goToToday, refetch, refetchKategori } = useCalendarData();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [profile, navigate]);
  
  const [filters, setFilters] = useState({ rutin: true, dinamis: true });
  const [matkulWajibOpen, setMatkulWajibOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'1d' | '3d' | '7d'>('3d');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  const handlePrev = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (mobileViewMode === '1d') {
        if (selectedDayIndex > 0) {
          setSelectedDayIndex(selectedDayIndex - 1);
        } else {
          prevWeek();
          setSelectedDayIndex(6);
        }
        return;
      }
      if (mobileViewMode === '3d') {
        if (selectedDayIndex >= 3) {
          setSelectedDayIndex(selectedDayIndex - 3);
        } else if (selectedDayIndex > 0) {
          setSelectedDayIndex(0);
        } else {
          prevWeek();
          setSelectedDayIndex(4);
        }
        return;
      }
    }
    prevWeek();
  };

  const handleNext = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (mobileViewMode === '1d') {
        if (selectedDayIndex < 6) {
          setSelectedDayIndex(selectedDayIndex + 1);
        } else {
          nextWeek();
          setSelectedDayIndex(0);
        }
        return;
      }
      if (mobileViewMode === '3d') {
        if (selectedDayIndex < 4) {
          setSelectedDayIndex(Math.min(4, selectedDayIndex + 3));
        } else {
          nextWeek();
          setSelectedDayIndex(0);
        }
        return;
      }
    }
    nextWeek();
  };

  const handleToday = () => {
    goToToday();
    const d = new Date().getDay();
    setSelectedDayIndex(d === 0 ? 6 : d - 1);
  };
  
  const filteredBlocks = blocks.filter(b => {
    if (b.type === 'rutin' && !filters.rutin) return false;
    if (b.type === 'dinamis' && !filters.dinamis) return false;
    return true;
  });

  const [conflictModal, setConflictModal] = useState<{isOpen: boolean, conflicts: any[], onForce: () => void}>({
    isOpen: false,
    conflicts: [],
    onForce: () => {}
  });

  const handleConflictState = (conflicts: any[], onForce: () => void) => {
    setConflictModal({ isOpen: true, conflicts, onForce });
  };

  const { sensors, handleDragStart, handleDragEnd, activeBlock, pendingMove, confirmMove, cancelMove } = useDragAndDrop(blocks, refetch);

  const [formState, setFormState] = useState<{
    type: 'rutin' | 'dinamis' | 'magicPaste' | null,
    editData: any,
    defaultDay?: number,
    defaultTime?: string,
    defaultStart?: string,
    defaultEnd?: string
  }>({ type: null, editData: null });

  const handleEmptyCellClick = (dateStr: string, hour: number) => {
    if (isPastDate(dateStr)) {
      alert('Peringatan: Tidak bisa menambahkan jadwal ke hari yang sudah berlalu.');
      return;
    }

    const d = parseLocalDate(dateStr);
    const dayIndex = d.getDay() === 0 ? 7 : d.getDay();
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    const startDate = new Date(`${dateStr}T${timeStr}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    setFormState({
      type: 'dinamis',
      editData: null,
      defaultDay: dayIndex,
      defaultTime: timeStr,
      defaultStart: startIso,
      defaultEnd: endIso
    });
  };

  const handleToggleComplete = async (id: number) => {
    try {
      await toggleComplete(id);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceSave = () => {
    conflictModal.onForce();
    setConflictModal({ isOpen: false, conflicts: [], onForce: () => {} });
  };

  // Prevent background scroll passthrough when any modal or form is open
  useEffect(() => {
    const isAnyModalOpen = formState.type !== null || matkulWajibOpen || conflictModal.isOpen || settingsOpen || filterOpen;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [formState.type, matkulWajibOpen, conflictModal.isOpen, settingsOpen, filterOpen]);

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      <Header 
        currentWeekStart={currentWeekStart} 
        onNext={handleNext} 
        onPrev={handlePrev} 
        onToday={handleToday} 
        onOpenFilter={() => setFilterOpen(true)}
        mobileViewMode={mobileViewMode}
        onMobileViewModeChange={setMobileViewMode}
      />
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          <Sidebar 
            kategoriList={kategoriList}
            filters={filters}
            onFilterChange={setFilters}
            onAddRutin={() => setFormState({ type: 'rutin', editData: null })}
            onAddDinamis={() => setFormState({ type: 'dinamis', editData: null })}
            onAddMagicPaste={() => setFormState({ type: 'magicPaste', editData: null })}
            onOpenMatkulWajib={() => setMatkulWajibOpen(true)}
            weekStart={currentWeekStart}
            onOpenSettings={() => setSettingsOpen(true)}
            userId={user?.id}
          />
          <WeeklyCalendar 
            blocks={filteredBlocks}
            currentWeekStart={currentWeekStart}
            onBlockClick={(b) => setFormState({ type: b.type, editData: b })}
            onEmptyCellClick={handleEmptyCellClick}
            onToggleComplete={handleToggleComplete}
            mobileViewMode={mobileViewMode}
            selectedDayIndex={selectedDayIndex}
            onSelectDayIndex={setSelectedDayIndex}
          />
        </div>
        <DragOverlay activeBlock={activeBlock} />
      </DndContext>

      <BottomNavigation 
        onAddRutin={() => setFormState({ type: 'rutin', editData: null })}
        onAddDinamis={() => setFormState({ type: 'dinamis', editData: null })}
        onAddMagicPaste={() => setFormState({ type: 'magicPaste', editData: null })}
        onOpenMatkulWajib={() => setMatkulWajibOpen(true)}
        isMatkulWajibOpen={matkulWajibOpen}
        onCloseMatkulWajib={() => setMatkulWajibOpen(false)}
        onCloseForm={() => setFormState({ type: null, editData: null })}
        onOpenSettings={() => setSettingsOpen(true)}
        isSettingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        onCloseFilter={() => setFilterOpen(false)}
        weekStart={currentWeekStart}
        userId={user?.id}
      />

      <FilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        kategoriList={kategoriList}
        weekStart={currentWeekStart}
      />

      {formState.type === 'rutin' && (
        <RutinForm 
          isOpen={true}
          onClose={() => setFormState({ type: null, editData: null })}
          onSaved={refetch}
          kategoriList={kategoriList}
          onKategoriAdded={refetchKategori}
          editData={formState.editData}
          defaultDay={formState.defaultDay}
          defaultTime={formState.defaultTime}
          setConflictState={handleConflictState}
        />
      )}

      {formState.type === 'dinamis' && (
        <DinamisForm 
          isOpen={true}
          onClose={() => setFormState({ type: null, editData: null })}
          onSaved={refetch}
          kategoriList={kategoriList}
          onKategoriAdded={refetchKategori}
          editData={formState.editData}
          defaultStart={formState.defaultStart}
          defaultEnd={formState.defaultEnd}
          setConflictState={handleConflictState}
        />
      )}

      <MagicPasteBox 
        isOpen={formState.type === 'magicPaste'}
        onClose={() => setFormState({ type: null, editData: null })}
        onSaved={refetch}
      />

      {matkulWajibOpen && (
        <MatkulWajibModal 
          isOpen={matkulWajibOpen} 
          onClose={() => setMatkulWajibOpen(false)} 
          onSaved={refetch} 
          kategoriList={kategoriList} 
        />
      )}

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditRutin={(data) => setFormState({ type: 'rutin', editData: data })}
        onEditDinamis={(data) => setFormState({ type: 'dinamis', editData: data })}
        onRefresh={() => {
          refetch();
          refetchKategori();
        }}
      />

      <ConflictModal 
        isOpen={conflictModal.isOpen}
        conflicts={conflictModal.conflicts}
        onCancel={() => setConflictModal({ isOpen: false, conflicts: [], onForce: () => {} })}
        onForceSave={handleForceSave}
      />

      {pendingMove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-[22px] shadow-2xl w-full max-w-sm p-6 text-center"
            style={{ borderRadius: '22px', WebkitBorderRadius: '22px' }}
          >
            <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white mb-1.5">Pindahkan Jadwal Rutin</h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mb-5 leading-relaxed">
              Apakah jadwal ini digeser hanya untuk minggu ini, atau pindah hari secara permanen?
            </p>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => confirmMove(true)}
                className="w-full min-h-[44px] bg-[#007AFF] hover:bg-[#0062CC] dark:bg-[#0A84FF] dark:hover:bg-[#0070E0] text-white py-2.5 rounded-[12px] text-sm font-semibold transition cursor-pointer"
              >
                Hanya untuk Minggu Ini
              </button>
              <button 
                onClick={() => confirmMove(false)}
                className="w-full min-h-[44px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/[0.06] dark:hover:bg-white/[0.10] text-[#1D1D1F] dark:text-white py-2.5 rounded-[12px] text-sm font-semibold transition cursor-pointer"
              >
                Pindah Permanen
              </button>
              <button 
                onClick={cancelMove}
                className="w-full min-h-[40px] mt-1 text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white py-2 rounded-[12px] text-sm font-medium transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

