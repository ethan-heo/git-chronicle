import { useEffect, useMemo, useState, type FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { translate } from '../../i18n/runtime';
import { EmptyState, ErrorState, LoadingState, TopHeader } from '../../shared/components';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';

const SAVE_DEBOUNCE_MS = 1000;

export const S07NoteScreen: FC = () => {
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const savePath = useAppStore((state) => state.savePath);
  const noteContent = useAppStore((state) => state.noteContent);
  const noteSavedPath = useAppStore((state) => state.noteSavedPath);
  const isLoadingNote = useAppStore((state) => state.isLoadingNote);
  const isSavingNote = useAppStore((state) => state.isSavingNote);
  const noteError = useAppStore((state) => state.noteError);
  const hasSavedNote = useAppStore((state) => state.hasSavedNote);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const startNoteLoading = useAppStore((state) => state.startNoteLoading);
  const setNoteContent = useAppStore((state) => state.setNoteContent);
  const startNoteSaving = useAppStore((state) => state.startNoteSaving);
  const handleNoteLoaded = useAppStore((state) => state.handleNoteLoaded);
  const handleNoteLoadFailed = useAppStore((state) => state.handleNoteLoadFailed);
  const handleNoteSaved = useAppStore((state) => state.handleNoteSaved);
  const handleNoteSaveFailed = useAppStore((state) => state.handleNoteSaveFailed);
  const isRouteSlotActive = useRouteSlotActive();
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [hasInitializedLoad, setHasInitializedLoad] = useState(false);
  const [draftContent, setDraftContent] = useState('');

  useEffect(() => {
    if (!isRouteSlotActive || !selectedCommit) {
      return;
    }

    if (!savePath) {
      setHasInitializedLoad(false);
      setDraftContent('');
      handleNoteLoadFailed(translate('ai_summary.no_save_path'));
      return;
    }

    if (!isVSCodeRuntime()) {
      const initialContent = '';
      handleNoteLoaded({ content: initialContent, savedPath: null, hasSavedNote: false });
      setDraftContent(initialContent);
      setHasInitializedLoad(true);
      return;
    }

    startNoteLoading();
    postMessage('FETCH_NOTE', {
      commitHash: selectedCommit.hash,
      commitMessage: selectedCommit.message,
      savePath,
    });
  }, [handleNoteLoadFailed, handleNoteLoaded, isRouteSlotActive, savePath, selectedCommit, startNoteLoading]);

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    const handler = (event: MessageEvent<{ type: string; payload?: { content?: string; savedPath?: string | null; hasSavedNote?: boolean; message?: string } }>): void => {
      if (event.data.type === 'NOTE_LOADED') {
        const loadedContent = event.data.payload?.content ?? '';
        handleNoteLoaded({
          content: loadedContent,
          savedPath: event.data.payload?.savedPath ?? null,
          hasSavedNote: event.data.payload?.hasSavedNote ?? false,
        });
        setDraftContent(loadedContent);
        setHasInitializedLoad(true);
        return;
      }

      if (event.data.type === 'NOTE_LOAD_FAILED') {
        setHasInitializedLoad(false);
        setDraftContent('');
        handleNoteLoadFailed(event.data.payload?.message);
        return;
      }

      if (event.data.type === 'NOTE_SAVED') {
        handleNoteSaved({
          content: event.data.payload?.content ?? '',
          savedPath: event.data.payload?.savedPath ?? null,
          hasSavedNote: event.data.payload?.hasSavedNote ?? true,
        });
        return;
      }

      if (event.data.type === 'NOTE_SAVE_FAILED') {
        handleNoteSaveFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleNoteLoadFailed, handleNoteLoaded, handleNoteSaveFailed, handleNoteSaved, isRouteSlotActive]);

  useEffect(() => {
    if (!isRouteSlotActive || !selectedCommit || !savePath || !hasInitializedLoad) {
      return;
    }

    const timer = window.setTimeout(() => {
      startNoteSaving();
      if (!isVSCodeRuntime()) {
        handleNoteSaved({ content: draftContent, savedPath: noteSavedPath, hasSavedNote: draftContent.length > 0 || hasSavedNote });
        return;
      }

      postMessage('SAVE_NOTE', {
        commitHash: selectedCommit.hash,
        commitMessage: selectedCommit.message,
        savePath,
        content: draftContent,
      });
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draftContent, handleNoteSaved, hasInitializedLoad, hasSavedNote, isRouteSlotActive, noteSavedPath, savePath, selectedCommit, startNoteSaving]);

  const statusLabel = useMemo(() => {
    if (isSavingNote) return '저장 중...';
    if (noteError) return noteError;
    if (hasSavedNote) return '저장됨';
    return '자동 저장 대기 중';
  }, [hasSavedNote, isSavingNote, noteError]);

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell relative flex h-screen min-h-0 flex-col overflow-hidden bg-surface">
      <TopHeader
        title="노트"
        context={`${selectedCommit.shortHash} · ${selectedCommit.message}`}
        showBackButton
        onBackClick={goBackFromDetail}
        endSlot={(
          <div className="flex items-center gap-2">
            <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')} label="편집" />
            <ModeButton active={mode === 'split'} onClick={() => setMode('split')} label="분할" />
            <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')} label="미리보기" />
          </div>
        )}
      />
      {!savePath ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <EmptyState message={t('ai_summary.no_save_path')} />
        </div>
      ) : isLoadingNote ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <LoadingState label="노트를 불러오는 중..." size="lg" />
        </div>
      ) : noteError && !noteContent ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <ErrorState message={noteError} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          {mode !== 'preview' ? (
            <textarea
              className={`min-h-0 w-full resize-none border-0 border-r border-line bg-panel px-6 py-5 font-mono text-sm text-text outline-none ${mode === 'edit' ? 'md:col-span-2' : ''}`}
              value={draftContent}
              onChange={(event) => {
                const nextValue = event.target.value;
                setDraftContent(nextValue);
                setNoteContent(nextValue);
              }}
              placeholder="마크다운으로 메모를 남겨보세요."
              spellCheck={false}
            />
          ) : null}
          {mode !== 'edit' ? (
            <section className={`min-h-0 overflow-auto px-6 py-5 ${mode === 'preview' ? 'md:col-span-2' : ''}`}>
              <div className="prose prose-sm max-w-none text-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {draftContent || '노트 미리보기가 여기에 표시됩니다.'}
                </ReactMarkdown>
              </div>
            </section>
          ) : null}
        </div>
      )}
      <div className="border-t border-line bg-panel px-6 py-2 text-sm text-muted">
        {statusLabel}
        {noteSavedPath ? <span className="ml-2 font-mono text-xs">{noteSavedPath}</span> : null}
      </div>
    </main>
  );
};

const ModeButton: FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-sm px-2 py-1 text-xs ${active ? 'bg-hover text-text' : 'text-muted hover:bg-hover hover:text-text'}`}
  >
    {label}
  </button>
);
