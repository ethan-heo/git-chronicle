import type { FC } from 'react';
import type { WorkspaceTab } from '../../store/slices/workspaceTabsSlice';
import type { ChangedFile } from '../../types/commit';
import { CodeInnerPaneTree } from './CodeInnerPaneTree';

interface CodeTabSplitAreaProps {
  tab: WorkspaceTab;
  isActive: boolean;
  selectedFile: ChangedFile | null;
  isSelectedFilePending: boolean;
  onToggleInnerPanel: (panel: 'aiSummary' | 'symbolGraph') => void;
  onMoveInnerPanel: (input: {
    sourcePanel: 'diff' | 'aiSummary' | 'symbolGraph';
    targetPanel: 'diff' | 'aiSummary' | 'symbolGraph';
    zone: 'left' | 'right' | 'top' | 'bottom';
  }) => void;
  onResizeInnerSplit: (nodeId: string, sizePercent: number) => void;
  onGoToSettings: () => void;
}

export const CodeTabSplitArea: FC<CodeTabSplitAreaProps> = ({
  tab,
  isActive,
  selectedFile,
  isSelectedFilePending,
  onToggleInnerPanel,
  onMoveInnerPanel,
  onResizeInnerSplit,
  onGoToSettings,
}) => {
  if (!tab.filePath || !tab.commit) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <CodeInnerPaneTree
        tab={tab}
        isActive={isActive}
        selectedFile={selectedFile}
        isSelectedFilePending={isSelectedFilePending}
        onToggleInnerPanel={onToggleInnerPanel}
        onMoveInnerPanel={onMoveInnerPanel}
        onResizeInnerSplit={onResizeInnerSplit}
        onGoToSettings={onGoToSettings}
      />
    </div>
  );
};
