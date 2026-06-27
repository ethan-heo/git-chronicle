import { useEffect, type FC, type ReactElement } from 'react';
import { S01CommitListScreen } from './features/F01';
import { S02HistoryViewScreen } from './features/F02';
import { S03CodeViewerScreen } from './features/F03';
import { S05DependencyCanvasScreen } from './features/F04';
import { S04AISummaryViewerScreen } from './features/F05';
import { S06SettingsScreen } from './features/F06';
import { BatchProgressBar } from './features/F08/BatchProgressBar';
import { isVSCodeRuntime, postMessage } from './bridge/vscodeApi';
import { ToastContainer } from './shared/components';
import { useAppStore } from './store/appStore';
import type { AIProviderName, ScreenID } from './types/commit';

export const App: FC = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const isBatchRunning = useAppStore((state) => state.isBatchRunning);
  const isBatchCancelling = useAppStore((state) => state.isBatchCancelling);
  const batchTotal = useAppStore((state) => state.batchTotal);
  const batchCompleted = useAppStore((state) => state.batchCompleted);
  const toasts = useAppStore((state) => state.toasts);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
  const cancelBatchAISummary = useAppStore((state) => state.cancelBatchAISummary);
  const handleBatchStarted = useAppStore((state) => state.handleBatchStarted);
  const handleBatchProgress = useAppStore((state) => state.handleBatchProgress);
  const handleBatchCancelling = useAppStore((state) => state.handleBatchCancelling);
  const handleBatchComplete = useAppStore((state) => state.handleBatchComplete);
  const handleBatchCancelled = useAppStore((state) => state.handleBatchCancelled);
  const handleBatchError = useAppStore((state) => state.handleBatchError);
  const dismissToast = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    if (isVSCodeRuntime()) {
      postMessage('FETCH_AI_SUMMARY_SETTINGS');
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          savePath?: string | null;
          activeAIProvider?: AIProviderName | null;
          registeredProviders?: AIProviderName[];
          batchTotal?: number;
          batchCompleted?: number;
          batchFailedCount?: number;
          completedFilePath?: string;
          hasSavedSummary?: boolean;
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'AI_SUMMARY_SETTINGS_LOADED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
        });
        return;
      }

      if (event.data.type === 'BATCH_AI_SUMMARY_STARTED') {
        handleBatchStarted({ batchTotal: event.data.payload?.batchTotal ?? 0 });
        return;
      }

      if (event.data.type === 'BATCH_AI_SUMMARY_PROGRESS') {
        handleBatchProgress({
          batchCompleted: event.data.payload?.batchCompleted,
          batchFailedCount: event.data.payload?.batchFailedCount,
          completedFilePath: event.data.payload?.completedFilePath,
          hasSavedSummary: event.data.payload?.hasSavedSummary,
        });
        return;
      }

      if (event.data.type === 'BATCH_AI_SUMMARY_CANCELLING') {
        handleBatchCancelling();
        return;
      }

      if (event.data.type === 'BATCH_AI_SUMMARY_DONE') {
        handleBatchComplete({
          batchCompleted: event.data.payload?.batchCompleted,
          batchFailedCount: event.data.payload?.batchFailedCount,
        });
        return;
      }

      if (event.data.type === 'BATCH_AI_SUMMARY_CANCELLED') {
        handleBatchCancelled({
          batchCompleted: event.data.payload?.batchCompleted,
          batchFailedCount: event.data.payload?.batchFailedCount,
        });
        return;
      }

      if (event.data.type === 'BATCH_AI_SUMMARY_ERROR') {
        handleBatchError(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleBatchCancelled, handleBatchCancelling, handleBatchComplete, handleBatchError, handleBatchProgress, handleBatchStarted, setAISummarySettings]);

  return (
    <>
      <BatchProgressBar batchTotal={batchTotal} batchCompleted={batchCompleted} isBatchRunning={isBatchRunning} isCancelling={isBatchCancelling} onCancel={cancelBatchAISummary} />
      {renderScreen(currentScreen)}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

function renderScreen(currentScreen: ScreenID): ReactElement {
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
}
