import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Header } from '../components/Layout/Header';
import { Sidebar } from '../components/Layout/Sidebar';
import { WeeklyCalendar } from '../components/Calendar/WeeklyCalendar';
import { DragOverlay } from '../components/Calendar/DragOverlay';
import { ConflictModal } from '../components/Calendar/ConflictModal';
import { RutinForm } from '../components/Forms/RutinForm';
import { DinamisForm } from '../components/Forms/DinamisForm';
import { MagicPasteBox } from '../components/Forms/MagicPasteBox';
import { MatkulWajibModal } from '../components/Forms/MatkulWajibModal';
import { useCalendarData } from '../hooks/useCalendarData';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { toggleComplete } from '../lib/api';
import { isPastDate } from '../lib/utils';

const Dashboard = () => {
  const { blocks, kategoriList, currentWeekStart, nextWeek, prevWeek, goToToday, refetch, refetchKategori } = useCalendarData();
  
  const [filters, setFilters] = useState({ rutin: true, dinamis: true });
  const [matkulWajibOpen, setMatkulWajibOpen] = useState(false);
  
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

    const d = new Date(dateStr);
    const dayIndex = d.getDay() === 0 ? 7 : d.getDay();
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    const startIso = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    const endIso = new Date(`${dateStr}T${(hour+1).toString().padStart(2, '0')}:00:00`).toISOString();

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

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-gray-950">
      <Header 
        currentWeekStart={currentWeekStart} 
        onNext={nextWeek} 
        onPrev={prevWeek} 
        onToday={goToToday} 
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
          />
          <WeeklyCalendar 
            blocks={filteredBlocks}
            currentWeekStart={currentWeekStart}
            onBlockClick={(b) => setFormState({ type: b.type, editData: b })}
            onEmptyCellClick={handleEmptyCellClick}
            onToggleComplete={handleToggleComplete}
          />
        </div>
        <DragOverlay activeBlock={activeBlock} />
      </DndContext>

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

      <ConflictModal 
        isOpen={conflictModal.isOpen}
        conflicts={conflictModal.conflicts}
        onCancel={() => setConflictModal({ isOpen: false, conflicts: [], onForce: () => {} })}
        onForceSave={handleForceSave}
      />

      {pendingMove && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Pindahkan Jadwal Rutin</h3>
            <p className="text-sm text-gray-400 mb-6">
              Apakah jadwal ini digeser hanya untuk minggu ini (misal dosen berhalangan), atau pindah hari secara permanen?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => confirmMove(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Hanya untuk Minggu Ini
              </button>
              <button 
                onClick={() => confirmMove(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Pindah Permanen
              </button>
              <button 
                onClick={cancelMove}
                className="w-full mt-2 text-gray-500 hover:text-white py-2 rounded-lg text-sm font-medium transition"
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
