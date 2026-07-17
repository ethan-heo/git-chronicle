import { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { CommitGroup } from '../../types/commit';

interface UseCommitGroupsResult {
  commitGroups: CommitGroup[];
  isSelectModeActive: boolean;
  selectedCommitHashesForGroup: Set<string>;
  editingGroupId: string | null;
  toggleSelectMode: () => void;
  cancelSelectMode: () => void;
  toggleCommitSelectionForGroup: (hash: string) => void;
  startEditingGroup: (group: CommitGroup) => void;
  saveGroup: (name: string) => void;
  deleteGroup: (id: string) => void;
}

export function useCommitGroups(options: { isActive: boolean }): UseCommitGroupsResult {
  const { isActive } = options;
  const commitGroups = useAppStore((state) => state.commitGroups);
  const isSelectModeActive = useAppStore((state) => state.isSelectModeActive);
  const selectedCommitHashesForGroup = useAppStore((state) => state.selectedCommitHashesForGroup);
  const editingGroupId = useAppStore((state) => state.editingGroupId);
  const fetchCommitGroups = useAppStore((state) => state.fetchCommitGroups);
  const toggleSelectMode = useAppStore((state) => state.toggleSelectMode);
  const cancelSelectMode = useAppStore((state) => state.cancelSelectMode);
  const toggleCommitSelectionForGroup = useAppStore((state) => state.toggleCommitSelectionForGroup);
  const startEditingGroup = useAppStore((state) => state.startEditingGroup);
  const saveGroup = useAppStore((state) => state.saveGroup);
  const deleteGroup = useAppStore((state) => state.deleteGroup);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    fetchCommitGroups();
  }, [isActive, fetchCommitGroups]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: { groups?: CommitGroup[]; group?: CommitGroup; id?: string; message?: string };
      }>,
    ): void => {
      const store = useAppStore.getState();

      switch (event.data.type) {
        case 'COMMIT_GROUPS_LOADED':
          store.handleCommitGroupsLoaded({ groups: event.data.payload?.groups ?? [] });
          break;
        case 'COMMIT_GROUP_CREATED':
          if (event.data.payload?.group) {
            store.handleCommitGroupCreated({ group: event.data.payload.group });
          }
          break;
        case 'COMMIT_GROUP_UPDATED':
          if (event.data.payload?.group) {
            store.handleCommitGroupUpdated({ group: event.data.payload.group });
          }
          break;
        case 'COMMIT_GROUP_DELETED':
          if (event.data.payload?.id) {
            store.handleCommitGroupDeleted({ id: event.data.payload.id });
          }
          break;
        case 'COMMIT_GROUP_CREATE_FAILED':
          store.handleCommitGroupCreateFailed({ message: event.data.payload?.message });
          break;
        case 'COMMIT_GROUP_UPDATE_FAILED':
          store.handleCommitGroupUpdateFailed({ message: event.data.payload?.message });
          break;
        case 'COMMIT_GROUP_DELETE_FAILED':
          store.handleCommitGroupDeleteFailed({ message: event.data.payload?.message });
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [isActive]);

  return {
    commitGroups,
    isSelectModeActive,
    selectedCommitHashesForGroup,
    editingGroupId,
    toggleSelectMode,
    cancelSelectMode,
    toggleCommitSelectionForGroup,
    startEditingGroup,
    saveGroup,
    deleteGroup,
  };
}
