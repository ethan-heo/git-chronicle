import { createContext, useContext, useMemo, useState, type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableSplitPane } from '../../shared/components';
import type { ChangedFile } from '../../types/commit';
import {
  countCodeInnerLeaves,
  createDefaultCodeInnerPaneTree,
  hasCodeInnerPanel,
  type CodeInnerLeafNode,
  type CodeInnerPaneNode,
  type CodeInnerPanelKind,
  type DropZone,
  type WorkspaceTab,
} from '../../store/slices/workspaceTabsSlice';
import { CodeDiffPanel } from '../F03';
import { AISummaryPanel } from '../F05b';
import { SymbolGraphPanel, useSymbolGraph } from '../F10';

interface CodeInnerPaneTreeProps {
  tab: WorkspaceTab;
  isActive: boolean;
  selectedFile: ChangedFile | null;
  isSelectedFilePending: boolean;
  onToggleInnerPanel: (panel: 'aiSummary' | 'symbolGraph') => void;
  onMoveInnerPanel: (input: {
    sourcePanel: CodeInnerPanelKind;
    targetPanel: CodeInnerPanelKind;
    zone: Exclude<DropZone, 'center'>;
  }) => void;
  onResizeInnerSplit: (nodeId: string, sizePercent: number) => void;
  onGoToSettings: () => void;
}

interface PanelHeaderControls {
  leading: ReactNode;
  trailing: ReactNode;
}

interface DragState {
  sourcePanel: CodeInnerPanelKind;
}

const CodeInnerPaneDragContext = createContext<{
  dragState: DragState | null;
  setDragState: (state: DragState | null) => void;
} | null>(null);

export const CodeInnerPaneTree: FC<CodeInnerPaneTreeProps> = ({
  tab,
  isActive,
  selectedFile,
  isSelectedFilePending,
  onToggleInnerPanel,
  onMoveInnerPanel,
  onResizeInnerSplit,
  onGoToSettings,
}) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const contextValue = useMemo(() => ({ dragState, setDragState }), [dragState]);
  const tree = tab.codeInnerPaneTree ?? createDefaultCodeInnerPaneTree();
  const panelCount = countCodeInnerLeaves(tree);
  const isSymbolGraphOpen = hasCodeInnerPanel(tree, 'symbolGraph');
  const symbolGraph = useSymbolGraph({
    isActive: isActive && isSymbolGraphOpen,
    tabId: tab.id,
    selectedFile,
    commitHash: tab.commit?.hash ?? '',
  });

  return (
    <CodeInnerPaneDragContext.Provider value={contextValue}>
      <CodeInnerPaneTreeRenderer
        node={tree}
        tab={tab}
        isActive={isActive}
        panelCount={panelCount}
        selectedFile={selectedFile}
        isSelectedFilePending={isSelectedFilePending}
        symbolGraph={symbolGraph}
        onToggleInnerPanel={onToggleInnerPanel}
        onMoveInnerPanel={onMoveInnerPanel}
        onResizeInnerSplit={onResizeInnerSplit}
        onGoToSettings={onGoToSettings}
      />
    </CodeInnerPaneDragContext.Provider>
  );
};

const CodeInnerPaneTreeRenderer: FC<CodeInnerPaneTreeProps & {
  node: CodeInnerPaneNode;
  panelCount: number;
  symbolGraph: ReturnType<typeof useSymbolGraph>;
}> = ({
  node,
  tab,
  isActive,
  panelCount,
  selectedFile,
  isSelectedFilePending,
  symbolGraph,
  onToggleInnerPanel,
  onMoveInnerPanel,
  onResizeInnerSplit,
  onGoToSettings,
}) => {
  if (node.kind === 'split') {
    return (
      <ResizableSplitPane
        isOpen
        orientation={node.orientation}
        defaultLeftPercent={node.sizePercent}
        minLeftPx={node.orientation === 'vertical' ? 96 : 180}
        minRightPx={node.orientation === 'vertical' ? 96 : 180}
        className="h-full min-h-0"
        left={(
          <CodeInnerPaneTreeRenderer
            node={node.children[0]}
            tab={tab}
            isActive={isActive}
            panelCount={panelCount}
            selectedFile={selectedFile}
            isSelectedFilePending={isSelectedFilePending}
            symbolGraph={symbolGraph}
            onToggleInnerPanel={onToggleInnerPanel}
            onMoveInnerPanel={onMoveInnerPanel}
            onResizeInnerSplit={onResizeInnerSplit}
            onGoToSettings={onGoToSettings}
          />
        )}
        right={(
          <CodeInnerPaneTreeRenderer
            node={node.children[1]}
            tab={tab}
            isActive={isActive}
            panelCount={panelCount}
            selectedFile={selectedFile}
            isSelectedFilePending={isSelectedFilePending}
            symbolGraph={symbolGraph}
            onToggleInnerPanel={onToggleInnerPanel}
            onMoveInnerPanel={onMoveInnerPanel}
            onResizeInnerSplit={onResizeInnerSplit}
            onGoToSettings={onGoToSettings}
          />
        )}
        onLeftPxChange={(leftPx, rightPx) => {
          const total = leftPx + rightPx;
          if (total > 0) {
            onResizeInnerSplit(node.nodeId, (leftPx / total) * 100);
          }
        }}
      />
    );
  }

  return (
    <CodeInnerPanelHost
      node={node}
      tab={tab}
      isActive={isActive}
      panelCount={panelCount}
      selectedFile={selectedFile}
      isSelectedFilePending={isSelectedFilePending}
      symbolGraph={symbolGraph}
      onToggleInnerPanel={onToggleInnerPanel}
      onMoveInnerPanel={onMoveInnerPanel}
      onGoToSettings={onGoToSettings}
    />
  );
};

