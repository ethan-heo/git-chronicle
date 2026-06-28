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
      <section className="diff-viewer-state">
        <LoadingState label={t('diff.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="diff-viewer-state">
        <ErrorState message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (isBinaryFile) {
    return (
      <section className="diff-viewer-state" role="alert">
        <EmptyState message={t('diff.binary')} />
      </section>
    );
  }

  return (
    <section className="diff-viewer" role="region" aria-label={t('diff.region_aria', { filePath })} tabIndex={0}>
      {isDeletedFile ? (
        <div className="diff-deleted-notice" role="alert">
          {t('diff.deleted_file')}
        </div>
      ) : null}
      {diffLines.length > 0 ? (
        <div className="diff-line-list" role="list">
          {diffLines.map((line, index) => (
            <DiffLine key={`${index}-${line.type}-${line.oldLineNumber ?? 'x'}-${line.newLineNumber ?? 'x'}`} line={line} />
          ))}
        </div>
      ) : (
        <div className="diff-viewer-state">
          <EmptyState message={t('diff.empty')} />
        </div>
      )}
    </section>
  );
};
