import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mermaid from 'mermaid';
import type { RenderResult } from 'mermaid';
import { initI18n } from '../../src/webview/i18n';
import { RouteSlotProvider } from '../../src/webview/shared/route/RouteSlotContext';
import { useAppStore } from '../../src/webview/store/appStore';
import { S07NoteScreen } from '../../src/webview/features/F11';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (id: string, code: string) => ({
      svg: `<svg data-testid="mermaid-svg" data-id="${id}"><text>${code}</text></svg>`,
    })),
  },
}));

describe('S07NoteScreen', () => {
  beforeEach(() => {
    initI18n('ko');
    useAppStore.setState({
      currentScreen: 'S02',
      selectedCommit: {
        hash: 'abc123456789',
        shortHash: 'abc1234',
        message: 'feat: note editor',
        author: 'tester',
        date: '2026-07-06T12:00:00+09:00',
      },
      savePath: '.git-author',
      notesByPane: {
        'legacy-note-screen': {
          noteContent: '',
          noteSavedPath: null,
          isLoading: false,
          isSaving: false,
          error: null,
          hasSavedNote: false,
        },
      },
    });
  });

  it('keeps typed content in the textarea in browser-dev fallback', async () => {
    render(
      <RouteSlotProvider isActive>
        <S07NoteScreen />
      </RouteSlotProvider>,
    );

    const textarea = await screen.findByPlaceholderText('마크다운으로 메모를 남겨보세요.');
    fireEvent.change(textarea, { target: { value: 'hello note' } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('마크다운으로 메모를 남겨보세요.')).toHaveValue('hello note');
    });
  });

  it('renders mermaid code fences as diagrams in preview', async () => {
    render(
      <RouteSlotProvider isActive>
        <S07NoteScreen />
      </RouteSlotProvider>,
    );

    const textarea = await screen.findByPlaceholderText('마크다운으로 메모를 남겨보세요.');
    fireEvent.change(textarea, { target: { value: '```mermaid\nflowchart TD\n  A --> B\n```' } });

    await waitFor(() => {
      expect(screen.getByTestId('mermaid-svg')).toBeInTheDocument();
    });
  });

  it('keeps the previous mermaid preview visible while a new diagram is rendering', async () => {
    let resolveRender: ((value: RenderResult) => void) | undefined;
    const renderMock = vi.mocked(mermaid.render);
    renderMock.mockClear();

    renderMock.mockImplementationOnce(async (id: string, code: string): Promise<RenderResult> => ({
      diagramType: 'flowchart',
      svg: `<svg data-testid="mermaid-svg" data-id="${id}"><text>${code}</text></svg>`,
    }));
    renderMock.mockImplementationOnce(
      () => new Promise<RenderResult>((resolve) => {
        resolveRender = resolve;
      }),
    );

    render(
      <RouteSlotProvider isActive>
        <S07NoteScreen />
      </RouteSlotProvider>,
    );

    const textarea = await screen.findByPlaceholderText('마크다운으로 메모를 남겨보세요.');
    fireEvent.change(textarea, { target: { value: '```mermaid\nflowchart TD\n  A --> B\n```' } });

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('mermaid-svg')).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: '```mermaid\nflowchart TD\n  A --> C\n```' } });

    expect(screen.getByTestId('mermaid-svg')).toBeInTheDocument();
    expect(screen.queryByText('Mermaid 다이어그램을 렌더링하는 중...')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(resolveRender).toBeDefined();
    });

    resolveRender?.({
      diagramType: 'flowchart',
      svg: '<svg data-testid="mermaid-svg" data-id="updated"><text>updated</text></svg>',
    });

    await waitFor(() => {
      expect(screen.getByText('updated')).toBeInTheDocument();
    });
  });
});
