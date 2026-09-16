import { useState } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { CalendarBlock } from '../lib/types';
import { moveSchedule } from '../lib/api';
import { isPastDate } from '../lib/utils';

export const useDragAndDrop = (blocks: CalendarBlock[], refetch: () => void) => {
  const [activeBlock, setActiveBlock] = useState<CalendarBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const block = blocks.find(b => b.id.toString() === active.id) || null;
    setActiveBlock(block);
  };

  const [pendingMove, setPendingMove] = useState<any>(null);

  const confirmMove = async (isTemporary: boolean) => {
    if (!pendingMove) return;
    try {
      await moveSchedule({
        ...pendingMove.payload,
        isTemporary
      });
      refetch();
      setPendingMove(null);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal memindahkan jadwal');
      setPendingMove(null);
    }
  };

  const cancelMove = () => setPendingMove(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBlock(null);
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const block = blocks.find(b => b.id.toString() === active.id);
    if (!block) return;

    const dropDate = over.id as string;
    
    if (isPastDate(dropDate)) {
      alert('Peringatan: Tidak bisa memindahkan jadwal ke hari yang sudah berlalu.');
      return;
    }
    
    const startDate = new Date(block.start);
    const dropDayDate = new Date(dropDate);
    
    startDate.setFullYear(dropDayDate.getFullYear(), dropDayDate.getMonth(), dropDayDate.getDate());
    
    const endDate = new Date(block.end);
    const duration = endDate.getTime() - new Date(block.start).getTime();
    endDate.setTime(startDate.getTime() + duration);

    const formatTime = (d: Date) => d.toISOString().split('T')[1].substring(0, 8);
    
    const payload = {
      id: block.id,
      type: block.type,
      newDate: dropDate,
      newStartTime: formatTime(startDate),
      newEndTime: formatTime(endDate),
      originalDate: block.start.split('T')[0]
    };

    if (block.type === 'rutin') {
      setPendingMove({ payload });
    } else {
      try {
        await moveSchedule({ ...payload, isTemporary: false });
        refetch();
      } catch (error: any) {
        console.error(error);
        alert(error.message || 'Gagal memindahkan jadwal');
      }
    }
  };

  return { sensors, handleDragStart, handleDragEnd, activeBlock, pendingMove, confirmMove, cancelMove };
};
