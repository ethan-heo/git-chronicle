import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { NoteEditorPanel } from '../../src/webview/features/F11';
import { initI18n } from '../../src/webview/i18n';
import { RouteSlotProvider } from '../../src/webview/shared/route/RouteSlotContext';
import { useAppStore } from '../../src/webview/store/appStore';
import type { EditorView } from '@codemirror/view';

describe('NoteEditorPanel', () => {
  beforeEach(() => {
    initI18n('ko');
    useAppStore.setState({
      currentScreen: 'S02',
      savePath: '.git-author',
      notesByPane: {
        'test-pane': {
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

  it('keeps typed content in the live editor in browser-dev fallback', async () => {
    render(
      <RouteSlotProvider isActive>
        <NoteEditorPanel paneId="test-pane" relativePath="ideas/todo.md" isActive />
      </RouteSlotProvider>,
    );

    await screen.findByRole('textbox', { name: '마크다운으로 메모를 남겨보세요.' });
    updateEditorContent('hello note');

    await waitFor(() => {
      expect(getEditorView().state.doc.toString()).toBe('hello note');
    });
  });

  it('renders only the live editor without mode buttons', async () => {
    render(
      <RouteSlotProvider isActive>
        <NoteEditorPanel paneId="test-pane" relativePath="ideas/todo.md" isActive />
      </RouteSlotProvider>,
    );

    await screen.findByRole('textbox', { name: '마크다운으로 메모를 남겨보세요.' });
    expect(screen.queryByRole('button', { name: '편집' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '분할' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '미리보기' })).not.toBeInTheDocument();
  });
});

function getEditorView(): EditorView {
  const host = screen.getByTestId('markdown-live-editor-host') as HTMLDivElement & { __cmView?: EditorView };
  if (!host.__cmView) {
    throw new Error('EditorView is not attached to the host.');
  }

  return host.__cmView;
}

function updateEditorContent(nextValue: string): void {
  const view = getEditorView();
  act(() => {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: nextValue,
      },
    });
  });
}