const CodeInnerPanelHost: FC<{
  node: CodeInnerLeafNode;
  tab: WorkspaceTab;
  isActive: boolean;
  panelCount: number;
  selectedFile: ChangedFile | null;
  isSelectedFilePending: boolean;
  symbolGraph: ReturnType<typeof useSymbolGraph>;
  onToggleInnerPanel: (panel: 'aiSummary' | 'symbolGraph') => void;
  onMoveInnerPanel: (input: {
    sourcePanel: CodeInnerPanelKind;
    targetPanel: CodeInnerPanelKind;
    zone: Exclude<DropZone, 'center'>;
  }) => void;
  onGoToSettings: () => void;
}> = ({
  node,
  tab,
  isActive,
  panelCount,
  selectedFile,
  isSelectedFilePending,
  symbolGraph,
  onToggleInnerPanel,
  onMoveInnerPanel,
  onGoToSettings,
}) => {
  const { t } = useTranslation();
  const dragContext = useContext(CodeInnerPaneDragContext);
  const [dropZone, setDropZone] = useState<Exclude<DropZone, 'center'> | null>(null);
  const isDropEnabled = Boolean(dragContext?.dragState && dragContext.dragState.sourcePanel !== node.panel);
  const closablePanel = node.panel === 'aiSummary' || node.panel === 'symbolGraph' ? node.panel : null;

  const commitDrop = (zone: Exclude<DropZone, 'center'>): void => {
    if (!dragContext?.dragState) {
      setDropZone(null);
      return;
    }

    onMoveInnerPanel({
      sourcePanel: dragContext.dragState.sourcePanel,
      targetPanel: node.panel,
      zone,
    });
    dragContext.setDragState(null);
    setDropZone(null);
  };

  const panelBody = renderCodeInnerPanelBody({
    panel: node.panel,
    tab,
    isActive,
    selectedFile,
    isSelectedFilePending,
    symbolGraph,
    onGoToSettings,
    headerControls: panelCount > 1
      ? {
        leading: (
          <CodeInnerPanelHandle
            panel={node.panel}
            onDragStart={() => dragContext?.setDragState({ sourcePanel: node.panel })}
            onDragEnd={() => {
              dragContext?.setDragState(null);
              setDropZone(null);
            }}
          />
        ),
        trailing: (
          <CodeInnerPanelCloseButton
            panel={node.panel}
            onClose={closablePanel ? () => onToggleInnerPanel(closablePanel) : undefined}
          />
        ),
      }
      : null,
  });

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
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

          if (x <= thresholdX) {
            setDropZone('left');
            return;
          }

          if (x >= rect.width - thresholdX) {
            setDropZone('right');
            return;
          }

          if (y <= thresholdY) {
            setDropZone('top');
            return;
          }

          if (y >= rect.height - thresholdY) {
            setDropZone('bottom');
            return;
          }

          setDropZone(null);
        }}
        onDragLeave={() => setDropZone(null)}
        onDrop={(event) => {
          event.preventDefault();
          if (!dropZone) {
            setDropZone(null);
            return;
          }

          commitDrop(dropZone);
        }}
      >
        {panelBody}
      </div>
      {isDropEnabled && dropZone ? <DropZoneOverlay zone={dropZone} /> : null}
    </section>
  );
};

