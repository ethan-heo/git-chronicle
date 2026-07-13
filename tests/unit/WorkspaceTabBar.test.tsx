import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceTabBar } from '../../src/webview/features/F02/WorkspaceTabBar';
import { initI18n } from '../../src/webview/i18n';
import type { WorkspaceTab } from '../../src/webview/store/slices/workspaceTabsSlice';
import type { Commit } from '../../src/webview/types/commit';

const commitA: Commit = {
  hash: 'aaaaaaaa',
  shortHash: 'aaaaaaa',
  message: 'Commit A',
  author: 'Alice',
  date: '2026-07-12T10:00:00.000Z',
};

describe('WorkspaceTabBar', () => {
  beforeEach(() => {
    initI18n('ko');
  });

  it('shows the visible tab state in every pane and separates focus state', () => {
    render(
      <>
        <WorkspaceTabBar
          paneId="pane-a"
          tabs={[createCodeTab('code:aaaaaaaa:src/alpha.ts', 'src/alpha.ts')]}
          activeTabId="code:aaaaaaaa:src/alpha.ts"
          isFocusedPane
          activeSummaryCommitHash={null}
          isGeneratingSummary={false}
          onActivateTab={vi.fn()}
          onCloseTab={vi.fn()}
          fixedActions={null}
        />
        <WorkspaceTabBar
          paneId="pane-b"
          tabs={[createCodeTab('code:aaaaaaaa:src/beta.ts', 'src/beta.ts')]}
          activeTabId="code:aaaaaaaa:src/beta.ts"
          isFocusedPane={false}
          activeSummaryCommitHash={null}
          isGeneratingSummary={false}
          onActivateTab={vi.fn()}
          onCloseTab={vi.fn()}
          fixedActions={null}
        />
      </>,
    );

    const focusedTabLabel = screen.getByRole('button', { name: 'alpha.ts' });
    const unfocusedTabLabel = screen.getByRole('button', { name: 'beta.ts' });
    const focusedTab = focusedTabLabel.parentElement;
    const visibleTab = unfocusedTabLabel.parentElement;
    const focusedPaneBar = focusedTab?.closest('[data-pane-focus-state="focused"]');
    const visiblePaneBar = visibleTab?.closest('[data-pane-focus-state="visible"]');

    expect(focusedTab).toHaveAttribute('data-tab-visibility-state', 'visible');
    expect(focusedTab).toHaveAttribute('data-tab-focus-state', 'focused');
    expect(focusedTab).toHaveClass('border-accent');
    expect(focusedPaneBar).toHaveClass('border-accent/60');

    expect(visibleTab).toHaveAttribute('data-tab-visibility-state', 'visible');
    expect(visibleTab).toHaveAttribute('data-tab-focus-state', 'unfocused');
    expect(visibleTab).not.toHaveClass('border-line');
    expect(visibleTab).not.toHaveClass('border-accent');
    expect(visiblePaneBar).toHaveClass('border-line');
  });

  it('shows the note badge text for note tabs', () => {
    render(
      <WorkspaceTabBar
        paneId="pane-note"
        tabs={[createNoteTab('note:ideas/todo.md', 'ideas/todo.md', 'todo.md')]}
        activeTabId="note:ideas/todo.md"
        isFocusedPane
        activeSummaryCommitHash={null}
        isGeneratingSummary={false}
        onActivateTab={vi.fn()}
        onCloseTab={vi.fn()}
        fixedActions={null}
      />,
    );

    expect(screen.getByText('노트')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'todo.md' })).toBeInTheDocument();
  });
});

function createCodeTab(id: string, filePath: string): WorkspaceTab {
  return {
    id,
    panelType: 'code',
    title: null,
    commit: commitA,
    filePath,
  };
}

function createNoteTab(id: string, relativePath: string, title: string): WorkspaceTab {
  return {
    id,
    panelType: 'note',
    title,
    commit: null,
    filePath: null,
    relativePath,
  };
}
