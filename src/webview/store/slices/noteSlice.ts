import type { StateCreator } from 'zustand';
import { translate } from '../../i18n/runtime';
import type { NoteEntry } from '../../types/note';
import type { AppState } from '../appStore';

export interface NoteStateEntry {
  noteContent: string;
  noteSavedPath: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasSavedNote: boolean;
}

export interface NoteSlice {
  notesByPane: Record<string, NoteStateEntry>;
  noteTree: NoteEntry[];
  isLoadingNoteTree: boolean;
  noteTreeError: string | null;

  loadNoteTree: () => void;
  handleNoteTreeLoaded: (payload: { entries: NoteEntry[] }) => void;
  handleNoteTreeLoadFailed: (payload: { message?: string }) => void;
  createNote: () => void;
  handleNoteCreated: (payload: { entry: NoteEntry }) => void;
  handleNoteCreateFailed: (payload: { message?: string; relativePath?: string }) => void;
  deleteNote: () => void;
  handleNoteDeleted: (payload: { relativePath: string }) => void;
  handleNoteDeleteFailed: (payload: { message?: string; relativePath?: string }) => void;
  moveNote: () => void;
  handleNoteMoved: (payload: { fromRelativePath: string; toRelativePath: string }) => void;
  handleNoteMoveFailed: (payload: { message?: string; fromRelativePath?: string }) => void;
  startNoteLoading: (paneId: string) => void;
  setNoteContent: (paneId: string, content: string) => void;
  startNoteSaving: (paneId: string) => void;
  handleNoteLoaded: (payload: { paneId: string; content: string; savedPath?: string | null; hasSavedNote?: boolean }) => void;
  handleNoteLoadFailed: (payload: { paneId: string; message?: string }) => void;
  handleNoteSaved: (payload: { paneId: string; content: string; savedPath?: string | null; hasSavedNote?: boolean }) => void;
  handleNoteSaveFailed: (payload: { paneId: string; message?: string }) => void;
}

export const EMPTY_NOTE_STATE: NoteStateEntry = {
  noteContent: '',
  noteSavedPath: null,
  isLoading: false,
  isSaving: false,
  error: null,
  hasSavedNote: false,
};

function getEntry(state: AppState, paneId: string): NoteStateEntry {
  return state.notesByPane[paneId] ?? EMPTY_NOTE_STATE;
}

export const createNoteSlice: StateCreator<AppState, [], [], NoteSlice> = (set) => ({
  notesByPane: {},
  noteTree: [],
  isLoadingNoteTree: false,
  noteTreeError: null,

  loadNoteTree: () => {
    set({
      isLoadingNoteTree: true,
      noteTreeError: null,
    });
  },

  handleNoteTreeLoaded: ({ entries }) => {
    set({
      noteTree: entries,
      isLoadingNoteTree: false,
      noteTreeError: null,
    });
  },

  handleNoteTreeLoadFailed: ({ message = translate('note.tree_load_failed') }) => {
    set({
      isLoadingNoteTree: false,
      noteTreeError: message,
    });
  },

  createNote: () => {
    set({
      noteTreeError: null,
    });
  },

  handleNoteCreated: ({ entry }) => {
    set((state) => ({
      noteTree: upsertNoteEntry(state.noteTree, entry),
      isLoadingNoteTree: false,
      noteTreeError: null,
    }));
  },

  handleNoteCreateFailed: ({ message = translate('note.create_failed') }) => {
    set({
      noteTreeError: message,
    });
  },

  deleteNote: () => {
    set({
      noteTreeError: null,
    });
  },

  handleNoteDeleted: ({ relativePath }) => {
    set((state) => ({
      noteTree: state.noteTree.filter((entry) => entry.relativePath !== relativePath),
      isLoadingNoteTree: false,
      noteTreeError: null,
    }));
  },

  handleNoteDeleteFailed: ({ message = translate('note.delete_failed') }) => {
    set({
      noteTreeError: message,
    });
  },

  moveNote: () => {
    set({
      noteTreeError: null,
    });
  },

  handleNoteMoved: ({ fromRelativePath, toRelativePath }) => {
    set((state) => ({
      noteTree: state.noteTree.map((entry) => entry.relativePath === fromRelativePath
        ? {
          ...entry,
          relativePath: toRelativePath,
          name: toRelativePath.split('/').at(-1) ?? toRelativePath,
        }
        : entry),
      isLoadingNoteTree: false,
      noteTreeError: null,
    }));
  },

  handleNoteMoveFailed: ({ message = translate('note.move_failed') }) => {
    set({
      noteTreeError: message,
    });
  },

  startNoteLoading: (paneId) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          isLoading: true,
          isSaving: false,
          error: null,
        },
      },
    }));
  },

  setNoteContent: (paneId, content) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          noteContent: content,
          error: null,
        },
      },
    }));
  },

  startNoteSaving: (paneId) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          isSaving: true,
          error: null,
        },
      },
    }));
  },

  handleNoteLoaded: ({ paneId, content, savedPath, hasSavedNote }) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          noteContent: content,
          noteSavedPath: savedPath ?? null,
          isLoading: false,
          isSaving: false,
          error: null,
          hasSavedNote: hasSavedNote ?? Boolean(savedPath),
        },
      },
    }));
  },

  handleNoteLoadFailed: ({ paneId, message = translate('note.load_failed') }) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          isLoading: false,
          isSaving: false,
          error: message,
        },
      },
    }));
  },

  handleNoteSaved: ({ paneId, content, savedPath, hasSavedNote }) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          noteContent: content,
          noteSavedPath: savedPath ?? null,
          isLoading: false,
          isSaving: false,
          error: null,
          hasSavedNote: hasSavedNote ?? Boolean(savedPath),
        },
      },
    }));
  },

  handleNoteSaveFailed: ({ paneId, message = translate('note.save_failed') }) => {
    set((state) => ({
      notesByPane: {
        ...state.notesByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          isSaving: false,
          error: message,
        },
      },
    }));
  },
});

function upsertNoteEntry(entries: NoteEntry[], nextEntry: NoteEntry): NoteEntry[] {
  const filtered = entries.filter((entry) => entry.relativePath !== nextEntry.relativePath);
  return [...filtered, nextEntry].sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
