import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import type { CalendarBlock } from '../../lib/types';
import { getBlockPosition, formatTime, hexToRgba } from '../../lib/utils';

export const DragOverlay = ({ activeBlock }: { activeBlock: CalendarBlock | null }) => {
  if (!activeBlock) return null;

  const { height, isHidden } = getBlockPosition(activeBlock.start, activeBlock.end);

  if (isHidden) return null;

  const accentColor = activeBlock.warna_hex || '#007AFF';

  return (
    <DndDragOverlay>
      <div
        className="rounded-[7px] px-2 py-1 shadow-xl backdrop-blur-md bg-white/90 dark:bg-[#1C1C1E]/90"
        style={{
          height: `${height}px`,
          backgroundColor: hexToRgba(accentColor, 0.26),
          borderLeft: `3.5px solid ${accentColor}`,
          borderTop: `1px solid ${hexToRgba(accentColor, 0.35)}`,
          borderRight: `1px solid ${hexToRgba(accentColor, 0.35)}`,
          borderBottom: `1px solid ${hexToRgba(accentColor, 0.35)}`,
          width: '100%',
          minWidth: '120px'
        }}
      >
        <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate pr-1">
          {activeBlock.judul}
        </div>
        <div className="text-[10px] text-[#3A3A3C] dark:text-[#D1D1D6] font-medium mt-0.5 tabular-nums">
          {formatTime(activeBlock.start)} – {formatTime(activeBlock.end)}
        </div>
      </div>
    </DndDragOverlay>
  );
};

