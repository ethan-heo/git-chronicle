import type { StateCreator } from 'zustand';
import type { AppState } from '../appStore';

export interface NoteSlice {
  noteContent: string;
  noteSavedPath: string | null;
  isLoadingNote: boolean;
  isSavingNote: boolean;
  noteError: string | null;
  hasSavedNote: boolean;

  startNoteLoading: () => void;
  setNoteContent: (content: string) => void;
  startNoteSaving: () => void;
  handleNoteLoaded: (payload: { content: string; savedPath?: string | null; hasSavedNote?: boolean }) => void;
  handleNoteLoadFailed: (message?: string) => void;
  handleNoteSaved: (payload: { content: string; savedPath?: string | null; hasSavedNote?: boolean }) => void;
  handleNoteSaveFailed: (message?: string) => void;
}

export const createNoteSlice: StateCreator<AppState, [], [], NoteSlice> = (set) => ({
  noteContent: '',
  noteSavedPath: null,
  isLoadingNote: false,
  isSavingNote: false,
  noteError: null,
  hasSavedNote: false,

  startNoteLoading: () => {
    set({
      isLoadingNote: true,
      isSavingNote: false,
      noteError: null,
    });
  },

  setNoteContent: (content) => {
    set({
      noteContent: content,
      noteError: null,
    });
  },

  startNoteSaving: () => {
    set({
      isSavingNote: true,
      noteError: null,
    });
  },

  handleNoteLoaded: (payload) => {
    set({
      noteContent: payload.content,
      noteSavedPath: payload.savedPath ?? null,
      isLoadingNote: false,
      isSavingNote: false,
      noteError: null,
      hasSavedNote: payload.hasSavedNote ?? Boolean(payload.savedPath),
    });
  },

  handleNoteLoadFailed: (message = '노트를 불러오지 못했습니다') => {
    set({
      isLoadingNote: false,
      isSavingNote: false,
      noteError: message,
    });
  },

  handleNoteSaved: (payload) => {
    set({
      noteContent: payload.content,
      noteSavedPath: payload.savedPath ?? null,
      isLoadingNote: false,
      isSavingNote: false,
      noteError: null,
      hasSavedNote: payload.hasSavedNote ?? Boolean(payload.savedPath),
    });
  },

  handleNoteSaveFailed: (message = '노트를 저장하지 못했습니다') => {
    set({
      isSavingNote: false,
      noteError: message,
    });
  },
});
