import { create } from 'zustand';
import { createCommitGroupSlice, type CommitGroupSlice } from './slices/commitGroupSlice';
import { createCommitListSlice, type CommitListSlice } from './slices/commitListSlice';
import { createBranchSlice, type BranchSlice } from './slices/branchSlice';
import { createNavigationSlice, type NavigationSlice } from './slices/navigationSlice';
import { createChangedFilesSlice, type ChangedFilesSlice } from './slices/changedFilesSlice';
import { createDependencyGraphSlice, type DependencyGraphSlice } from './slices/dependencyGraphSlice';
import { createFileDiffSlice, type FileDiffSlice } from './slices/fileDiffSlice';
import { createSymbolGraphSlice, type SymbolGraphSlice } from './slices/symbolGraphSlice';
import { createAISlice, type AISlice } from './slices/aiSlice';
import { createGithubSlice, type GithubSlice } from './slices/githubSlice';
import { createNoteSlice, type NoteSlice } from './slices/noteSlice';
import { createToastSlice, type ToastSlice } from './slices/toastSlice';
import { createWorkspaceTabsSlice, type WorkspaceTabsSlice } from './slices/workspaceTabsSlice';

export type AppState = CommitListSlice &
  BranchSlice &
  NavigationSlice &
  ChangedFilesSlice &
  DependencyGraphSlice &
  FileDiffSlice &
  SymbolGraphSlice &
  AISlice &
  NoteSlice &
  ToastSlice &
  WorkspaceTabsSlice &
  GithubSlice &
  CommitGroupSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createCommitListSlice(...a),
  ...createBranchSlice(...a),
  ...createNavigationSlice(...a),
  ...createChangedFilesSlice(...a),
  ...createDependencyGraphSlice(...a),
  ...createFileDiffSlice(...a),
  ...createSymbolGraphSlice(...a),
  ...createAISlice(...a),
  ...createNoteSlice(...a),
  ...createToastSlice(...a),
  ...createWorkspaceTabsSlice(...a),
  ...createGithubSlice(...a),
  ...createCommitGroupSlice(...a),
}));
