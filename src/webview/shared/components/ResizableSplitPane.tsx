import type { CSSProperties, FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import './ResizableSplitPane.css';

interface ResizableSplitPaneProps {
  isOpen: boolean;
  defaultLeftPercent?: number;
  minLeftPx?: number;
  minRightPx?: number;
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

const DIVIDER_WIDTH_PX = 6;

export const ResizableSplitPane: FC<ResizableSplitPaneProps> = ({
  isOpen,
  defaultLeftPercent = 60,
  minLeftPx = 280,
  minRightPx = 280,
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
    document.body.style.cursor = 'col-resize';

    const handleMove = (event: MouseEvent): void => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const usableWidth = rect.width - DIVIDER_WIDTH_PX;
      if (usableWidth <= 0) return;

      const minLeftPercent = (minLeftPx / usableWidth) * 100;
      const minRightPercent = (minRightPx / usableWidth) * 100;
      const nextLeftPercent = ((event.clientX - rect.left) / usableWidth) * 100;
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
  }, [isDragging, minLeftPx, minRightPx]);

  const leftStyle: CSSProperties = isOpen
    ? { flex: `0 0 ${leftWidthPercent}%`, width: `${leftWidthPercent}%` }
    : { flex: '1 1 auto', width: '100%' };

  return (
    <section ref={containerRef} className={['flex h-full min-h-0 w-full flex-1 overflow-hidden', className].filter(Boolean).join(' ')}>
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden flex-[1_1_auto]" style={leftStyle}>
        {left}
      </div>
      {isOpen ? (
        <div
          className={['split-pane-divider relative flex-[0_0_6px] cursor-col-resize bg-transparent transition-colors duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_20%,transparent)]', isDragging ? 'split-pane-divider--dragging' : ''].filter(Boolean).join(' ')}
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          onMouseDown={() => setIsDragging(true)}
        >
          <span className="split-pane-divider-line absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
        </div>
      ) : null}
      {isOpen ? <div className="flex min-h-0 min-w-0 flex-[1_1_auto] flex-col overflow-hidden">{right}</div> : null}
    </section>
  );
};
