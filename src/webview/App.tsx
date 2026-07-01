import { useEffect, useRef, useState, type FC, type ReactElement } from 'react';
import { S01CommitListScreen } from './features/F01';
import { S02HistoryViewScreen } from './features/F02';
import { S03CodeViewerScreen } from './features/F03';
import { S05DependencyCanvasScreen } from './features/F04';
import { S04AISummaryViewerScreen } from './features/F05';
import { S06SettingsScreen } from './features/F06';
import { S08IntraFileSymbolDependencyCanvasScreen } from './features/F10';
import { BatchProgressBar } from './features/F08/BatchProgressBar';
import { isVSCodeRuntime, postMessage } from './bridge/vscodeApi';
import { ToastContainer } from './shared/components';
import { RouteSlotProvider } from './shared/route/RouteSlotContext';
import { useAppStore } from './store/appStore';
import type { AIProviderName, RouteTransitionDirection, ScreenID } from './types/commit';

const ROUTE_TRANSITION_DURATION_MS = 200;

export const App: FC = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const transitionDirection = useAppStore((state) => state.transitionDirection);
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
  const [outgoingScreen, setOutgoingScreen] = useState<{
    screen: ScreenID;
    direction: RouteTransitionDirection;
  } | null>(null);
  const previousScreenRef = useRef<ScreenID>(currentScreen);

  useEffect(() => {
    if (isVSCodeRuntime()) {
      postMessage('FETCH_AI_SUMMARY_SETTINGS');
    }

    const handler = (
      event: MessageEvent<{ type: string; payload?: any }>,
    ): void => {
      if (event.data.type === 'AI_SUMMARY_SETTINGS_LOADED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
          summaryModel: event.data.payload?.summaryModel ?? null,
          qaModel: event.data.payload?.qaModel ?? null,
        });
        return;
      }

      if (event.data.type === 'AI_MODEL_UPDATED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
          summaryModel: event.data.payload?.summaryModel ?? null,
          qaModel: event.data.payload?.qaModel ?? null,
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

      if (event.data.type === 'SYMBOL_GRAPH_LOADED') {
        useAppStore.getState().handleSymbolGraphLoaded({
          nodes: event.data.payload?.nodes ?? [],
          edges: event.data.payload?.edges ?? [],
          fileContent: event.data.payload?.fileContent ?? '',
        });
      }

      if (event.data.type === 'SYMBOL_GRAPH_LOAD_FAILED') {
        useAppStore.getState().handleSymbolGraphLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleBatchCancelled, handleBatchCancelling, handleBatchComplete, handleBatchError, handleBatchProgress, handleBatchStarted, setAISummarySettings]);

  useEffect(() => {
    if (previousScreenRef.current === currentScreen) {
      return;
    }

    setOutgoingScreen({
      screen: previousScreenRef.current,
      direction: transitionDirection,
    });
    previousScreenRef.current = currentScreen;

    const timer = window.setTimeout(() => {
      setOutgoingScreen(null);
    }, ROUTE_TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [currentScreen, transitionDirection]);

  return (
    <>
      <BatchProgressBar batchTotal={batchTotal} batchCompleted={batchCompleted} isBatchRunning={isBatchRunning} isCancelling={isBatchCancelling} onCancel={cancelBatchAISummary} />
      <div className="relative h-screen overflow-hidden bg-surface">
        {outgoingScreen && (
          <div className={getScreenSlotClassName(outgoingScreen.direction, 'exiting')} aria-hidden="true">
            <RouteSlotProvider isActive={false}>{renderScreen(outgoingScreen.screen)}</RouteSlotProvider>
          </div>
        )}
        <div className={getScreenSlotClassName(transitionDirection, outgoingScreen ? 'entering' : null)}>
          <RouteSlotProvider isActive>{renderScreen(currentScreen)}</RouteSlotProvider>
        </div>
      </div>
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

  if (currentScreen === 'S08') {
    return <S08IntraFileSymbolDependencyCanvasScreen />;
  }

  return <S01CommitListScreen />;
}

function getScreenSlotClassName(
  direction: RouteTransitionDirection,
  state: 'entering' | 'exiting' | null,
): string {
  const baseClassName = 'absolute inset-0 overflow-y-auto bg-surface';

  if (state === 'entering') {
    return `${baseClassName} ${direction === 'forward' ? 'motion-safe-route-in-forward motion-safe:animate-route-in-forward' : 'motion-safe-route-in-back motion-safe:animate-route-in-back'}`;
  }

  if (state === 'exiting') {
    return `${baseClassName} pointer-events-none ${direction === 'forward' ? 'motion-safe-route-out-forward motion-safe:animate-route-out-forward' : 'motion-safe-route-out-back motion-safe:animate-route-out-back'}`;
  }

  return baseClassName;
}
