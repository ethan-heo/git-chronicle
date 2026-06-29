import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableSplitPane, SplitViewButton, TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { DiffViewer } from './DiffViewer';
import { useFileDiff } from './useFileDiff';
import { AISummaryPanel } from '../F09/AISummaryPanel';

export const S03CodeViewerScreen: FC = () => {
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const isSplitPanelOpen = useAppStore((state) => state.isSplitPanelOpen);
  const openSplitPanel = useAppStore((state) => state.openSplitPanel);
  const closeSplitPanel = useAppStore((state) => state.closeSplitPanel);
  const isRouteSlotActive = useRouteSlotActive();
  const { diffState, loadFileDiff } = useFileDiff({
    isActive: isRouteSlotActive,
    commitHash: selectedCommit?.hash ?? null,
    filePath: selectedFile?.path ?? null,
    isDeletedFile: selectedFile?.status === 'D',
  });

  if (!selectedCommit || !selectedFile) {
    return null;
  }

  return (
    <main className="app-shell commit-log-shell code-viewer-shell">
      <TopHeader
        title={selectedCommit.message}
        context={`${selectedCommit.shortHash} > ${selectedFile.path}`}
        showBackButton
        onBackClick={goBackFromDetail}
        endSlot={<SplitViewButton label={t(isSplitPanelOpen ? 'ai_summary.split_panel_hide' : 'ai_summary.split_view')} disabled={!selectedFile} onClick={isSplitPanelOpen ? closeSplitPanel : openSplitPanel} />}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <ResizableSplitPane
        isOpen={isSplitPanelOpen}
        className="code-split-workspace"
        left={(
          <DiffViewer
            diffLines={diffState.diffLines}
            filePath={selectedFile.path}
            isLoading={diffState.isLoading}
            error={diffState.error}
            isBinaryFile={diffState.isBinaryFile}
            isDeletedFile={diffState.isDeletedFile}
            onRetry={loadFileDiff}
          />
        )}
        right={<AISummaryPanel isOpen={isSplitPanelOpen} filePath={selectedFile.path} onClose={closeSplitPanel} onGoToSettings={goToSettingsView} />}
      />
    </main>
  );
};
