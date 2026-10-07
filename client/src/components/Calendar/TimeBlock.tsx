import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CalendarBlock } from '../../lib/types';
import { getBlockPosition, formatTime } from '../../lib/utils';
import { Checkbox } from '../UI/Checkbox';

interface TimeBlockProps {
  block: CalendarBlock;
  onClick: () => void;
  onToggleComplete: () => void;
  readonly?: boolean;
}

export const TimeBlock = ({ block, onClick, onToggleComplete, readonly }: TimeBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id.toString(),
    data: block,
    disabled: readonly
  });

  const { top, height } = getBlockPosition(block.start, block.end);

  const style = {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: block.warna_hex,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 0.9,
    zIndex: isDragging ? 30 : 10,
  };

  const isCompleted = block.type === 'dinamis' && block.is_completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm overflow-hidden group ${readonly ? '' : 'hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing'} border border-black/10`}
      {...attributes}
      {...listeners}
      onClick={() => {
        // Prevent click if dragging
        if (transform || readonly) return;
        onClick();
      }}
    >
      <div className="flex justify-between items-start">
        <div className="text-xs font-semibold text-black truncate pr-1" style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
          {block.judul}
        </div>
        {block.type === 'dinamis' && (
          <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={!!block.is_completed}
              onChange={() => onToggleComplete()}
              variant="pop"
              size="sm"
              disabled={readonly}
            />
          </div>
        )}
      </div>
      <div className="text-[10px] text-black/80 font-medium mt-0.5 flex justify-between">
        <span>{formatTime(block.start)} - {formatTime(block.end)}</span>
        <span className="uppercase text-[9px] px-1 bg-black/10 rounded">{block.type.substring(0, 3)}</span>
      </div>
    </div>
  );
};
