import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaneTree } from '../../src/webview/features/F02/PaneTree';
import { initI18n } from '../../src/webview/i18n';
import type { PaneLeafNode, WorkspaceTab } from '../../src/webview/store/slices/workspaceTabsSlice';
import type { Commit } from '../../src/webview/types/commit';

const commitA: Commit = {
  hash: 'aaaaaaaa',
  shortHash: 'aaaaaaa',
  message: 'Commit A',
  author: 'Alice',
  date: '2026-07-12T10:00:00.000Z',
};

describe('PaneTree', () => {
  beforeEach(() => {
    initI18n('ko');
  });

  it('hides the tab bar when a pane has no open tabs', () => {
    const { container } = render(
      <PaneTree
        paneTree={createLeafPane([])}
        focusedPaneId="pane-empty"
        activeSummaryCommitHash={null}
        isGeneratingSummary={false}
        onActivateTab={vi.fn()}
        onCloseTab={vi.fn()}
        onFocusPane={vi.fn()}
        onMoveTab={vi.fn()}
        onResizeSplit={vi.fn()}
        renderLeadingActions={() => null}
        renderTrailingActions={() => null}
        renderPanel={() => null}
      />,
    );

    expect(container.querySelector('[data-pane-focus-state]')).toBeNull();
    expect(screen.getByText('열린 탭이 없습니다.')).toBeInTheDocument();
  });

  it('shows the tab bar when a pane has open tabs', () => {
    render(
      <PaneTree
        paneTree={createLeafPane([createCodeTab('code:aaaaaaaa:src/alpha.ts', 'src/alpha.ts')], 'code:aaaaaaaa:src/alpha.ts')}
        focusedPaneId="pane-filled"
        activeSummaryCommitHash={null}
        isGeneratingSummary={false}
        onActivateTab={vi.fn()}
        onCloseTab={vi.fn()}
        onFocusPane={vi.fn()}
        onMoveTab={vi.fn()}
        onResizeSplit={vi.fn()}
        renderLeadingActions={() => null}
        renderTrailingActions={() => null}
        renderPanel={(_, activeTab) => activeTab?.filePath ?? null}
      />,
    );

    expect(screen.getByRole('button', { name: 'alpha.ts' })).toBeInTheDocument();
  });
});

function createLeafPane(tabs: WorkspaceTab[], activeTabId: string | null = null): PaneLeafNode {
  return {
    paneId: tabs.length > 0 ? 'pane-filled' : 'pane-empty',
    kind: 'leaf',
    tabs,
    activeTabId,
  };
}

function createCodeTab(id: string, filePath: string): WorkspaceTab {
  return {
    id,
    panelType: 'code',
    title: null,
    commit: commitA,
    filePath,
  };
}
