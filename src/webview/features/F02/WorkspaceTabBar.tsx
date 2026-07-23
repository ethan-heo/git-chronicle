import { forwardRef, useEffect, useRef, type DragEventHandler, type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { WorkspaceTab } from '../../store/slices/workspaceTabsSlice';

interface WorkspaceTabBarProps {
  paneId: string;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  isFocusedPane: boolean;
  activeSummaryCommitHash: string | null;
  isGeneratingSummary: boolean;
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onDragTabStart?: (tabId: string) => void;
  onDragTabEnd?: () => void;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDragLeave?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
  leadingActions?: ReactNode;
  trailingActions?: ReactNode;
}

export const WorkspaceTabBar: FC<WorkspaceTabBarProps> = ({
  paneId,
  tabs,
  activeTabId,
  isFocusedPane,
  activeSummaryCommitHash,
  isGeneratingSummary,
  onActivateTab,
  onCloseTab,
  onDragTabStart,
  onDragTabEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  leadingActions,
  trailingActions,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFocusedPane) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const activeTabElement = activeTabRef.current;
    if (!scrollContainer || !activeTabElement) {
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const tabRect = activeTabElement.getBoundingClientRect();
    const nextScrollLeft =
      tabRect.left < containerRect.left
        ? scrollContainer.scrollLeft - (containerRect.left - tabRect.left)
        : tabRect.right > containerRect.right
          ? scrollContainer.scrollLeft + (tabRect.right - containerRect.right)
          : null;

    if (nextScrollLeft !== null) {
      scrollContainer.scrollTo({
        left: nextScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeTabId, isFocusedPane, tabs]);

  return (
    <div
      className={[
        'flex items-stretch gap-2 border-b-2 bg-panel px-2 py-1 transition-colors',
        isFocusedPane ? 'border-accent' : 'border-line',
      ].join(' ')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-pane-focus-state={isFocusedPane ? 'focused' : 'visible'}
    >
      {leadingActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {leadingActions}
        </div>
      ) : null}
      <div
        ref={scrollContainerRef}
        className="workspace-tab-scrollbar min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-gutter:stable]"
      >
        <div className="flex min-w-max items-center gap-1 pr-1">
          {tabs.map((tab) => (
            <WorkspaceTabItem
              key={tab.id}
              ref={tab.id === activeTabId ? activeTabRef : undefined}
              tab={tab}
              isVisible={tab.id === activeTabId}
              isFocused={isFocusedPane && tab.id === activeTabId}
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
      {trailingActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {trailingActions}
        </div>
      ) : null}
    </div>
  );
};

interface WorkspaceTabItemProps {
  paneId: string;
  tab: WorkspaceTab;
  isVisible: boolean;
  isFocused: boolean;
  isGenerating: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const WorkspaceTabItem = forwardRef<HTMLDivElement, WorkspaceTabItemProps>(
  ({ paneId, tab, isVisible, isFocused, isGenerating, onActivate, onClose, onDragStart, onDragEnd }, ref) => {
    const { t } = useTranslation();
    const tabLabel = getTabLabel(tab, t);
    const tabBadge = getTabBadge(tab, t);

    return (
      <div
        ref={ref}
        draggable
        data-pane-id={paneId}
        data-tab-visibility-state={isVisible ? 'visible' : 'hidden'}
        data-tab-focus-state={isFocused ? 'focused' : 'unfocused'}
        className={[
          'group flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm transition-colors',
          isFocused
            ? 'bg-selected text-text'
            : 'bg-surface text-muted hover:bg-hover hover:text-text',
        ].join(' ')}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={onActivate}
          aria-label={tabLabel}
          aria-current={isFocused ? 'page' : undefined}
          title={tabLabel}
        >
          {tabBadge ? (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text">
              {tabBadge}
            </span>
          ) : null}
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
  },
);

WorkspaceTabItem.displayName = 'WorkspaceTabItem';

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

  return tab.title ?? tab.relativePath?.split('/').at(-1) ?? t('workspace.tab_label_note');
}

function getTabBadge(tab: WorkspaceTab, t: (key: string) => string): string {
  if (tab.panelType === 'note') {
    return t('workspace.tab_label_note');
  }

  return tab.commit?.shortHash ?? '';
}
