import type { FC } from 'react';
import { S01CommitListScreen } from './features/F01';
import { S02HistoryViewScreen } from './features/F02';
import { S03CodeViewerScreen } from './features/F03';
import { S05DependencyCanvasScreen } from './features/F04';
import { S04AISummaryViewerScreen } from './features/F05';
import { TopHeader } from './shared/components';
import { useAppStore } from './store/appStore';

export const App: FC = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const summaryMode = useAppStore((state) => state.summaryMode);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);

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
    return (
      <main className="app-shell commit-log-shell pending-screen-shell">
        <TopHeader title={getPendingTitle(currentScreen, summaryMode)} context={selectedFile?.path ?? selectedCommit?.shortHash ?? '준비 중'} showBackButton onBackClick={goBackFromDetail} />
        <section className="history-view-state">
          <div className="pending-screen-message">
            <strong>{getPendingTitle(currentScreen, summaryMode)}</strong>
            <span>{currentScreen} 화면은 다음 기능 단계에서 구현됩니다.</span>
          </div>
        </section>
      </main>
    );
  }

  return <S01CommitListScreen />;
};

function getPendingTitle(screen: string, summaryMode: string): string {
  if (screen === 'S03') {
    return '코드 보기';
  }

  if (screen === 'S04') {
    return summaryMode === 'commit' ? '커밋 AI 정리' : 'AI 정리 보기';
  }

  if (screen === 'S06') {
    return '설정';
  }

  return '캔버스 보기';
}
