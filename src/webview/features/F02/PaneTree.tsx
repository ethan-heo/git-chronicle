import { createContext, useContext, useMemo, useState, type FC, type ReactNode } from 'react';
import { EmptyState, ResizableSplitPane } from '../../shared/components';
import { findLeafPane, getActiveTab, type DropZone, type PaneLeafNode, type PaneNode, type WorkspaceTab } from '../../store/slices/workspaceTabsSlice';
import { WorkspaceTabBar } from './WorkspaceTabBar';

interface PaneTreeProps {
  paneTree: PaneNode;
  focusedPaneId: string;
  activeSummaryCommitHash: string | null;
  isGeneratingSummary: boolean;
  onActivateTab: (paneId: string, tabId: string) => void;
  onCloseTab: (paneId: string, tabId: string) => void;
  onFocusPane: (paneId: string) => void;
  onSplitTab: (input: { sourcePaneId: string; tabId: string; targetPaneId: string; zone: DropZone }) => void;
  onResizeSplit: (paneId: string, sizePercent: number) => void;
  renderFixedActions: (paneId: string, activeTab: WorkspaceTab | null) => ReactNode;
  renderPanel: (paneId: string, activeTab: WorkspaceTab | null) => ReactNode;
}

interface DragState {
  sourcePaneId: string;
  tabId: string;
}

const PaneDragContext = createContext<{
  dragState: DragState | null;
  setDragState: (state: DragState | null) => void;
} | null>(null);

export const PaneTree: FC<PaneTreeProps> = (props) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const contextValue = useMemo(() => ({ dragState, setDragState }), [dragState]);

  return (
    <PaneDragContext.Provider value={contextValue}>
      <PaneNodeRenderer {...props} node={props.paneTree} />
    </PaneDragContext.Provider>
  );
};

const PaneNodeRenderer: FC<PaneTreeProps & { node: PaneNode }> = ({
  node,
  paneTree,
  focusedPaneId,
  activeSummaryCommitHash,
  isGeneratingSummary,
  onActivateTab,
  onCloseTab,
  onFocusPane,
  onSplitTab,
  onResizeSplit,
  renderFixedActions,
  renderPanel,
}) => {
  if (node.kind === 'split') {
    return (
      <ResizableSplitPane
        isOpen
        orientation={node.orientation}
        defaultLeftPercent={node.sizePercent}
        className="h-full min-h-0"
        left={(
          <PaneNodeRenderer
            node={node.children[0]}
            paneTree={paneTree}
            focusedPaneId={focusedPaneId}
            activeSummaryCommitHash={activeSummaryCommitHash}
            isGeneratingSummary={isGeneratingSummary}
            onActivateTab={onActivateTab}
            onCloseTab={onCloseTab}
            onFocusPane={onFocusPane}
            onSplitTab={onSplitTab}
            onResizeSplit={onResizeSplit}
            renderFixedActions={renderFixedActions}
            renderPanel={renderPanel}
          />
        )}
        right={(
          <PaneNodeRenderer
            node={node.children[1]}
            paneTree={paneTree}
            focusedPaneId={focusedPaneId}
            activeSummaryCommitHash={activeSummaryCommitHash}
            isGeneratingSummary={isGeneratingSummary}
            onActivateTab={onActivateTab}
            onCloseTab={onCloseTab}
            onFocusPane={onFocusPane}
            onSplitTab={onSplitTab}
            onResizeSplit={onResizeSplit}
            renderFixedActions={renderFixedActions}
            renderPanel={renderPanel}
          />
        )}
        onLeftPxChange={(leftPx, rightPx) => {
          const total = leftPx + rightPx;
          if (total > 0) {
            onResizeSplit(node.paneId, (leftPx / total) * 100);
          }
        }}
      />
    );
  }

  return (
    <WorkspacePane
      pane={node}
      isFocused={focusedPaneId === node.paneId}
      activeSummaryCommitHash={activeSummaryCommitHash}
      isGeneratingSummary={isGeneratingSummary}
      onActivateTab={onActivateTab}
      onCloseTab={onCloseTab}
      onFocusPane={onFocusPane}
      onSplitTab={onSplitTab}
      renderFixedActions={renderFixedActions}
      renderPanel={renderPanel}
    />
  );
};

