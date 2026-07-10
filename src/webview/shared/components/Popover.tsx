import { useEffect, useId, useLayoutEffect, useRef, useState, type FC, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Popover: FC<PopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  labelledBy,
  className,
  children,
}) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const hasFocusedOnOpenRef = useRef(false);
  const fallbackLabelId = useId();
  const labelId = labelledBy ?? fallbackLabelId;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = (): void => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const margin = 16;
      const nextTop = Math.min(anchorRect.bottom + 8, window.innerHeight - popoverRect.height - margin);
      const nextLeft = Math.max(
        margin,
        Math.min(anchorRect.right - popoverRect.width, window.innerWidth - popoverRect.width - margin),
      );

      setPosition({
        top: Math.max(margin, nextTop),
        left: nextLeft,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      hasFocusedOnOpenRef.current = false;
      return;
    }

    const popover = popoverRef.current;
    if (!popover) {
      return;
    }

    if (!hasFocusedOnOpenRef.current) {
      const focusTarget = popover.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      focusTarget?.focus();
      hasFocusedOnOpenRef.current = true;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal((
    <div
      ref={popoverRef}
      style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      className={[
        'fixed z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-panel shadow-[0_14px_40px_rgba(0,0,0,0.32)]',
        className,
      ].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelId}
    >
      {children}
    </div>
  ), document.body);
};
