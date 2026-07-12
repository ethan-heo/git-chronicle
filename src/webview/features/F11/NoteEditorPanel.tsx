import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { DEMO_NOTE_CONTENTS } from '../../demo/aiSummarySamples';
import { translate } from '../../i18n/runtime';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { MarkdownLiveEditor } from './MarkdownLiveEditor';
import './NoteEditorPanel.css';

const SAVE_DEBOUNCE_MS = 1000;

interface NoteEditorPanelProps {
  paneId: string;
  relativePath: string;
  isActive: boolean;
}

export const NoteEditorPanel: FC<NoteEditorPanelProps> = ({ paneId, relativePath, isActive }) => {
  const { t } = useTranslation();
  const savePath = useAppStore((state) => state.savePath);
  const noteState = useAppStore((state) => state.notesByPane[paneId] ?? {
    noteContent: '',
    noteSavedPath: null,
    isLoading: false,
    isSaving: false,
    error: null,
    hasSavedNote: false,
  });
  const startNoteLoading = useAppStore((state) => state.startNoteLoading);
  const setNoteContent = useAppStore((state) => state.setNoteContent);
  const startNoteSaving = useAppStore((state) => state.startNoteSaving);
  const handleNoteLoaded = useAppStore((state) => state.handleNoteLoaded);
  const handleNoteLoadFailed = useAppStore((state) => state.handleNoteLoadFailed);
  const handleNoteSaved = useAppStore((state) => state.handleNoteSaved);
  const handleNoteSaveFailed = useAppStore((state) => state.handleNoteSaveFailed);
  const [hasInitializedLoad, setHasInitializedLoad] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const lastSavedContentRef = useRef('');
  const pendingSaveTimerRef = useRef<number | null>(null);
  const latestSaveContextRef = useRef({
    draftContent: '',
    hasInitializedLoad: false,
    savePath: savePath ?? '',
    noteSavedPath: noteState.noteSavedPath,
    hasSavedNote: noteState.hasSavedNote,
  });

  useEffect(() => {
    latestSaveContextRef.current = {
      draftContent,
      hasInitializedLoad,
      savePath: savePath ?? '',
      noteSavedPath: noteState.noteSavedPath,
      hasSavedNote: noteState.hasSavedNote,
    };
  }, [draftContent, hasInitializedLoad, noteState.hasSavedNote, noteState.noteSavedPath, savePath]);

  const flushSave = useCallback((): void => {
    const {
      draftContent: pendingContent,
      hasInitializedLoad: hasLoaded,
      savePath: currentSavePath,
      noteSavedPath,
      hasSavedNote,
    } = latestSaveContextRef.current;

    if (!currentSavePath || !hasLoaded || pendingContent === lastSavedContentRef.current) {
      return;
    }

    startNoteSaving(paneId);
    if (!isVSCodeRuntime()) {
      lastSavedContentRef.current = pendingContent;
      handleNoteSaved({
        paneId,
        content: pendingContent,
        savedPath: noteSavedPath,
        hasSavedNote: pendingContent.length > 0 || hasSavedNote,
      });
      return;
    }

    postMessage('SAVE_NOTE', {
      paneId,
      relativePath,
      savePath: currentSavePath,
      content: pendingContent,
    });
  }, [handleNoteSaved, paneId, relativePath, startNoteSaving]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (!savePath) {
      setHasInitializedLoad(false);
      setDraftContent('');
      handleNoteLoadFailed({ paneId, message: translate('ai_summary.no_save_path') });
      return;
    }

    if (!isVSCodeRuntime()) {
      const demoContent = DEMO_NOTE_CONTENTS[relativePath] ?? '';
      handleNoteLoaded({ paneId, content: demoContent, savedPath: `${savePath}/${relativePath}`, hasSavedNote: true });
      lastSavedContentRef.current = demoContent;
      setDraftContent(demoContent);
      setHasInitializedLoad(true);
      return;
    }

    startNoteLoading(paneId);
    postMessage('FETCH_NOTE', {
      paneId,
      relativePath,
      savePath,
    });
  }, [handleNoteLoadFailed, handleNoteLoaded, isActive, paneId, relativePath, savePath, startNoteLoading]);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { paneId?: string; content?: string; savedPath?: string | null; hasSavedNote?: boolean; message?: string } }>): void => {
      if (event.data.payload?.paneId !== paneId) {
        return;
      }

      if (event.data.type === 'NOTE_LOADED') {
        const loadedContent = event.data.payload?.content ?? '';
        handleNoteLoaded({
          paneId,
          content: loadedContent,
          savedPath: event.data.payload?.savedPath ?? null,
          hasSavedNote: event.data.payload?.hasSavedNote ?? false,
        });
        lastSavedContentRef.current = loadedContent;
        setDraftContent(loadedContent);
        setHasInitializedLoad(true);
        return;
      }

      if (event.data.type === 'NOTE_LOAD_FAILED') {
        setHasInitializedLoad(false);
        setDraftContent('');
        handleNoteLoadFailed({ paneId, message: event.data.payload?.message });
        return;
      }

      if (event.data.type === 'NOTE_SAVED') {
        const savedContent = event.data.payload?.content ?? '';
        lastSavedContentRef.current = savedContent;
        handleNoteSaved({
          paneId,
          content: savedContent,
          savedPath: event.data.payload?.savedPath ?? null,
          hasSavedNote: event.data.payload?.hasSavedNote ?? true,
        });
        return;
      }

      if (event.data.type === 'NOTE_SAVE_FAILED') {
        handleNoteSaveFailed({ paneId, message: event.data.payload?.message });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleNoteLoadFailed, handleNoteLoaded, handleNoteSaveFailed, handleNoteSaved, paneId]);

  useEffect(() => {
    if (!isActive || !savePath || !hasInitializedLoad) {
      return;
    }

    if (pendingSaveTimerRef.current !== null) {
      window.clearTimeout(pendingSaveTimerRef.current);
    }

    pendingSaveTimerRef.current = window.setTimeout(() => {
      pendingSaveTimerRef.current = null;
      flushSave();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (pendingSaveTimerRef.current !== null) {
        window.clearTimeout(pendingSaveTimerRef.current);
        pendingSaveTimerRef.current = null;
      }
    };
  }, [draftContent, flushSave, hasInitializedLoad, isActive, savePath]);

  useEffect(() => {
    return () => {
      if (pendingSaveTimerRef.current !== null) {
        window.clearTimeout(pendingSaveTimerRef.current);
        pendingSaveTimerRef.current = null;
      }
      flushSave();
    };
  }, [flushSave]);

  const statusLabel = useMemo(() => {
    if (noteState.isSaving) return t('note.saving');
    if (noteState.error) return noteState.error;
    if (noteState.hasSavedNote) return t('note.saved');
    return t('note.autosave_pending');
  }, [noteState.error, noteState.hasSavedNote, noteState.isSaving, t]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      {!savePath ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <EmptyState message={t('ai_summary.no_save_path')} />
        </div>
      ) : noteState.isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <LoadingState label={t('note.loading')} size="lg" />
        </div>
      ) : noteState.error && !noteState.noteContent ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <ErrorState message={noteState.error} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden border-0 border-b border-line bg-panel">
          <MarkdownLiveEditor
            key={relativePath}
            value={draftContent}
            onChange={(nextValue) => {
              setDraftContent(nextValue);
              setNoteContent(paneId, nextValue);
            }}
            onOpenUrl={(url) => {
              if (!isVSCodeRuntime()) {
                window.open(url, '_blank', 'noopener,noreferrer');
                return;
              }

              postMessage('OPEN_EXTERNAL_URL', { url });
            }}
            placeholder={t('note.placeholder')}
          />
        </div>
      )}
      <div className="border-t border-line bg-panel px-6 py-2 text-sm text-muted">
        {statusLabel}
        {noteState.noteSavedPath ? <span className="ml-2 font-mono text-xs">{noteState.noteSavedPath}</span> : null}
      </div>
    </div>
  );
};
