import type { FC } from 'react';
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
  if (isLoading) {
    return (
      <section className="diff-viewer-state">
        <LoadingState label="코드 변경이력을 불러오는 중..." size="lg" />
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
        <EmptyState message="Binary file — diff를 표시할 수 없습니다" />
      </section>
    );
  }

  return (
    <section className="diff-viewer" role="region" aria-label={`${filePath} 코드 변경 내역`} tabIndex={0}>
      {isDeletedFile ? (
        <div className="diff-deleted-notice" role="alert">
          삭제된 파일입니다
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
          <EmptyState message="표시할 diff가 없습니다" />
        </div>
      )}
    </section>
  );
};
