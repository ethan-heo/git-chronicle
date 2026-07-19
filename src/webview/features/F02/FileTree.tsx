import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, LoadingState } from '../../shared/components';
import type { ChangedFile } from '../../types/commit';
import { DirectoryNode } from './DirectoryNode';
import { FileTreeNode } from './FileTreeNode';
import { buildFileTree, isDirectoryNode } from './tree';

interface FileTreeProps {
  changedFiles: ChangedFile[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  activeCodeFilePath?: string | null;
  showHeader?: boolean;
}

export const FileTree: FC<FileTreeProps> = ({
  changedFiles,
  isLoading,
  error,
  onRetry,
  onFileCodeView,
  activeCodeFilePath = null,
  showHeader = true,
}) => {
  const { t } = useTranslation();
  const tree = useMemo(() => buildFileTree(changedFiles), [changedFiles]);
  const stats = useMemo(() => getFileStats(changedFiles), [changedFiles]);

  if (isLoading) {
    return (
      <section className="flex h-full min-h-0 flex-1 items-center justify-center p-8 text-center">
        <LoadingState label={t('file_tree.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    const { message, commitHash } = parseFileTreeError(error);

    return (
      <section className="flex h-full min-h-0 flex-1 items-center justify-center p-8 text-center">
        <div className="flex max-w-[320px] flex-col items-center justify-center gap-3 text-center" role="alert">
          <p className="text-sm text-error">{message || t('file_tree.error')}</p>
          {commitHash ? (
            <code className="rounded-md border border-line bg-secondary px-2.5 py-1 font-mono text-xs text-muted">
              {commitHash}
            </code>
          ) : null}
          <button
            className="inline-flex items-center justify-center rounded-sm border border-line bg-secondary px-2.5 py-1 text-[11.5px] text-text transition-colors duration-100 ease-in-out hover:bg-secondary-hi"
            type="button"
            onClick={onRetry}
          >
            {t('common.retry')}
          </button>
        </div>
      </section>
    );
  }

  if (changedFiles.length === 0) {
    return (
      <section className="flex h-full min-h-0 flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('file_tree.empty')} />
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface" aria-label={t('file_tree.panel_aria')}>
      {showHeader ? (
        <div className="flex min-h-8 items-center gap-1.5 px-2.5 py-1 text-[10px] text-muted">
          <span className="font-bold uppercase leading-none">{t('file_tree.panel_aria')}</span>
          <strong className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium leading-none text-text">{changedFiles.length}</strong>
          <div className="inline-flex flex-1 justify-end gap-2 font-mono text-xs" aria-label={t('file_tree.stats_aria')}>
            {stats.A > 0 ? <span className="text-added">+{stats.A}</span> : null}
            {stats.M > 0 ? <span className="text-modified">~{stats.M}</span> : null}
            {stats.D > 0 ? <span className="text-deleted">-{stats.D}</span> : null}
            {stats.R > 0 ? <span className="text-renamed">R{stats.R}</span> : null}
          </div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-0 pt-0.5 pb-2" role="tree" aria-label={t('file_tree.tree_aria')}>
        {tree.children.map((child) =>
          isDirectoryNode(child) ? (
            <DirectoryNode
              key={child.path}
              node={child}
              depth={0}
              onCodeView={onFileCodeView}
              activeCodeFilePath={activeCodeFilePath}
            />
          ) : (
            <FileTreeNode
              key={child.file.path}
              file={child.file}
              name={child.name}
              depth={0}
              onCodeView={onFileCodeView}
              isCodeViewActive={activeCodeFilePath === child.file.path}
            />
          ),
        )}
      </div>
    </section>
  );
};

function getFileStats(files: ChangedFile[]): Record<ChangedFile['status'], number> {
  return files.reduce(
    (stats, file) => ({
      ...stats,
      [file.status]: stats[file.status] + 1,
    }),
    { A: 0, M: 0, D: 0, R: 0 },
  );
}

function parseFileTreeError(error: string): { message: string; commitHash: string | null } {
  const commitNotFoundPrefix = 'This commit does not exist in the local repository: ';

  if (!error.startsWith(commitNotFoundPrefix)) {
    return { message: error, commitHash: null };
  }

  return {
    message: '로컬 저장소에서 이 커밋을 찾을 수 없습니다.',
    commitHash: error.slice(commitNotFoundPrefix.length).trim() || null,
  };
}