const CodeInnerPanelHandle: FC<{
  panel: CodeInnerPanelKind;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ panel, onDragStart, onDragEnd }) => {
  const { t } = useTranslation();
  const label = getCodeInnerPanelLabel(panel, t);

  return (
    <button
      type="button"
      draggable
      className="inline-flex h-8 items-center justify-center px-2 text-xs text-muted"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={label}
      title={label}
    >
      <span
        className="inline-flex h-6 w-5 cursor-grab select-none items-center justify-center bg-transparent text-muted"
        aria-hidden="true"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="2" r="1" />
          <circle cx="8" cy="2" r="1" />
          <circle cx="2" cy="6" r="1" />
          <circle cx="8" cy="6" r="1" />
          <circle cx="2" cy="10" r="1" />
          <circle cx="8" cy="10" r="1" />
          <circle cx="2" cy="14" r="1" />
          <circle cx="8" cy="14" r="1" />
        </svg>
      </span>
    </button>
  );
};

const CodeInnerPanelCloseButton: FC<{
  panel: CodeInnerPanelKind;
  onClose?: () => void;
}> = ({ panel, onClose }) => {
  const { t } = useTranslation();
  const label = getCodeInnerPanelLabel(panel, t);

  return (
    <button
      type="button"
      className={[
        'inline-flex h-8 items-center justify-center px-2 text-muted transition-colors',
        onClose ? 'hover:text-text' : 'cursor-not-allowed opacity-35',
      ].join(' ')}
      onClick={onClose}
      disabled={!onClose}
      aria-label={onClose ? t('workspace.tab_close_aria', { label }) : t('code_inner_panel.diff_close_disabled')}
      title={onClose ? t('workspace.tab_close_aria', { label }) : t('code_inner_panel.diff_close_disabled')}
    >
      ×
    </button>
  );
};

const CodeInnerPanelFrame: FC<{
  controls: PanelHeaderControls | null;
  children: ReactNode;
}> = ({ controls, children }) => (
  <div className="flex h-full min-h-0 flex-col overflow-hidden">
    {controls ? (
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-line bg-panel px-1">
        <div className="flex min-w-0 items-center gap-1">
          {controls.leading}
        </div>
        <div className="flex shrink-0 items-center">
          {controls.trailing}
        </div>
      </header>
    ) : null}
    <div className="min-h-0 flex-1 overflow-hidden">
      {children}
    </div>
  </div>
);

function renderCodeInnerPanelBody(options: {
  panel: CodeInnerPanelKind;
  tab: WorkspaceTab;
  isActive: boolean;
  selectedFile: ChangedFile | null;
  isSelectedFilePending: boolean;
  symbolGraph: ReturnType<typeof useSymbolGraph>;
  onGoToSettings: () => void;
  headerControls: PanelHeaderControls | null;
}): ReactNode {
  const {
    panel,
    tab,
    isActive,
    selectedFile,
    isSelectedFilePending,
    symbolGraph,
    onGoToSettings,
    headerControls,
  } = options;

  if (!tab.filePath || !tab.commit) {
    return null;
  }

  if (panel === 'diff') {
    return (
      <CodeInnerPanelFrame controls={headerControls}>
        <CodeDiffPanel
          isActive={isActive}
          tabId={tab.id}
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
      </CodeInnerPanelFrame>
    );
  }

  if (panel === 'aiSummary') {
    return (
      <AISummaryPanel
        isActive={isActive}
        targetFile={selectedFile}
        isTargetFilePending={isSelectedFilePending}
        commit={tab.commit}
        onGoToSettings={onGoToSettings}
        headerLeading={headerControls?.leading}
        headerTrailing={headerControls?.trailing}
      />
    );
  }

  return (
    <CodeInnerPanelFrame controls={headerControls}>
      <SymbolGraphPanel data={symbolGraph} />
    </CodeInnerPanelFrame>
  );
}

const DropZoneOverlay: FC<{ zone: Exclude<DropZone, 'center'> }> = ({ zone }) => (
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

function getCodeInnerPanelLabel(panel: CodeInnerPanelKind, t: (key: string) => string): string {
  if (panel === 'diff') {
    return t('code_inner_panel.diff_title');
  }

  if (panel === 'aiSummary') {
    return t('workspace.tab_label_ai_summary');
  }

  return t('code_inner_panel.symbol_graph_title');
}
