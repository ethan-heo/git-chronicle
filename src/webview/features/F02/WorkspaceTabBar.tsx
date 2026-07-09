import type { FC, ReactNode } from 'react';
import type { WorkspaceTab } from '../../store/slices/workspaceTabsSlice';

interface WorkspaceTabBarProps {
  paneId: string;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  activeSummaryCommitHash: string | null;
  isGeneratingSummary: boolean;
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onDragTabStart?: (tabId: string) => void;
  onDragTabEnd?: () => void;
  fixedActions: ReactNode;
}

export const WorkspaceTabBar: FC<WorkspaceTabBarProps> = ({
  paneId,
  tabs,
  activeTabId,
  activeSummaryCommitHash,
  isGeneratingSummary,
  onActivateTab,
  onCloseTab,
  onDragTabStart,
  onDragTabEnd,
  fixedActions,
}) => {
  return (
    <div className="flex items-stretch gap-3 border-b border-line bg-panel px-4 py-2">
      <div className="workspace-tab-scrollbar min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
        <div className="flex min-w-max items-center gap-2 pr-1">
          {tabs.map((tab) => (
            <WorkspaceTabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isGenerating={isGeneratingSummary && tab.panelType === 'aiSummary' && tab.commit.hash === activeSummaryCommitHash}
              onActivate={() => onActivateTab(tab.id)}
              onClose={() => onCloseTab(tab.id)}
              onDragStart={() => onDragTabStart?.(tab.id)}
              onDragEnd={onDragTabEnd}
              paneId={paneId}
            />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {fixedActions}
      </div>
    </div>
  );
};

interface WorkspaceTabItemProps {
  paneId: string;
  tab: WorkspaceTab;
  isActive: boolean;
  isGenerating: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const WorkspaceTabItem: FC<WorkspaceTabItemProps> = ({ paneId, tab, isActive, isGenerating, onActivate, onClose, onDragStart, onDragEnd }) => (
  <div
    draggable
    data-pane-id={paneId}
    className={[
      'group flex h-10 items-center gap-2 rounded-md border pl-3 pr-2 text-sm transition-colors',
      isActive
        ? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-text'
        : 'border-line bg-surface text-muted hover:bg-hover hover:text-text',
    ].join(' ')}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
  >
    <button type="button" className="flex items-center gap-2" onClick={onActivate}>
      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text">
        {tab.commit.shortHash}
      </span>
      <span className="max-w-[180px] truncate">{getTabLabel(tab)}</span>
      {isGenerating ? <span className="size-2 rounded-full bg-accent" aria-label="AI 생성 중" /> : null}
    </button>
    <button
      type="button"
      className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-text"
      onClick={onClose}
      aria-label={`${getTabLabel(tab)} 닫기`}
      title="탭 닫기"
    >
      ×
    </button>
  </div>
);

function getTabLabel(tab: WorkspaceTab): string {
  if (tab.panelType === 'code' || tab.panelType === 'symbolGraph') {
    return tab.filePath?.split('/').at(-1) ?? tab.filePath ?? tab.panelType;
  }

  if (tab.panelType === 'aiSummary') {
    return tab.filePath ? `AI 요약 · ${tab.filePath.split('/').at(-1)}` : 'AI 요약';
  }

  if (tab.panelType === 'fileCanvas') {
    return '의존성 캔버스';
  }

  return '노트';
}
