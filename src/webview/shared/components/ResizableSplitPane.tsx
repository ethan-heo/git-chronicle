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

export const DIVIDER_WIDTH_PX = 6;

function resolveMinPaneSizes(
  usableMainAxis: number,
  minLeftPx: number,
  minRightPx: number,
): { minLeft: number; minRight: number } {
  if (usableMainAxis <= 0) {
    return { minLeft: 0, minRight: 0 };
  }

  if (minLeftPx + minRightPx <= usableMainAxis) {
    return { minLeft: minLeftPx, minRight: minRightPx };
  }

  const fallbackMin = Math.floor(usableMainAxis / 2);
  const minLeft = Math.min(minLeftPx, fallbackMin);
  const minRight = Math.min(minRightPx, usableMainAxis - minLeft);

  return { minLeft, minRight };
}

function clampSplitSizes(input: {
  usableMainAxis: number;
  minLeftPx: number;
  minRightPx: number;
  controlledLeftPx?: number;
  leftPercent?: number;
}): { leftPx: number; rightPx: number } {
  const { usableMainAxis, minLeftPx, minRightPx, controlledLeftPx, leftPercent } = input;

  if (usableMainAxis <= 0) {
    return { leftPx: 0, rightPx: 0 };
  }

  const { minLeft, minRight } = resolveMinPaneSizes(usableMainAxis, minLeftPx, minRightPx);
  const requestedLeftPx = typeof controlledLeftPx === 'number'
    ? controlledLeftPx
    : usableMainAxis * ((leftPercent ?? 50) / 100);
  const maxLeftPx = Math.max(minLeft, usableMainAxis - minRight);
  const leftPx = Math.min(maxLeftPx, Math.max(minLeft, requestedLeftPx));
  const rightPx = Math.max(0, usableMainAxis - leftPx);

  return { leftPx, rightPx };
}

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
  const [containerMainSizePx, setContainerMainSizePx] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = (): void => {
      const rect = container.getBoundingClientRect();
      setContainerMainSizePx(orientation === 'horizontal' ? rect.width : rect.height);
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [orientation]);

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
      const { minLeft, minRight } = resolveMinPaneSizes(usableMainAxis, minLeftPx, minRightPx);

      const pointerOffset = orientation === 'horizontal' ? event.clientX - rect.left : event.clientY - rect.top;
      const clampedLeftPx = Math.min(usableMainAxis - minRight, Math.max(minLeft, pointerOffset));

      if (typeof controlledLeftPx === 'number') {
        onLeftPxChange?.(clampedLeftPx, usableMainAxis - clampedLeftPx);
        return;
      }

      const minLeftPercent = (minLeft / usableMainAxis) * 100;
      const minRightPercent = (minRight / usableMainAxis) * 100;
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

  const splitSizes = (() => {
    if (!isOpen || containerMainSizePx === null) {
      return null;
    }

    return clampSplitSizes({
      usableMainAxis: Math.max(0, containerMainSizePx - DIVIDER_WIDTH_PX),
      minLeftPx,
      minRightPx,
      controlledLeftPx,
      leftPercent: leftWidthPercent,
    });
  })();

  const leftStyle: CSSProperties = !isOpen
    ? { flex: '1 1 auto', width: '100%', height: '100%' }
    : splitSizes
      ? orientation === 'horizontal'
        ? { flex: `0 0 ${splitSizes.leftPx}px`, width: `${splitSizes.leftPx}px` }
        : { flex: `0 0 ${splitSizes.leftPx}px`, height: `${splitSizes.leftPx}px` }
      : orientation === 'horizontal'
        ? { flex: `0 0 calc((100% - ${DIVIDER_WIDTH_PX}px) * ${leftWidthPercent / 100})`, width: `calc((100% - ${DIVIDER_WIDTH_PX}px) * ${leftWidthPercent / 100})` }
        : { flex: `0 0 calc((100% - ${DIVIDER_WIDTH_PX}px) * ${leftWidthPercent / 100})`, height: `calc((100% - ${DIVIDER_WIDTH_PX}px) * ${leftWidthPercent / 100})` };

  const rightStyle: CSSProperties = !isOpen
    ? { flex: '1 1 auto', width: '100%', height: '100%' }
    : splitSizes
      ? orientation === 'horizontal'
        ? { flex: `0 0 ${splitSizes.rightPx}px`, width: `${splitSizes.rightPx}px` }
        : { flex: `0 0 ${splitSizes.rightPx}px`, height: `${splitSizes.rightPx}px` }
      : orientation === 'horizontal'
        ? { flex: `0 0 calc((100% - ${DIVIDER_WIDTH_PX}px) * ${(100 - leftWidthPercent) / 100})`, width: `calc((100% - ${DIVIDER_WIDTH_PX}px) * ${(100 - leftWidthPercent) / 100})` }
        : { flex: `0 0 calc((100% - ${DIVIDER_WIDTH_PX}px) * ${(100 - leftWidthPercent) / 100})`, height: `calc((100% - ${DIVIDER_WIDTH_PX}px) * ${(100 - leftWidthPercent) / 100})` };

  return (
    <section
      ref={containerRef}
      className={[
        'flex h-full min-h-0 w-full flex-1 overflow-hidden',
        orientation === 'vertical' ? 'flex-col' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden" style={leftStyle}>
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
      {isOpen ? <div className="flex min-h-0 min-w-0 flex-col overflow-hidden" style={rightStyle}>{right}</div> : null}
    </section>
  );
};
