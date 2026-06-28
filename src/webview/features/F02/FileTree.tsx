import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
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
  onFileAISummary: (file: ChangedFile) => void;
}

export const FileTree: FC<FileTreeProps> = ({ changedFiles, isLoading, error, onRetry, onFileCodeView, onFileAISummary }) => {
  const { t } = useTranslation();
  const tree = useMemo(() => buildFileTree(changedFiles), [changedFiles]);
  const stats = useMemo(() => getFileStats(changedFiles), [changedFiles]);

  if (isLoading) {
    return (
      <section className="history-view-state">
        <LoadingState label={t('file_tree.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="history-view-state">
        <ErrorState message={t('file_tree.error')} onRetry={onRetry} />
      </section>
    );
  }

  if (changedFiles.length === 0) {
    return (
      <section className="history-view-state">
        <EmptyState message={t('file_tree.empty')} />
      </section>
    );
  }

  return (
    <section className="file-tree-panel" aria-label={t('file_tree.panel_aria')}>
      <div className="file-tree-summary">
        <span>{t('file_tree.panel_aria')}</span>
        <strong>{changedFiles.length}</strong>
        <div className="file-tree-stats" aria-label={t('file_tree.stats_aria')}>
          {stats.A > 0 ? <span className="file-tree-stat file-tree-stat-a">+{stats.A}</span> : null}
          {stats.M > 0 ? <span className="file-tree-stat file-tree-stat-m">~{stats.M}</span> : null}
          {stats.D > 0 ? <span className="file-tree-stat file-tree-stat-d">-{stats.D}</span> : null}
          {stats.R > 0 ? <span className="file-tree-stat file-tree-stat-r">R{stats.R}</span> : null}
        </div>
      </div>
      <div className="file-tree" role="tree" aria-label={t('file_tree.tree_aria')}>
        {tree.children.map((child) =>
          isDirectoryNode(child) ? (
            <DirectoryNode key={child.path} node={child} depth={0} onCodeView={onFileCodeView} onAISummary={onFileAISummary} />
          ) : (
            <FileTreeNode key={child.file.path} file={child.file} name={child.name} depth={0} onCodeView={onFileCodeView} onAISummary={onFileAISummary} />
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
