import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import type { CalendarBlock } from '../../lib/types';
import { getBlockPosition, formatTime } from '../../lib/utils';

export const DragOverlay = ({ activeBlock }: { activeBlock: CalendarBlock | null }) => {
  if (!activeBlock) return null;

  const { height } = getBlockPosition(activeBlock.start, activeBlock.end);

  return (
    <DndDragOverlay>
      <div
        className="rounded-md p-1.5 shadow-lg border border-white/20 opacity-80"
        style={{
          height: `${height}px`,
          backgroundColor: activeBlock.warna_hex,
          width: '100%',
          minWidth: '120px'
        }}
      >
        <div className="text-xs font-semibold text-black truncate pr-1">
          {activeBlock.judul}
        </div>
        <div className="text-[10px] text-black/80 font-medium mt-0.5">
          {formatTime(activeBlock.start)} - {formatTime(activeBlock.end)}
        </div>
      </div>
    </DndDragOverlay>
  );
};
