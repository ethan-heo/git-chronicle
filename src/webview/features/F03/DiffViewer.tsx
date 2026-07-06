import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { DiffLine } from './DiffLine';
import type { DiffLineData } from './types';
import { CopyMarkdownButton, diffRangeToMarkdown } from '../F11';

interface DiffViewerProps {
  diffLines: DiffLineData[];
  filePath: string;
  isLoading: boolean;
  error: string | null;
  isBinaryFile: boolean;
  isDeletedFile: boolean;
  onRetry: () => void;
}

export const DiffViewer: FC<DiffViewerProps> = ({
  diffLines,
  filePath,
  isLoading,
  error,
  isBinaryFile,
  isDeletedFile,
  onRetry,
}) => {
  const { t } = useTranslation();
  const pushToast = useAppStore((state) => state.pushToast);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingSelectionStartRef = useRef<number | null>(null);
  const hasDraggedSelectionRef = useRef(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [copyButtonPosition, setCopyButtonPosition] = useState<{ x: number; y: number } | null>(null);

  const selectedRange = useMemo(() => {
    if (selectionStart === null || selectionEnd === null) {
      return null;
    }
    return {
      start: Math.min(selectionStart, selectionEnd),
      end: Math.max(selectionStart, selectionEnd),
    };
  }, [selectionEnd, selectionStart]);

  useEffect(() => {
    if (!isDraggingSelection) {
      return;
    }

    const handleMouseUp = (): void => {
      setIsDraggingSelection(false);
      pendingSelectionStartRef.current = null;
      hasDraggedSelectionRef.current = false;
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingSelection]);

  useEffect(() => {
    if (isLoading || error || isBinaryFile || diffLines.length === 0) {
      return;
    }

    const firstChange = document.querySelector('.diff-line-added, .diff-line-removed') as HTMLElement | null;
    firstChange?.scrollIntoView({ block: 'center' });
  }, [diffLines, error, isBinaryFile, isLoading]);

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-[var(--vscode-editor-background,var(--color-surface))] p-8">
        <LoadingState label={t('diff.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-[var(--vscode-editor-background,var(--color-surface))] p-8">
        <ErrorState message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (isBinaryFile) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-[var(--vscode-editor-background,var(--color-surface))] p-8" role="alert">
        <EmptyState message={t('diff.binary')} />
      </section>
    );
  }

  return (
    <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--vscode-editor-background,var(--color-surface))]">
      {selectedRange && copyButtonPosition ? (
        <div
          className="absolute z-[3]"
          style={{
            left: `${copyButtonPosition.x}px`,
            top: `${copyButtonPosition.y}px`,
            transform: 'translate(8px, -50%)',
          }}
        >
          <CopyMarkdownButton className="opacity-100" onClick={() => {
            void navigator.clipboard.writeText(diffRangeToMarkdown(filePath, diffLines, selectedRange.start, selectedRange.end));
            pushToast('선택한 diff를 복사했습니다', 'success');
          }}
          />
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="min-h-0 min-w-0 h-full overflow-auto font-mono text-[var(--vscode-editor-font-size,13px)] leading-[1.52] text-[var(--vscode-editor-foreground,var(--color-text))] focus-visible:outline-1 focus-visible:outline-focus focus-visible:outline-offset-[-1px]"
        role="region"
        aria-label={t('diff.region_aria', { filePath })}
        tabIndex={0}
        onMouseDown={() => {
          setCopyButtonPosition(null);
        }}
      >
      {isDeletedFile ? (
        <div
          className="sticky top-0 z-[1] border-b border-line bg-[color-mix(in_srgb,var(--color-warning)_16%,var(--color-panel))] px-3 py-2 text-sm text-text"
          role="alert"
        >
          {t('diff.deleted_file')}
        </div>
      ) : null}
      {diffLines.length > 0 ? (
        <div className="min-w-max px-0 pt-1 pb-3" role="list">
          {diffLines.map((line, index) => (
            <div
              key={`${index}-${line.type}-${line.oldLineNumber ?? 'x'}-${line.newLineNumber ?? 'x'}`}
              onMouseDown={(event) => {
                event.preventDefault();
                pendingSelectionStartRef.current = index;
                hasDraggedSelectionRef.current = false;
                setIsDraggingSelection(true);
                setSelectionStart(null);
                setSelectionEnd(null);
                setCopyButtonPosition(null);
              }}
              onMouseEnter={() => {
                if (!isDraggingSelection) {
                  return;
                }

                const pendingStart = pendingSelectionStartRef.current;
                if (pendingStart === null) {
                  return;
                }

                if (!hasDraggedSelectionRef.current) {
                  hasDraggedSelectionRef.current = true;
                  setSelectionStart(pendingStart);
                }

                setSelectionEnd(index);
              }}
              onMouseUp={(event) => {
                const pendingStart = pendingSelectionStartRef.current;

                if (!hasDraggedSelectionRef.current || pendingStart === null) {
                  setIsDraggingSelection(false);
                  pendingSelectionStartRef.current = null;
                  hasDraggedSelectionRef.current = false;
                  setSelectionStart(null);
                  setSelectionEnd(null);
                  setCopyButtonPosition(null);
                  return;
                }

                if (!containerRef.current) {
                  setIsDraggingSelection(false);
                  pendingSelectionStartRef.current = null;
                  hasDraggedSelectionRef.current = false;
                  return;
                }

                const rect = containerRef.current.getBoundingClientRect();
                setIsDraggingSelection(false);
                setSelectionEnd(index);
                pendingSelectionStartRef.current = null;
                hasDraggedSelectionRef.current = false;
                setCopyButtonPosition({
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                });
              }}
            >
              <DiffLine
                line={line}
                isSelected={Boolean(selectedRange && index >= selectedRange.start && index <= selectedRange.end)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--vscode-editor-background,var(--color-surface))] p-8">
          <EmptyState message={t('diff.empty')} />
        </div>
      )}
      </div>
    </section>
  );
};
