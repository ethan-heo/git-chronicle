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
  onFileAIView: (file: ChangedFile) => void;
  onFileSymbolGraph: (file: ChangedFile) => void;
  activeAIFilePath?: string | null;
  activeCodeFilePath?: string | null;
  activeSymbolGraphFilePath?: string | null;
}

export const FileTree: FC<FileTreeProps> = ({
  changedFiles,
  isLoading,
  error,
  onRetry,
  onFileCodeView,
  onFileAIView,
  onFileSymbolGraph,
  activeAIFilePath = null,
  activeCodeFilePath = null,
  activeSymbolGraphFilePath = null,
}) => {
  const { t } = useTranslation();
  const tree = useMemo(() => buildFileTree(changedFiles), [changedFiles]);
  const stats = useMemo(() => getFileStats(changedFiles), [changedFiles]);

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center p-8 text-center">
        <LoadingState label={t('file_tree.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-1 items-center justify-center p-8 text-center">
        <ErrorState message={t('file_tree.error')} onRetry={onRetry} />
      </section>
    );
  }

  if (changedFiles.length === 0) {
    return (
      <section className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('file_tree.empty')} />
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-surface" aria-label={t('file_tree.panel_aria')}>
      <div className="flex items-center gap-[7px] px-2.5 pt-1.5 pb-[5px] text-[11px] text-muted">
        <span className="font-bold uppercase">{t('file_tree.panel_aria')}</span>
        <strong className="rounded-full bg-secondary px-[7px] py-px text-xs font-medium text-text">{changedFiles.length}</strong>
        <div className="inline-flex flex-1 justify-end gap-2 font-mono text-xs" aria-label={t('file_tree.stats_aria')}>
          {stats.A > 0 ? <span className="text-added">+{stats.A}</span> : null}
          {stats.M > 0 ? <span className="text-modified">~{stats.M}</span> : null}
          {stats.D > 0 ? <span className="text-deleted">-{stats.D}</span> : null}
          {stats.R > 0 ? <span className="text-renamed">R{stats.R}</span> : null}
        </div>
      </div>
      <div className="px-0 pt-0.5 pb-2" role="tree" aria-label={t('file_tree.tree_aria')}>
        {tree.children.map((child) =>
          isDirectoryNode(child) ? (
            <DirectoryNode
              key={child.path}
              node={child}
              depth={0}
              onCodeView={onFileCodeView}
              onAIView={onFileAIView}
              onSymbolGraph={onFileSymbolGraph}
              activeAIFilePath={activeAIFilePath}
              activeCodeFilePath={activeCodeFilePath}
              activeSymbolGraphFilePath={activeSymbolGraphFilePath}
            />
          ) : (
            <FileTreeNode
              key={child.file.path}
              file={child.file}
              name={child.name}
              depth={0}
              onCodeView={onFileCodeView}
              onAIView={onFileAIView}
              onSymbolGraph={onFileSymbolGraph}
              isCodeViewActive={activeCodeFilePath === child.file.path}
              isAIViewActive={activeAIFilePath === child.file.path}
              isSymbolGraphActive={activeSymbolGraphFilePath === child.file.path}
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
