import type { CSSProperties, FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import './ResizableSplitPane.css';

interface ResizableSplitPaneProps {
  isOpen: boolean;
  orientation?: 'horizontal' | 'vertical';
  defaultLeftPercent?: number;
  minLeftPx?: number;
  minRightPx?: number;
  controlledLeftPx?: number;
  onLeftPxChange?: (leftPx: number, rightPx: number) => void;
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

const DIVIDER_WIDTH_PX = 6;

export const ResizableSplitPane: FC<ResizableSplitPaneProps> = ({
  isOpen,
  orientation = 'horizontal',
  defaultLeftPercent = 60,
  minLeftPx = 280,
  minRightPx = 280,
  controlledLeftPx,
  onLeftPxChange,
  left,
  right,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidthPercent, setLeftWidthPercent] = useState(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLeftWidthPercent(defaultLeftPercent);
    }
  }, [defaultLeftPercent, isOpen]);

  useEffect(() => {
    if (!isDragging) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';

    const handleMove = (event: MouseEvent): void => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const usableMainAxis = (orientation === 'horizontal' ? rect.width : rect.height) - DIVIDER_WIDTH_PX;
      if (usableMainAxis <= 0) return;

      const pointerOffset = orientation === 'horizontal' ? event.clientX - rect.left : event.clientY - rect.top;
      const clampedLeftPx = Math.min(usableMainAxis - minRightPx, Math.max(minLeftPx, pointerOffset));

      if (typeof controlledLeftPx === 'number') {
        onLeftPxChange?.(clampedLeftPx, usableMainAxis - clampedLeftPx);
        return;
      }

      const minLeftPercent = (minLeftPx / usableMainAxis) * 100;
      const minRightPercent = (minRightPx / usableMainAxis) * 100;
      const nextLeftPercent = (clampedLeftPx / usableMainAxis) * 100;
      const clampedLeftPercent = Math.min(100 - minRightPercent, Math.max(minLeftPercent, nextLeftPercent));
      setLeftWidthPercent(clampedLeftPercent);
    };

    const handleUp = (): void => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [controlledLeftPx, isDragging, minLeftPx, minRightPx, onLeftPxChange, orientation]);

  const leftStyle: CSSProperties = !isOpen
    ? { flex: '1 1 auto', width: '100%', height: '100%' }
    : typeof controlledLeftPx === 'number'
      ? orientation === 'horizontal'
        ? { flex: `0 0 ${controlledLeftPx}px`, width: `${controlledLeftPx}px` }
        : { flex: `0 0 ${controlledLeftPx}px`, height: `${controlledLeftPx}px` }
      : orientation === 'horizontal'
        ? { flex: `0 0 ${leftWidthPercent}%`, width: `${leftWidthPercent}%` }
        : { flex: `0 0 ${leftWidthPercent}%`, height: `${leftWidthPercent}%` };

  return (
    <section
      ref={containerRef}
      className={[
        'flex h-full min-h-0 w-full flex-1 overflow-hidden',
        orientation === 'vertical' ? 'flex-col' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden flex-[1_1_auto]" style={leftStyle}>
        {left}
      </div>
      {isOpen ? (
        <div
          className={[
            'split-pane-divider relative bg-transparent transition-colors duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_20%,transparent)]',
            orientation === 'horizontal' ? 'flex-[0_0_6px] cursor-col-resize' : 'flex-[0_0_6px] cursor-row-resize',
            isDragging ? 'split-pane-divider--dragging' : '',
          ].filter(Boolean).join(' ')}
          role="separator"
          aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
          tabIndex={0}
          onMouseDown={() => setIsDragging(true)}
        >
          <span
            className={[
              'split-pane-divider-line absolute bg-line',
              orientation === 'horizontal'
                ? 'inset-y-0 left-1/2 w-px -translate-x-1/2'
                : 'inset-x-0 top-1/2 h-px -translate-y-1/2',
            ].join(' ')}
          />
        </div>
      ) : null}
      {isOpen ? <div className="flex min-h-0 min-w-0 flex-[1_1_auto] flex-col overflow-hidden">{right}</div> : null}
    </section>
  );
};
