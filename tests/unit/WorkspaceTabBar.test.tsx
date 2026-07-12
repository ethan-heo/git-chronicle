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

  it('shows the active tab style only for the focused pane', () => {
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

    expect(focusedTabLabel.parentElement).toHaveClass('border-accent');
    expect(unfocusedTabLabel.parentElement).toHaveClass('border-line');
    expect(unfocusedTabLabel.parentElement).not.toHaveClass('border-accent');
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
