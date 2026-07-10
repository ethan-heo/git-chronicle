import type { StateCreator } from 'zustand';
import { translate } from '../../i18n/runtime';
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
