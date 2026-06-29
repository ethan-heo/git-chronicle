import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DiffViewer } from '../F03/DiffViewer';
import { useFileDiff } from '../F03/useFileDiff';

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
    <aside className={['split-side-panel', isOpen ? 'split-side-panel-open' : 'split-side-panel-closed'].filter(Boolean).join(' ')} aria-hidden={!isOpen}>
      <header className="split-side-panel-header">
        <div className="split-side-panel-title">
          <div className="split-side-panel-file">{filePath}</div>
          <div className="split-side-panel-subtitle">{t('diff.empty')}</div>
        </div>
        <button className="split-side-panel-close" type="button" onClick={onClose} aria-label={t('diff.panel_close_aria')} title={t('diff.panel_close_aria')}>
          ×
        </button>
      </header>
      <div className="split-side-panel-body">
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
