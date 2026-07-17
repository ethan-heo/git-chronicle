import type { StateCreator } from 'zustand';
import { postMessage } from '../../bridge/vscodeApi';
import { translate } from '../../i18n/runtime';
import type { CommitGroup } from '../../types/commit';
import type { AppState } from '../appStore';

export interface CommitGroupSlice {
  commitGroups: CommitGroup[];
  isSelectModeActive: boolean;
  selectedCommitHashesForGroup: Set<string>;
  editingGroupId: string | null;

  fetchCommitGroups: () => void;
  toggleSelectMode: () => void;
  toggleCommitSelectionForGroup: (hash: string) => void;
  startEditingGroup: (group: CommitGroup) => void;
  cancelSelectMode: () => void;
  saveGroup: (name: string) => void;
  deleteGroup: (id: string) => void;
  handleCommitGroupsLoaded: (payload: { groups: CommitGroup[] }) => void;
  handleCommitGroupCreated: (payload: { group: CommitGroup }) => void;
  handleCommitGroupUpdated: (payload: { group: CommitGroup }) => void;
  handleCommitGroupDeleted: (payload: { id: string }) => void;
  handleCommitGroupCreateFailed: (payload: { message?: string }) => void;
  handleCommitGroupUpdateFailed: (payload: { message?: string }) => void;
  handleCommitGroupDeleteFailed: (payload: { message?: string }) => void;
}

function upsertCommitGroup(groups: CommitGroup[], nextGroup: CommitGroup): CommitGroup[] {
  const filtered = groups.filter((group) => group.id !== nextGroup.id);
  return [...filtered, nextGroup].sort((left, right) => left.name.localeCompare(right.name));
}

export const createCommitGroupSlice: StateCreator<AppState, [], [], CommitGroupSlice> = (set, get) => ({
  commitGroups: [],
  isSelectModeActive: false,
  selectedCommitHashesForGroup: new Set(),
  editingGroupId: null,

  fetchCommitGroups: () => {
    postMessage('FETCH_COMMIT_GROUPS');
  },

  toggleSelectMode: () => {
    set((state) => ({
      isSelectModeActive: !state.isSelectModeActive,
      selectedCommitHashesForGroup: new Set(),
      editingGroupId: null,
    }));
  },

  cancelSelectMode: () => {
    set({
      isSelectModeActive: false,
      selectedCommitHashesForGroup: new Set(),
      editingGroupId: null,
    });
  },

  toggleCommitSelectionForGroup: (hash) => {
    set((state) => {
      const nextSelection = new Set(state.selectedCommitHashesForGroup);

      if (nextSelection.has(hash)) {
        nextSelection.delete(hash);
      } else {
        nextSelection.add(hash);
      }

      return { selectedCommitHashesForGroup: nextSelection };
    });
  },

  startEditingGroup: (group) => {
    set({
      isSelectModeActive: true,
      editingGroupId: group.id,
      selectedCommitHashesForGroup: new Set(group.commitHashes),
    });
    get().setFilter({ filterGroupId: null });
  },

  saveGroup: (name) => {
    const state = get();
    const commitHashes = [...state.selectedCommitHashesForGroup];

    if (state.editingGroupId) {
      postMessage('UPDATE_COMMIT_GROUP', { id: state.editingGroupId, name, commitHashes });
    } else {
      postMessage('CREATE_COMMIT_GROUP', { name, commitHashes });
    }

    set({
      isSelectModeActive: false,
      selectedCommitHashesForGroup: new Set(),
      editingGroupId: null,
    });
  },

  deleteGroup: (id) => {
    postMessage('DELETE_COMMIT_GROUP', { id });

    if (get().filterGroupId === id) {
      get().setFilter({ filterGroupId: null });
    }
  },

  handleCommitGroupsLoaded: ({ groups }) => {
    set({ commitGroups: groups });
  },

  handleCommitGroupCreated: ({ group }) => {
    set((state) => ({ commitGroups: upsertCommitGroup(state.commitGroups, group) }));
    get().pushToast(translate('toast.commit_group_created'), 'success');
  },

  handleCommitGroupUpdated: ({ group }) => {
    set((state) => ({ commitGroups: upsertCommitGroup(state.commitGroups, group) }));
    get().pushToast(translate('toast.commit_group_updated'), 'success');

    if (get().filterGroupId === group.id) {
      get().setFilter({ filterGroupId: group.id });
    }
  },

  handleCommitGroupDeleted: ({ id }) => {
    set((state) => ({ commitGroups: state.commitGroups.filter((group) => group.id !== id) }));
    get().pushToast(translate('toast.commit_group_deleted'), 'success');
  },

  handleCommitGroupCreateFailed: ({ message = translate('toast.commit_group_create_failed') }) => {
    get().pushToast(message, 'error');
  },

  handleCommitGroupUpdateFailed: ({ message = translate('toast.commit_group_update_failed') }) => {
    get().pushToast(message, 'error');
  },

  handleCommitGroupDeleteFailed: ({ message = translate('toast.commit_group_delete_failed') }) => {
    get().pushToast(message, 'error');
  },
});
