import { useEffect } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { DiffLine } from './DiffLine';
import type { DiffLineData } from './types';

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
    <section
      className="min-h-0 min-w-0 flex-1 overflow-auto bg-[var(--vscode-editor-background,var(--color-surface))] font-mono text-[var(--vscode-editor-font-size,13px)] leading-[1.52] text-[var(--vscode-editor-foreground,var(--color-text))] focus-visible:outline-1 focus-visible:outline-focus focus-visible:outline-offset-[-1px]"
      role="region"
      aria-label={t('diff.region_aria', { filePath })}
      tabIndex={0}
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
            <DiffLine key={`${index}-${line.type}-${line.oldLineNumber ?? 'x'}-${line.newLineNumber ?? 'x'}`} line={line} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--vscode-editor-background,var(--color-surface))] p-8">
          <EmptyState message={t('diff.empty')} />
        </div>
      )}
    </section>
  );
};
