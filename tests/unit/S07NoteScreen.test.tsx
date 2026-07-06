import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { initI18n } from '../../src/webview/i18n';
import { RouteSlotProvider } from '../../src/webview/shared/route/RouteSlotContext';
import { useAppStore } from '../../src/webview/store/appStore';
import { S07NoteScreen } from '../../src/webview/features/F11';

describe('S07NoteScreen', () => {
  beforeEach(() => {
    initI18n('ko');
    useAppStore.setState({
      currentScreen: 'S07',
      previousScreen: 'S02',
      selectedCommit: {
        hash: 'abc123456789',
        shortHash: 'abc1234',
        message: 'feat: note editor',
        author: 'tester',
        date: '2026-07-06T12:00:00+09:00',
      },
      savePath: '.git-author',
      noteContent: '',
      noteSavedPath: null,
      isLoadingNote: false,
      isSavingNote: false,
      noteError: null,
      hasSavedNote: false,
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
});
