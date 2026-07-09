import { isValidElement, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { translate } from '../../i18n/runtime';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { HighlightedCode } from '../../shared/highlighter';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { useAppStore } from '../../store/appStore';
import type { Commit } from '../../types/commit';
import { MermaidBlock } from './MermaidBlock';
import './S07_NoteScreen.css';

const SAVE_DEBOUNCE_MS = 1000;

interface NoteEditorPanelProps {
  commit: Commit;
  isActive: boolean;
}

export const NoteEditorPanel: FC<NoteEditorPanelProps> = ({ commit, isActive }) => {
  const { t } = useTranslation();
  const savePath = useAppStore((state) => state.savePath);
  const noteContent = useAppStore((state) => state.noteContent);
  const noteSavedPath = useAppStore((state) => state.noteSavedPath);
  const isLoadingNote = useAppStore((state) => state.isLoadingNote);
  const isSavingNote = useAppStore((state) => state.isSavingNote);
  const noteError = useAppStore((state) => state.noteError);
  const hasSavedNote = useAppStore((state) => state.hasSavedNote);
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
      handleNoteLoadFailed(translate('ai_summary.no_save_path'));
      return;
    }

    if (!isVSCodeRuntime()) {
      handleNoteLoaded({ content: '', savedPath: null, hasSavedNote: false });
      lastSavedContentRef.current = '';
      setDraftContent('');
      setHasInitializedLoad(true);
      return;
    }

    startNoteLoading();
    postMessage('FETCH_NOTE', {
      commitHash: commit.hash,
      commitMessage: commit.message,
      savePath,
    });
  }, [commit.hash, commit.message, handleNoteLoadFailed, handleNoteLoaded, isActive, savePath, startNoteLoading]);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { content?: string; savedPath?: string | null; hasSavedNote?: boolean; message?: string } }>): void => {
      if (event.data.type === 'NOTE_LOADED') {
        const loadedContent = event.data.payload?.content ?? '';
        handleNoteLoaded({
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
        handleNoteLoadFailed(event.data.payload?.message);
        return;
      }

      if (event.data.type === 'NOTE_SAVED') {
        const savedContent = event.data.payload?.content ?? '';
        lastSavedContentRef.current = savedContent;
        handleNoteSaved({
          content: savedContent,
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
  }, [handleNoteLoadFailed, handleNoteLoaded, handleNoteSaveFailed, handleNoteSaved]);

  useEffect(() => {
    if (!isActive || !savePath || !hasInitializedLoad) {
      return;
    }

    const saveNow = (): void => {
      startNoteSaving();
      if (!isVSCodeRuntime()) {
        lastSavedContentRef.current = draftContent;
        handleNoteSaved({ content: draftContent, savedPath: noteSavedPath, hasSavedNote: draftContent.length > 0 || hasSavedNote });
        return;
      }

      postMessage('SAVE_NOTE', {
        commitHash: commit.hash,
        commitMessage: commit.message,
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
  }, [commit.hash, commit.message, draftContent, handleNoteSaved, hasInitializedLoad, hasSavedNote, isActive, noteSavedPath, savePath, startNoteSaving]);

  const statusLabel = useMemo(() => {
    if (isSavingNote) return '저장 중...';
    if (noteError) return noteError;
    if (hasSavedNote) return '저장됨';
    return '자동 저장 대기 중';
  }, [hasSavedNote, isSavingNote, noteError]);

  let mermaidBlockIndex = 0;
  let highlightedCodeBlockIndex = 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-md border border-line bg-panel/90 p-1 backdrop-blur">
        <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')} label="편집" />
        <ModeButton active={mode === 'split'} onClick={() => setMode('split')} label="분할" />
        <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')} label="미리보기" />
      </div>
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
        <div className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${mode === 'split' ? 'grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1' : 'grid-cols-1'}`}>
          {mode !== 'preview' ? (
            <textarea
              className={`min-h-0 w-full resize-none border-0 border-b border-line bg-panel px-6 pt-16 pb-5 font-mono text-sm text-text outline-none ${mode === 'split' ? 'md:border-b-0 md:border-r' : ''} ${mode === 'edit' ? 'md:col-span-2' : ''}`}
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
