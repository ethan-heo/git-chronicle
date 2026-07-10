import { create } from 'zustand';
import { createCommitListSlice, type CommitListSlice } from './slices/commitListSlice';
import { createNavigationSlice, type NavigationSlice } from './slices/navigationSlice';
import { createChangedFilesSlice, type ChangedFilesSlice } from './slices/changedFilesSlice';
import { createDependencyGraphSlice, type DependencyGraphSlice } from './slices/dependencyGraphSlice';
import { createSymbolGraphSlice, type SymbolGraphSlice } from './slices/symbolGraphSlice';
import { createAISlice, type AISlice } from './slices/aiSlice';
import { createGithubSlice, type GithubSlice } from './slices/githubSlice';
import { createNoteSlice, type NoteSlice } from './slices/noteSlice';
import { createToastSlice, type ToastSlice } from './slices/toastSlice';
import { createWorkspaceTabsSlice, type WorkspaceTabsSlice } from './slices/workspaceTabsSlice';

export type AppState = CommitListSlice &
  NavigationSlice &
  ChangedFilesSlice &
  DependencyGraphSlice &
  SymbolGraphSlice &
  AISlice &
  NoteSlice &
  ToastSlice &
  WorkspaceTabsSlice &
  GithubSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createCommitListSlice(...a),
  ...createNavigationSlice(...a),
  ...createChangedFilesSlice(...a),
  ...createDependencyGraphSlice(...a),
  ...createSymbolGraphSlice(...a),
  ...createAISlice(...a),
  ...createNoteSlice(...a),
  ...createToastSlice(...a),
  ...createWorkspaceTabsSlice(...a),
  ...createGithubSlice(...a),
}));
