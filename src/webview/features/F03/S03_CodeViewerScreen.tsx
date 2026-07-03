import type { FC } from 'react';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { DiffViewer } from './DiffViewer';
import { useFileDiff } from './useFileDiff';

export const S03CodeViewerScreen: FC = () => {
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
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
    <main className="app-shell flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--vscode-editor-background,var(--color-surface))]">
      <TopHeader
        title={selectedCommit.message}
        context={`${selectedCommit.shortHash} > ${selectedFile.path}`}
        showBackButton
        onBackClick={goBackFromDetail}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <div className="min-h-0 flex-1">
        <DiffViewer
          diffLines={diffState.diffLines}
          filePath={selectedFile.path}
          isLoading={diffState.isLoading}
          error={diffState.error}
          isBinaryFile={diffState.isBinaryFile}
          isDeletedFile={diffState.isDeletedFile}
          onRetry={loadFileDiff}
        />
      </div>
    </main>
  );
};