const WorkspacePane: FC<{
  pane: PaneLeafNode;
  isFocused: boolean;
  activeSummaryCommitHash: string | null;
  isGeneratingSummary: boolean;
  onActivateTab: (paneId: string, tabId: string) => void;
  onCloseTab: (paneId: string, tabId: string) => void;
  onFocusPane: (paneId: string) => void;
  onSplitTab: (input: { sourcePaneId: string; tabId: string; targetPaneId: string; zone: DropZone }) => void;
  renderFixedActions: (paneId: string, activeTab: WorkspaceTab | null) => ReactNode;
  renderPanel: (paneId: string, activeTab: WorkspaceTab | null) => ReactNode;
}> = ({
  pane,
  isFocused,
  activeSummaryCommitHash,
  isGeneratingSummary,
  onActivateTab,
  onCloseTab,
  onFocusPane,
  onSplitTab,
  renderFixedActions,
  renderPanel,
}) => {
  const dragContext = useContext(PaneDragContext);
  const activeTab = getActiveTab(pane);
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const isDropEnabled = Boolean(dragContext?.dragState && !(dragContext.dragState.sourcePaneId === pane.paneId && pane.tabs.length <= 1));

  return (
    <div
      className={[
        'relative flex h-full min-h-0 flex-col overflow-hidden bg-surface',
        isFocused ? 'ring-1 ring-inset ring-accent/50' : '',
      ].join(' ')}
      onMouseDown={() => onFocusPane(pane.paneId)}
      onDragOver={(event) => {
        if (!isDropEnabled) {
          return;
        }

        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const thresholdX = rect.width * 0.25;
        const thresholdY = rect.height * 0.25;
        let nextZone: DropZone | null = null;

        if (x <= thresholdX) {
          nextZone = 'left';
        } else if (x >= rect.width - thresholdX) {
          nextZone = 'right';
        } else if (y <= thresholdY) {
          nextZone = 'top';
        } else if (y >= rect.height - thresholdY) {
          nextZone = 'bottom';
        }

        setDropZone(nextZone);
      }}
      onDragLeave={() => setDropZone(null)}
      onDrop={(event) => {
        event.preventDefault();
        if (!dragContext?.dragState || !dropZone) {
          setDropZone(null);
          return;
        }

        onSplitTab({
          sourcePaneId: dragContext.dragState.sourcePaneId,
          tabId: dragContext.dragState.tabId,
          targetPaneId: pane.paneId,
          zone: dropZone,
        });
        dragContext.setDragState(null);
        setDropZone(null);
      }}
    >
      <WorkspaceTabBar
        paneId={pane.paneId}
        tabs={pane.tabs}
        activeTabId={pane.activeTabId}
        activeSummaryCommitHash={activeSummaryCommitHash}
        isGeneratingSummary={isGeneratingSummary}
        onActivateTab={(tabId) => onActivateTab(pane.paneId, tabId)}
        onCloseTab={(tabId) => onCloseTab(pane.paneId, tabId)}
        onDragTabStart={(tabId) => dragContext?.setDragState({ sourcePaneId: pane.paneId, tabId })}
        onDragTabEnd={() => {
          dragContext?.setDragState(null);
          setDropZone(null);
        }}
        fixedActions={renderFixedActions(pane.paneId, activeTab)}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab ? renderPanel(pane.paneId, activeTab) : (
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState message="열린 탭이 없습니다." />
          </div>
        )}
      </div>
      {isDropEnabled && dropZone ? <DropZoneOverlay zone={dropZone} /> : null}
    </div>
  );
};

const DropZoneOverlay: FC<{ zone: DropZone }> = ({ zone }) => (
  <div className="pointer-events-none absolute inset-0 z-20">
    <div
      className={[
        'absolute rounded-md bg-accent/20 ring-2 ring-accent',
        zone === 'left' ? 'inset-y-3 left-3 w-[28%]' : '',
        zone === 'right' ? 'inset-y-3 right-3 w-[28%]' : '',
        zone === 'top' ? 'inset-x-3 top-3 h-[28%]' : '',
        zone === 'bottom' ? 'inset-x-3 bottom-3 h-[28%]' : '',
      ].join(' ')}
    />
  </div>
);

export function findPaneActiveTab(paneTree: PaneNode, paneId: string): WorkspaceTab | null {
  const pane = findLeafPane(paneTree, paneId);
  return pane ? getActiveTab(pane) : null;
}
