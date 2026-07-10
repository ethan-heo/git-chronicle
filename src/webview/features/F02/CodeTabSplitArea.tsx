import type { FC } from 'react';
import { ResizableSplitPane } from '../../shared/components';
import type { WorkspaceTab } from '../../store/slices/workspaceTabsSlice';
import type { ChangedFile } from '../../types/commit';
import { CodeDiffPanel } from '../F03';
import { AISummaryPanel } from '../F05b';
import { SymbolGraphPanel, useSymbolGraph } from '../F10';
import { FileAISummaryToggleButton } from './FileAISummaryToggleButton';
import { SymbolGraphToggleButton } from './SymbolGraphToggleButton';

interface CodeTabSplitAreaProps {
  tab: WorkspaceTab;
  isActive: boolean;
  selectedFile: ChangedFile | null;
  onToggleInnerPanel: (panel: 'aiSummary' | 'symbolGraph') => void;
  onGoToSettings: () => void;
}

export const CodeTabSplitArea: FC<CodeTabSplitAreaProps> = ({
  tab,
  isActive,
  selectedFile,
  onToggleInnerPanel,
  onGoToSettings,
}) => {
  const codeInnerPanels = tab.codeInnerPanels ?? { aiSummary: false, symbolGraph: false };
  const symbolGraph = useSymbolGraph({
    isActive: isActive && codeInnerPanels.symbolGraph,
    tabId: tab.id,
    selectedFile,
    // 'code' 탭은 항상 commit을 가진다는 것이 WorkspaceTab의 불변식이다.
    commitHash: tab.commit?.hash ?? '',
  });

  if (!tab.filePath || !tab.commit) {
    return null;
  }
  const showRightPane = codeInnerPanels.aiSummary || codeInnerPanels.symbolGraph;
  const rightPane = codeInnerPanels.aiSummary && codeInnerPanels.symbolGraph
    ? (
      <ResizableSplitPane
        isOpen
        orientation="vertical"
        defaultLeftPercent={50}
        minLeftPx={180}
        minRightPx={180}
        className="h-full min-h-0"
        left={(
          <AISummaryPanel
            isActive={isActive}
            targetFile={selectedFile}
            commit={tab.commit}
            onGoToSettings={onGoToSettings}
          />
        )}
        right={<SymbolGraphPanel data={symbolGraph} />}
      />
    )
    : codeInnerPanels.aiSummary
      ? (
        <AISummaryPanel
          isActive={isActive}
          targetFile={selectedFile}
          commit={tab.commit}
          onGoToSettings={onGoToSettings}
        />
      )
      : <SymbolGraphPanel data={symbolGraph} />;

  return (
    <ResizableSplitPane
      isOpen={showRightPane}
      defaultLeftPercent={56}
      minLeftPx={300}
      minRightPx={280}
      className="h-full min-h-0"
      left={(
        <div className="group relative h-full min-h-0">
          <div className="pointer-events-none absolute top-3 right-3 z-[4] flex items-center gap-2 opacity-0 transition-opacity duration-100 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
            <FileAISummaryToggleButton
              isActive={codeInnerPanels.aiSummary}
              onClick={() => onToggleInnerPanel('aiSummary')}
            />
            <SymbolGraphToggleButton
              isActive={codeInnerPanels.symbolGraph}
              disabled={selectedFile?.status === 'D'}
              onClick={() => onToggleInnerPanel('symbolGraph')}
            />
          </div>
          <CodeDiffPanel
            isActive={isActive}
            commitHash={tab.commit.hash}
            filePath={tab.filePath}
            isDeletedFile={selectedFile?.status === 'D'}
            highlightRange={
              symbolGraph.highlightedRange
                ? { start: symbolGraph.highlightedRange.lineStart, end: symbolGraph.highlightedRange.lineEnd }
                : null
            }
            scrollToRange={symbolGraph.scrollToRange}
            scrollRequestId={symbolGraph.scrollRequestId}
          />
        </div>
      )}
      right={rightPane}
    />
  );
};
