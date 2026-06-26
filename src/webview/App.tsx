import type { FC } from 'react';
import { S01CommitListScreen } from './features/F01';
import { TopHeader } from './shared/components';
import { useAppStore } from './store/appStore';

export const App: FC = () => {
  const { currentScreen, selectedCommit, goToCommitList } = useAppStore();

  if (currentScreen === 'S02' && selectedCommit) {
    return (
      <main className="app-shell commit-log-shell">
        <TopHeader title="커밋 이력" context={selectedCommit.shortHash} showBackButton onBackClick={goToCommitList} />
        <section className="selected-commit-panel" aria-labelledby="selected-commit-title">
          <span className="commit-hash">{selectedCommit.shortHash}</span>
          <h2 id="selected-commit-title">{selectedCommit.message}</h2>
          <p>
            {selectedCommit.author} · {formatDate(selectedCommit.date)}
          </p>
        </section>
      </main>
    );
  }

  return <S01CommitListScreen />;
};

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(parsedDate)
    .replaceAll(' ', '');
}
