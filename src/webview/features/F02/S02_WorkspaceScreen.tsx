import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
} from 'react';
import { useTranslation } from 'react-i18next';
import { BackButton, EmptyState } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile } from '../../types/commit';
import { CodeDiffPanel } from '../F03';
import { DependencyCanvasPanel } from '../F04';
import { AISummaryPanel } from '../F05b';
import { SymbolCodePanelToggleButton, SymbolGraphPanel, useSymbolGraph } from '../F10';
import { AISummaryToggleButton } from './AISummaryToggleButton';
import { FileCanvasToggleButton } from './FileCanvasToggleButton';
import { FileTree } from './FileTree';
import { useChangedFileTree } from './useChangedFileTree';
import { WorkspaceHeading } from './WorkspaceHeading';

const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 560;
const SIDEBAR_RESIZE_HANDLE_WIDTH = 6;
const SIDEBAR_COLLAPSE_WIDTH = 0;

export const S02WorkspaceScreen: FC = () => {
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const activeWorkspacePanel = useAppStore((state) => state.activeWorkspacePanel);
  const activeAISummaryFilePath = useAppStore((state) => state.activeAISummaryFilePath);
  const goToCommitList = useAppStore((state) => state.goToCommitList);
  const selectFileForCode = useAppStore((state) => state.selectFileForCode);
  const goToCommitAISummary = useAppStore((state) => state.goToCommitAISummary);
  const goToCanvasView = useAppStore((state) => state.goToCanvasView);
  const goToSymbolGraphView = useAppStore((state) => state.goToSymbolGraphView);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const goToNoteView = useAppStore((state) => state.goToNoteView);
  const isRouteSlotActive = useRouteSlotActive();
  const changedFileTree = useChangedFileTree({ isActive: isRouteSlotActive });
  const symbolGraph = useSymbolGraph({ isActive: isRouteSlotActive && activeWorkspacePanel === 'symbolGraph' });
  const [prevSelectedCommitHash, setPrevSelectedCommitHash] = useState(selectedCommit?.hash);

  if (prevSelectedCommitHash !== selectedCommit?.hash) {
    setPrevSelectedCommitHash(selectedCommit?.hash);
  }

  const activeAIFile = changedFileTree.changedFiles.find(
    (file) => file.path === activeAISummaryFilePath,
  ) ?? null;
  const isCommitAISummaryActive =
    activeWorkspacePanel === 'aiSummary' && activeAISummaryFilePath === null;
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const sidebarDragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const openCommitAISummaryFromSidebar = useCallback(() => {
    goToCommitAISummary();
  }, [goToCommitAISummary]);
  const openCommitAISummaryFromFile = useCallback((file: ChangedFile) => {
    goToCommitAISummary(file);
  }, [goToCommitAISummary]);

  useEffect(() => {
    if (!isSidebarDragging) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMove = (event: MouseEvent): void => {
      const dragState = sidebarDragStateRef.current;
      if (!dragState) {
        return;
      }

      const nextWidth = dragState.startWidth + (event.clientX - dragState.startX);
      const clampedWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_COLLAPSE_WIDTH, nextWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleUp = (): void => {
      setIsSidebarDragging(false);
      setSidebarWidth((current) => {
        if (current <= SIDEBAR_COLLAPSE_WIDTH) {
          setIsSidebarCollapsed(true);
          return SIDEBAR_DEFAULT_WIDTH;
        }

        return Math.max(SIDEBAR_MIN_WIDTH, current);
      });
      sidebarDragStateRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isSidebarDragging]);

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell flex h-screen min-h-0 overflow-hidden bg-surface">
      {!isSidebarCollapsed ? (
        <aside
          className="flex shrink-0 flex-col overflow-hidden border-r border-line bg-panel"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <BackButton onClick={goToCommitList} />
            <div className="flex items-center gap-2">
              <AISummaryToggleButton
                isActive={isCommitAISummaryActive}
                onClick={openCommitAISummaryFromSidebar}
              />
              <FileCanvasToggleButton
                isActive={activeWorkspacePanel === 'fileCanvas'}
                onClick={goToCanvasView}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden bg-surface">
            <FileTree
              changedFiles={changedFileTree.changedFiles}
              isLoading={changedFileTree.isLoading}
              error={changedFileTree.error}
              onRetry={changedFileTree.retryTree}
              onFileCodeView={selectFileForCode}
              onFileAIView={openCommitAISummaryFromFile}
              onFileSymbolGraph={goToSymbolGraphView}
              activeAIFilePath={activeWorkspacePanel === 'aiSummary' ? activeAISummaryFilePath : null}
              activeCodeFilePath={activeWorkspacePanel === 'code' ? selectedFile?.path ?? null : null}
              activeSymbolGraphFilePath={activeWorkspacePanel === 'symbolGraph' ? symbolGraph.selectedFile?.path ?? null : null}
            />
          </div>
        </aside>
      ) : null}

      <div
        className={[
          'relative shrink-0 bg-transparent transition-colors duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_20%,transparent)]',
          isSidebarDragging ? 'bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_20%,transparent)]' : '',
          isSidebarCollapsed ? 'cursor-e-resize' : 'cursor-col-resize',
        ].filter(Boolean).join(' ')}
        style={{ width: `${SIDEBAR_RESIZE_HANDLE_WIDTH}px` }}
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={(event) => {
          sidebarDragStateRef.current = {
            startX: event.clientX,
            startWidth: isSidebarCollapsed ? 0 : sidebarWidth,
          };
          if (isSidebarCollapsed) {
            setSidebarWidth(0);
            setIsSidebarCollapsed(false);
          }
          setIsSidebarDragging(true);
        }}
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
      </div>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <WorkspaceHeading
          commit={selectedCommit}
          context={`${selectedCommit.shortHash} · ${selectedCommit.author} · ${formatDate(selectedCommit.date)}`}
          endSlot={(
            <>
              <button
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
                type="button"
                onClick={goToNoteView}
                aria-label="노트 열기"
                title="노트 열기"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <path d="M3 2.5h7.5L13 5v8.5H3z" />
                  <path d="M10.5 2.5V5H13" />
                  <path d="M5.2 7.2h5.6M5.2 9.4h5.6M5.2 11.6h3.8" />
                </svg>
              </button>
              <button
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
                type="button"
                onClick={goToSettingsView}
                aria-label={t('settings.open_aria')}
                title={t('settings.open_aria')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <circle cx="8" cy="8" r="2.2" />
                  <path d="M8 1.7v1.7M8 12.6v1.7M3.55 3.55l1.2 1.2M11.25 11.25l1.2 1.2M1.7 8h1.7M12.6 8h1.7M3.55 12.45l1.2-1.2M11.25 4.75l1.2-1.2" />
                </svg>
              </button>
              {activeWorkspacePanel === 'symbolGraph' ? (
                <SymbolCodePanelToggleButton
                  isOpen={symbolGraph.isCodePanelOpen}
                  disabled={!symbolGraph.canToggleCodePanel}
                  onClick={symbolGraph.toggleCodePanel}
                />
              ) : null}
            </>
          )}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          {activeWorkspacePanel === 'none' ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState message={t('ai_summary.empty')} />
            </div>
          ) : null}

          {activeWorkspacePanel === 'code' && selectedFile ? (
            <CodeDiffPanel
              isActive={isRouteSlotActive && activeWorkspacePanel === 'code'}
              commitHash={selectedCommit.hash}
              filePath={selectedFile.path}
              isDeletedFile={selectedFile.status === 'D'}
            />
          ) : null}

          {activeWorkspacePanel === 'aiSummary' ? (
            <AISummaryPanel
              isActive={isRouteSlotActive && activeWorkspacePanel === 'aiSummary'}
              targetFile={activeAIFile}
              onGoToSettings={goToSettingsView}
            />
          ) : null}

          {activeWorkspacePanel === 'fileCanvas' ? (
            <DependencyCanvasPanel
              isActive={isRouteSlotActive && activeWorkspacePanel === 'fileCanvas'}
              onFileCodeView={selectFileForCode}
            />
          ) : null}

          {activeWorkspacePanel === 'symbolGraph' ? (
            <SymbolGraphPanel data={symbolGraph} />
          ) : null}
        </div>
      </section>
    </main>
  );
};

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(parsedDate)
    .replaceAll(' ', '');
}
