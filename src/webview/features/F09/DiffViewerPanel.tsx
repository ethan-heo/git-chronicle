import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DiffViewer } from '../F03/DiffViewer';
import { useFileDiff } from '../F03/useFileDiff';
import './SplitSidePanel.css';

interface DiffViewerPanelProps {
  isOpen: boolean;
  filePath: string;
  commitHash: string;
  isDeletedFile: boolean;
  onClose: () => void;
}

export const DiffViewerPanel: FC<DiffViewerPanelProps> = ({ isOpen, filePath, commitHash, isDeletedFile, onClose }) => {
  const { t } = useTranslation();
  const { diffState, loadFileDiff } = useFileDiff({ isActive: isOpen, commitHash, filePath, isDeletedFile });

  return (
    <aside
      className={[
        'split-side-panel flex min-h-0 min-w-0 flex-col overflow-hidden bg-panel',
        isOpen ? 'split-side-panel-open opacity-100 pointer-events-auto' : 'split-side-panel-closed opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      <header className="flex items-start justify-between gap-md border-b border-line px-lg py-md">
        <div className="min-w-0">
          <div className="overflow-hidden text-sm font-bold whitespace-nowrap text-ellipsis">{filePath}</div>
          <div className="mt-0.5 text-xs text-muted">{t('diff.empty')}</div>
        </div>
        <button className="rounded-sm bg-transparent px-xs text-[20px] leading-none text-muted transition-colors hover:bg-hover hover:text-text" type="button" onClick={onClose} aria-label={t('diff.panel_close_aria')} title={t('diff.panel_close_aria')}>
          ×
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DiffViewer
          diffLines={diffState.diffLines}
          filePath={filePath}
          isLoading={diffState.isLoading}
          error={diffState.error}
          isBinaryFile={diffState.isBinaryFile}
          isDeletedFile={diffState.isDeletedFile}
          onRetry={loadFileDiff}
        />
      </div>
    </aside>
  );
};
