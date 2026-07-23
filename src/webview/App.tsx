import { useEffect, useRef, useState, type FC } from 'react';
import { S02WorkspaceScreen } from './features/F02';
import { isVSCodeRuntime, postMessage } from './bridge/vscodeApi';
import { ToastContainer } from './shared/components';
import { RouteSlotProvider } from './shared/route/RouteSlotContext';
import { useAppStore } from './store/appStore';
import type { AIProviderName, AIUsageInfo, RouteTransitionDirection, ScreenID } from './types/commit';

const ROUTE_TRANSITION_DURATION_MS = 200;

interface WebviewEventPayload {
  savePath?: string | null;
  activeAIProvider?: AIProviderName | null;
  registeredProviders?: AIProviderName[];
  summaryModel?: string | null;
  commitHash?: string | null;
  isOverLimit?: boolean;
  chunk?: string;
  content?: string;
  savedPath?: string | null;
  noteRelativePath?: string | null;
  provider?: AIProviderName | null;
  usage?: AIUsageInfo | null;
  message?: string;
}

export const App: FC = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const transitionDirection = useAppStore((state) => state.transitionDirection);
  const toasts = useAppStore((state) => state.toasts);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
  const dismissToast = useAppStore((state) => state.dismissToast);
  const appendAISummaryChunk = useAppStore((state) => state.appendAISummaryChunk);
  const completeAISummary = useAppStore((state) => state.completeAISummary);
  const loadSavedAISummary = useAppStore((state) => state.loadSavedAISummary);
  const failAISummary = useAppStore((state) => state.failAISummary);
  const setSummaryTokenWarning = useAppStore((state) => state.setSummaryTokenWarning);
  const startAISummaryGeneration = useAppStore((state) => state.startAISummaryGeneration);
  const activeSummaryCommitHash = useAppStore((state) => state.activeSummaryCommitHash);
  const activeSummaryTargetKey = useAppStore((state) => state.activeSummaryTargetKey);
  const markCurrentSummarySaved = useAppStore((state) => state.markCurrentSummarySaved);
  const [outgoingScreen, setOutgoingScreen] = useState<{
    screen: ScreenID;
    direction: RouteTransitionDirection;
  } | null>(null);
  const previousScreenRef = useRef<ScreenID>(currentScreen);

  useEffect(() => {
    if (isVSCodeRuntime()) {
      postMessage('FETCH_AI_SUMMARY_SETTINGS');
    }

    const handler = (event: MessageEvent<{ type: string; payload?: WebviewEventPayload }>): void => {
      if (event.data.type === 'AI_SUMMARY_SETTINGS_LOADED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
          summaryModel: event.data.payload?.summaryModel ?? null,
        });
        return;
      }

      if (event.data.type === 'AI_MODEL_UPDATED') {
        setAISummarySettings({
          savePath: event.data.payload?.savePath ?? null,
          activeAIProvider: event.data.payload?.activeAIProvider ?? null,
          registeredProviders: event.data.payload?.registeredProviders ?? [],
          summaryModel: event.data.payload?.summaryModel ?? null,
        });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_STARTED') {
        startAISummaryGeneration({ preserveSavedSummary: true, commitHash: activeSummaryCommitHash });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_TOKEN_WARNING') {
        if (event.data.payload?.commitHash === activeSummaryCommitHash) {
          setSummaryTokenWarning(Boolean(event.data.payload?.isOverLimit));
        }
        return;
      }

      if (event.data.type === 'AI_SUMMARY_CHUNK') {
        appendAISummaryChunk(event.data.payload?.chunk ?? '');
        return;
      }

      if (event.data.type === 'AI_SUMMARY_LOADED') {
        loadSavedAISummary({
          content: event.data.payload?.content ?? '',
          savedPath: event.data.payload?.savedPath ?? null,
          noteRelativePath: event.data.payload?.noteRelativePath ?? null,
          provider: event.data.payload?.provider ?? null,
          scope: 'commit',
          commitHash: activeSummaryCommitHash,
          targetKey: activeSummaryTargetKey,
        });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_DONE') {
        completeAISummary({
          content: event.data.payload?.content,
          savedPath: event.data.payload?.savedPath ?? null,
          noteRelativePath: event.data.payload?.noteRelativePath ?? null,
          provider: event.data.payload?.provider ?? null,
          usage: event.data.payload?.usage ?? null,
          scope: 'commit',
          commitHash: activeSummaryCommitHash,
          targetKey: activeSummaryTargetKey,
        });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_NOTE_LINKED') {
        const noteRelativePath = event.data.payload?.noteRelativePath ?? null;
        if (!noteRelativePath) {
          return;
        }

        markCurrentSummarySaved({
          content: event.data.payload?.content,
          savedPath: event.data.payload?.savedPath ?? null,
          noteRelativePath,
          provider: event.data.payload?.provider ?? null,
          commitHash: activeSummaryCommitHash,
          targetKey: activeSummaryTargetKey,
        });
        return;
      }

      if (event.data.type === 'AI_SUMMARY_ERROR') {
        failAISummary(event.data.payload?.message);
        return;
      }

    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [activeSummaryCommitHash, activeSummaryTargetKey, appendAISummaryChunk, completeAISummary, failAISummary, loadSavedAISummary, markCurrentSummarySaved, setAISummarySettings, setSummaryTokenWarning, startAISummaryGeneration]);

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
      <div className="relative h-screen overflow-hidden bg-surface">
        {outgoingScreen && (
          <div className={getScreenSlotClassName(outgoingScreen.direction, 'exiting')} aria-hidden="true">
            <RouteSlotProvider isActive={false}><S02WorkspaceScreen /></RouteSlotProvider>
          </div>
        )}
        <div className={getScreenSlotClassName(transitionDirection, outgoingScreen ? 'entering' : null)}>
          <RouteSlotProvider isActive><S02WorkspaceScreen /></RouteSlotProvider>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

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
