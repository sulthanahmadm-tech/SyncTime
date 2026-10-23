import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CalendarBlock } from '../../lib/types';
import { getBlockPosition, formatTime, hexToRgba } from '../../lib/utils';
import { Checkbox } from '../UI/Checkbox';

interface TimeBlockProps {
  block: CalendarBlock;
  onClick: () => void;
  onToggleComplete: () => void;
  readonly?: boolean;
  columnIndex?: number;
  totalColumns?: number;
}

export const TimeBlock = ({
  block,
  onClick,
  onToggleComplete,
  readonly,
  columnIndex = 0,
  totalColumns = 1,
}: TimeBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${block.type}-${block.id}`,
    data: block,
    disabled: readonly
  });

  const { top, height, isHidden } = getBlockPosition(block.start, block.end);

  if (isHidden) return null;

  const accentColor = block.warna_hex || '#007AFF';
  const isCompleted = block.type === 'dinamis' && block.is_completed;
  const isCompact = height < 42;

  const safeCols = Math.max(1, totalColumns);
  const safeColIdx = Math.min(safeCols - 1, Math.max(0, columnIndex));

  const horizontalPosition: React.CSSProperties =
    safeCols > 1
      ? {
          left: `calc(${(safeColIdx / safeCols) * 100}% + 3px)`,
          width: `calc(${100 / safeCols}% - 6px)`,
        }
      : {
          left: '4px',
          right: '4px',
        };

  const style: React.CSSProperties = {
    top: `${top}px`,
    height: `${height}px`,
    ...horizontalPosition,
    borderLeft: `3.5px solid ${accentColor}`,
    backgroundColor: hexToRgba(accentColor, 0.18),
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : isCompleted ? 0.65 : 1,
    zIndex: isDragging ? 30 : 10 + safeColIdx,
    ['--block-bg-light' as string]: hexToRgba(accentColor, 0.18),
    ['--block-bg-dark' as string]: hexToRgba(accentColor, 0.24),
    ['--block-grad-start-light' as string]: hexToRgba(accentColor, 0.22),
    ['--block-grad-end-light' as string]: hexToRgba(accentColor, 0.14),
    ['--block-grad-start-dark' as string]: hexToRgba(accentColor, 0.28),
    ['--block-grad-end-dark' as string]: hexToRgba(accentColor, 0.20),
    ['--block-border-light' as string]: hexToRgba(accentColor, 0.22),
    ['--block-border-dark' as string]: hexToRgba(accentColor, 0.32),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`time-block-${block.type}-${block.id}`}
      className={`apple-time-block absolute rounded-[7px] px-2 ${
        isCompact ? 'py-0.5 flex items-center justify-between gap-1' : 'py-1'
      } backdrop-blur-[2px] overflow-hidden group select-none ${
        readonly ? '' : 'hover:brightness-95 dark:hover:brightness-110 transition-all cursor-grab active:cursor-grabbing'
      }`}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (transform || readonly) return;
        onClick();
      }}
    >
      {isCompact ? (
        <>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className="text-[11px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-none truncate"
              style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
            >
              {block.judul}
            </span>
            <span className="text-[10px] text-[#3A3A3C] dark:text-[#D1D1D6] font-medium tabular-nums shrink-0 leading-none">
              {formatTime(block.start)}
            </span>
          </div>
          {block.type === 'dinamis' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 -m-1 p-1"
            >
              <Checkbox
                checked={!!block.is_completed}
                onChange={() => onToggleComplete()}
                variant="pop"
                size="sm"
                disabled={readonly}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-start gap-1">
            <div
              className="text-[11px] sm:text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight truncate pr-0.5"
              style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
            >
              {block.judul}
            </div>
            {block.type === 'dinamis' && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 -m-1 p-1"
              >
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
          <div className="text-[10px] text-[#3A3A3C] dark:text-[#D1D1D6] font-medium mt-0.5 flex items-center justify-between gap-1 tabular-nums">
            <span className="truncate">{formatTime(block.start)} – {formatTime(block.end)}</span>
            <span
              className="uppercase text-[8px] font-semibold tracking-wider px-1 py-0.2 rounded-[4px] shrink-0"
              style={{
                backgroundColor: hexToRgba(accentColor, 0.20),
                color: 'inherit'
              }}
            >
              {block.type.substring(0, 3)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

