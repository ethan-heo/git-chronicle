import { useEffect, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { DEMO_AI_SUMMARY_NOTE_ENTRIES } from '../../demo/aiSummarySamples';
import { SidebarSection } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import type { NoteEntry } from '../../types/note';
import { NoteTree } from './NoteTree';

interface NotesSectionProps {
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  activeRelativePath: string | null;
}

export const NotesSection: FC<NotesSectionProps> = ({ isActive, isExpanded, onToggleExpanded, activeRelativePath }) => {
  const { t } = useTranslation();
  const savePath = useAppStore((state) => state.savePath);
  const noteTree = useAppStore((state) => state.noteTree);
  const isLoadingNoteTree = useAppStore((state) => state.isLoadingNoteTree);
  const noteTreeError = useAppStore((state) => state.noteTreeError);
  const loadNoteTree = useAppStore((state) => state.loadNoteTree);
  const createNoteState = useAppStore((state) => state.createNote);
  const deleteNoteState = useAppStore((state) => state.deleteNote);
  const moveNoteState = useAppStore((state) => state.moveNote);
  const handleNoteTreeLoaded = useAppStore((state) => state.handleNoteTreeLoaded);
  const handleNoteTreeLoadFailed = useAppStore((state) => state.handleNoteTreeLoadFailed);
  const handleNoteCreated = useAppStore((state) => state.handleNoteCreated);
  const handleNoteCreateFailed = useAppStore((state) => state.handleNoteCreateFailed);
  const handleNoteDeleted = useAppStore((state) => state.handleNoteDeleted);
  const handleNoteDeleteFailed = useAppStore((state) => state.handleNoteDeleteFailed);
  const handleNoteMoved = useAppStore((state) => state.handleNoteMoved);
  const handleNoteMoveFailed = useAppStore((state) => state.handleNoteMoveFailed);
  const openNoteTreeEntry = useAppStore((state) => state.openNoteTreeEntry);
  const renameNoteTabs = useAppStore((state) => state.renameNoteTabs);
  const closeNoteTabs = useAppStore((state) => state.closeNoteTabs);
  const pushToast = useAppStore((state) => state.pushToast);
  const [draftName, setDraftName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isActive || !savePath) {
      return;
    }

    if (!isVSCodeRuntime()) {
      handleNoteTreeLoaded({ entries: DEMO_NOTE_ENTRIES });
      return;
    }

    loadNoteTree();
    postMessage('FETCH_NOTE_TREE', { savePath });
  }, [handleNoteTreeLoaded, isActive, loadNoteTree, savePath]);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: Record<string, unknown> }>): void => {
      switch (event.data.type) {
        case 'NOTE_TREE_LOADED':
          handleNoteTreeLoaded({ entries: (event.data.payload?.entries as never[]) ?? [] });
          break;
        case 'NOTE_TREE_LOAD_FAILED':
          handleNoteTreeLoadFailed({ message: event.data.payload?.message as string | undefined });
          break;
        case 'NOTE_CREATED':
          handleNoteCreated({ entry: event.data.payload?.entry as never });
          setDraftName('');
          setIsCreating(false);
          break;
        case 'NOTE_CREATE_FAILED':
          handleNoteCreateFailed({
            message: event.data.payload?.message as string | undefined,
            relativePath: event.data.payload?.relativePath as string | undefined,
          });
          break;
        case 'NOTE_DELETED':
          handleNoteDeleted({ relativePath: event.data.payload?.relativePath as string });
          closeNoteTabs(event.data.payload?.relativePath as string);
          break;
        case 'NOTE_DELETE_FAILED':
          handleNoteDeleteFailed({
            message: event.data.payload?.message as string | undefined,
            relativePath: event.data.payload?.relativePath as string | undefined,
          });
          break;
        case 'NOTE_MOVED': {
          const fromRelativePath = event.data.payload?.fromRelativePath as string;
          const toRelativePath = event.data.payload?.toRelativePath as string;
          handleNoteMoved({ fromRelativePath, toRelativePath });
          renameNoteTabs(fromRelativePath, toRelativePath);
          break;
        }
        case 'NOTE_MOVE_FAILED':
          handleNoteMoveFailed({
            message: event.data.payload?.message as string | undefined,
            fromRelativePath: event.data.payload?.fromRelativePath as string | undefined,
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [
    closeNoteTabs,
    handleNoteCreateFailed,
    handleNoteCreated,
    handleNoteDeleteFailed,
    handleNoteDeleted,
    handleNoteMoveFailed,
    handleNoteMoved,
    handleNoteTreeLoadFailed,
    handleNoteTreeLoaded,
    renameNoteTabs,
  ]);

  const noteCountBadge = useMemo(() => (
    <strong className="rounded-full bg-secondary px-[7px] py-px text-xs font-medium text-text">
      {noteTree.length}
    </strong>
  ), [noteTree.length]);

  const submitCreate = (): void => {
    if (!savePath || !draftName.trim()) {
      return;
    }

    if (!isVSCodeRuntime()) {
      const nextRelativePath = ensureDemoNotePath(draftName.trim());
      const exists = noteTree.some((entry) => entry.relativePath === nextRelativePath);
      if (exists) {
        handleNoteCreateFailed({ message: t('note.create_failed') });
        return;
      }

      handleNoteCreated({ entry: createDemoNoteEntry(nextRelativePath) });
      setDraftName('');
      setIsCreating(false);
      return;
    }

    createNoteState();
    postMessage('CREATE_NOTE', { savePath, relativePath: draftName.trim() });
  };

  return (
    <SidebarSection
      title={t('note.section_title')}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
      badge={noteCountBadge}
      actions={(
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
          aria-label={t('note.create')}
          title={t('note.create')}
          onClick={() => setIsCreating((current) => !current)}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
        </button>
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {isCreating ? (
          <div className="border-b border-line px-2.5 py-2">
            <input
              className="w-full rounded-md border border-line bg-panel px-2 py-1 text-xs text-text outline-none focus:border-focus"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitCreate();
                }
              }}
              placeholder={t('note.create_placeholder')}
              autoFocus
            />
          </div>
        ) : null}
        <NoteTree
          entries={noteTree}
          isLoading={isLoadingNoteTree}
          error={noteTreeError}
          activeRelativePath={activeRelativePath}
          onRetry={() => {
            if (!savePath) {
              pushToast(t('ai_summary.no_save_path'), 'warning');
              return;
            }
            loadNoteTree();
            postMessage('FETCH_NOTE_TREE', { savePath });
          }}
          onOpen={(relativePath: string) => openNoteTreeEntry(relativePath)}
          onDelete={(relativePath: string) => {
            if (!savePath) {
              return;
            }

            if (!isVSCodeRuntime()) {
              handleNoteDeleted({ relativePath });
              closeNoteTabs(relativePath);
              return;
            }

            deleteNoteState();
            postMessage('DELETE_NOTE', { savePath, relativePath });
          }}
          onMove={(fromRelativePath: string, toRelativePath: string) => {
            if (!savePath) {
              return;
            }

            if (!isVSCodeRuntime()) {
              const nextRelativePath = ensureDemoNotePath(toRelativePath);
              const exists = noteTree.some((entry) => entry.relativePath === nextRelativePath && entry.relativePath !== fromRelativePath);
              if (exists) {
                handleNoteMoveFailed({ message: t('note.move_failed') });
                return;
              }

              handleNoteMoved({ fromRelativePath, toRelativePath: nextRelativePath });
              renameNoteTabs(fromRelativePath, nextRelativePath);
              return;
            }

            moveNoteState();
            postMessage('MOVE_NOTE', { savePath, fromRelativePath, toRelativePath });
          }}
        />
      </div>
    </SidebarSection>
  );
};

const DEMO_NOTE_ENTRIES: NoteEntry[] = [
  ...DEMO_AI_SUMMARY_NOTE_ENTRIES,
  createDemoNoteEntry('ideas/todo.md', '2026-07-11T09:00:00.000Z'),
  createDemoNoteEntry('ideas/retro.md', '2026-07-10T15:30:00.000Z'),
  createDemoNoteEntry('scratch.md', '2026-07-09T05:20:00.000Z'),
];

function ensureDemoNotePath(relativePath: string): string {
  const normalized = relativePath.replaceAll('\\', '/').trim().replace(/^\/+|\/+$/g, '');
  const parts = normalized.split('/').filter(Boolean);
  const fileName = parts.at(-1) ?? 'untitled';

  if (!fileName.includes('.')) {
    parts[parts.length - 1] = `${fileName}.md`;
  }

  return parts.join('/');
}

function createDemoNoteEntry(relativePath: string, updatedAt = new Date().toISOString()): NoteEntry {
  return {
    relativePath,
    name: relativePath.split('/').at(-1) ?? relativePath,
    updatedAt,
  };
}
