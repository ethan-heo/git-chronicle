import { isValidElement, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { translate } from '../../i18n/runtime';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { HighlightedCode } from '../../shared/highlighter';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { useAppStore } from '../../store/appStore';
import { MermaidBlock } from './MermaidBlock';
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
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [hasInitializedLoad, setHasInitializedLoad] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const lastSavedContentRef = useRef('');

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
      handleNoteLoaded({ paneId, content: '', savedPath: null, hasSavedNote: false });
      lastSavedContentRef.current = '';
      setDraftContent('');
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

    const saveNow = (): void => {
      startNoteSaving(paneId);
      if (!isVSCodeRuntime()) {
        lastSavedContentRef.current = draftContent;
        handleNoteSaved({ paneId, content: draftContent, savedPath: noteState.noteSavedPath, hasSavedNote: draftContent.length > 0 || noteState.hasSavedNote });
        return;
      }

      postMessage('SAVE_NOTE', {
        paneId,
        relativePath,
        savePath,
        content: draftContent,
      });
    };

    const timer = window.setTimeout(saveNow, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      if (draftContent !== lastSavedContentRef.current) {
        saveNow();
      }
    };
  }, [draftContent, handleNoteSaved, hasInitializedLoad, isActive, noteState.hasSavedNote, noteState.noteSavedPath, paneId, relativePath, savePath, startNoteSaving]);

  const statusLabel = useMemo(() => {
    if (noteState.isSaving) return t('note.saving');
    if (noteState.error) return noteState.error;
    if (noteState.hasSavedNote) return t('note.saved');
    return t('note.autosave_pending');
  }, [noteState.error, noteState.hasSavedNote, noteState.isSaving, t]);

  let mermaidBlockIndex = 0;
  let highlightedCodeBlockIndex = 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-md border border-line bg-panel/90 p-1 backdrop-blur">
        <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')} label={t('note.mode_edit')} />
        <ModeButton active={mode === 'split'} onClick={() => setMode('split')} label={t('note.mode_split')} />
        <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')} label={t('note.mode_preview')} />
      </div>
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
        <div className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${mode === 'split' ? 'grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1' : 'grid-cols-1'}`}>
          {mode !== 'preview' ? (
            <textarea
              className={`min-h-0 w-full resize-none border-0 border-b border-line bg-panel px-6 pt-16 pb-5 font-mono text-sm text-text outline-none ${mode === 'split' ? 'md:border-b-0 md:border-r' : ''} ${mode === 'edit' ? 'md:col-span-2' : ''}`}
              value={draftContent}
              onChange={(event) => {
                const nextValue = event.target.value;
                setDraftContent(nextValue);
                setNoteContent(paneId, nextValue);
              }}
              placeholder={t('note.placeholder')}
              spellCheck={false}
            />
          ) : null}
          {mode !== 'edit' ? (
            <section className={`min-h-0 overflow-auto px-6 pt-16 pb-5 ${mode === 'preview' ? 'md:col-span-2' : ''}`}>
              <div className="note-preview text-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre({ children }) {
                      if (containsMermaidBlock(children)) {
                        return <>{children}</>;
                      }

                      return <pre>{children}</pre>;
                    },
                    code({ className, children, node, ...props }) {
                      const match = /language-(\w+)/.exec(className ?? '');
                      const language = match?.[1];
                      const content = String(children).replace(/\n$/, '');
                      const blockStart = node?.position?.start?.offset;

                      if (language === 'mermaid') {
                        const mermaidCacheKey = getStableNotePreviewCacheKey('mermaid-block', blockStart, mermaidBlockIndex);
                        if (typeof blockStart !== 'number') {
                          mermaidBlockIndex += 1;
                        }
                        return <MermaidBlock cacheKey={mermaidCacheKey} code={content} />;
                      }

                      if (language) {
                        const highlightedCacheKey = getStableNotePreviewCacheKey('note-code-block', blockStart, highlightedCodeBlockIndex);
                        if (typeof blockStart !== 'number') {
                          highlightedCodeBlockIndex += 1;
                        }

                        return <HighlightedCode cacheKey={highlightedCacheKey} className={className} code={content} language={language} />;
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {draftContent || t('note.preview_placeholder')}
                </ReactMarkdown>
              </div>
            </section>
          ) : null}
        </div>
      )}
      <div className="border-t border-line bg-panel px-6 py-2 text-sm text-muted">
        {statusLabel}
        {noteState.noteSavedPath ? <span className="ml-2 font-mono text-xs">{noteState.noteSavedPath}</span> : null}
      </div>
    </div>
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

function containsMermaidBlock(children: ReactNode): boolean {
  if (Array.isArray(children)) {
    return children.some((child) => containsMermaidBlock(child));
  }

  if (!isValidElement(children)) {
    return false;
  }

  if (children.type === MermaidBlock) {
    return true;
  }

  return containsMermaidBlock((children.props as { children?: ReactNode }).children);
}

function getStableNotePreviewCacheKey(prefix: string, blockStart: number | null | undefined, fallbackIndex: number): string {
  if (typeof blockStart === 'number') {
    return `${prefix}-${blockStart}`;
  }

  return `${prefix}-fallback-${fallbackIndex}`;
}
