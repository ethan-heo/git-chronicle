import type { FC } from 'react';
import { S01CommitListScreen } from './features/F01';
import { S02HistoryViewScreen } from './features/F02';
import { S03CodeViewerScreen } from './features/F03';
import { S05DependencyCanvasScreen } from './features/F04';
import { S04AISummaryViewerScreen } from './features/F05';
import { S06SettingsScreen } from './features/F06';
import { useAppStore } from './store/appStore';

export const App: FC = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);

  if (currentScreen === 'S02') {
    return <S02HistoryViewScreen />;
  }

  if (currentScreen === 'S03') {
    return <S03CodeViewerScreen />;
  }

  if (currentScreen === 'S05') {
    return <S05DependencyCanvasScreen />;
  }

  if (currentScreen === 'S04') {
    return <S04AISummaryViewerScreen />;
  }

  if (currentScreen === 'S06') {
    return <S06SettingsScreen />;
  }

  return <S01CommitListScreen />;
};
