import type { DragEventHandler, FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDragLeave?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
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
  onDragOver,
  onDragLeave,
  onDrop,
  fixedActions,
}) => {
  return (
    <div
      className="flex items-stretch gap-3 border-b border-line bg-panel px-4 py-2"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="workspace-tab-scrollbar min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
        <div className="flex min-w-max items-center gap-2 pr-1">
          {tabs.map((tab) => (
            <WorkspaceTabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isGenerating={isGeneratingSummary && tab.panelType === 'aiSummary' && tab.commit?.hash === activeSummaryCommitHash}
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

const WorkspaceTabItem: FC<WorkspaceTabItemProps> = ({ paneId, tab, isActive, isGenerating, onActivate, onClose, onDragStart, onDragEnd }) => {
  const { t } = useTranslation();
  const tabLabel = getTabLabel(tab, t);

  return (
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
      <button
        type="button"
        className="flex items-center gap-2"
        onClick={onActivate}
        aria-label={tabLabel}
        title={tabLabel}
      >
        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text">
          {getTabBadge(tab)}
        </span>
        <span className="max-w-[180px] truncate">{tabLabel}</span>
        {isGenerating ? <span className="size-2 rounded-full bg-accent" aria-label={t('ai_summary.generating_badge_aria')} /> : null}
      </button>
      <button
        type="button"
        className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-text"
        onClick={onClose}
        aria-label={t('workspace.tab_close_aria', { label: tabLabel })}
        title={t('workspace.tab_close_aria', { label: tabLabel })}
      >
        ×
      </button>
    </div>
  );
};

function getTabLabel(tab: WorkspaceTab, t: (key: string) => string): string {
  if (tab.panelType === 'code') {
    return tab.filePath?.split('/').at(-1) ?? tab.filePath ?? tab.panelType;
  }

  if (tab.panelType === 'aiSummary') {
    return t('workspace.tab_label_ai_summary');
  }

  if (tab.panelType === 'fileCanvas') {
    return t('workspace.tab_label_file_canvas');
  }

  if (tab.panelType === 'pr' || tab.panelType === 'issue') {
    return tab.title ?? `#${tab.prNumber ?? tab.issueNumber}`;
  }

  return tab.title ?? tab.relativePath?.split('/').at(-1) ?? t('workspace.tab_label_note');
}

function getTabBadge(tab: WorkspaceTab): string {
  if (tab.panelType === 'pr' || tab.panelType === 'issue') {
    return `#${tab.prNumber ?? tab.issueNumber}`;
  }

  return tab.commit?.shortHash ?? '';
}
