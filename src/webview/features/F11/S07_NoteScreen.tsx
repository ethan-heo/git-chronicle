import type { FC } from 'react';
import { useAppStore } from '../../store/appStore';
import { NoteEditorPanel } from './NoteEditorPanel';

export const S07NoteScreen: FC = () => {
  const selectedCommit = useAppStore((state) => state.selectedCommit);

  if (!selectedCommit) {
    return null;
  }

  return <NoteEditorPanel paneId="legacy-note-screen" commit={selectedCommit} isActive />;
};
