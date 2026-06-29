import type { CSSProperties, FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

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
    <section ref={containerRef} className={['resizable-split-pane', className].filter(Boolean).join(' ')}>
      <div className="split-pane-panel split-pane-panel-left" style={leftStyle}>
        {left}
      </div>
      {isOpen ? (
        <div
          className={['split-pane-divider', isDragging ? 'split-pane-divider--dragging' : ''].filter(Boolean).join(' ')}
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          onMouseDown={() => setIsDragging(true)}
        >
          <span className="split-pane-divider-line" />
        </div>
      ) : null}
      {isOpen ? <div className="split-pane-panel split-pane-panel-right">{right}</div> : null}
    </section>
  );
};
