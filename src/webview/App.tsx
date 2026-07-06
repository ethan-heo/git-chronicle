import { useEffect, useRef, useState, type FC, type ReactElement } from 'react';
import { S01CommitListScreen } from './features/F01';
import { S02WorkspaceScreen } from './features/F02';
import { S06SettingsScreen } from './features/F06';
import { S07NoteScreen } from './features/F11';
import { isVSCodeRuntime, postMessage } from './bridge/vscodeApi';
import { ToastContainer } from './shared/components';
import { RouteSlotProvider } from './shared/route/RouteSlotContext';
import { useAppStore } from './store/appStore';
import type { AIProviderName, RouteTransitionDirection, ScreenID, SymbolEdge, SymbolNode } from './types/commit';

const ROUTE_TRANSITION_DURATION_MS = 200;

interface WebviewEventPayload {
  savePath?: string | null;
  activeAIProvider?: AIProviderName | null;
  registeredProviders?: AIProviderName[];
  summaryModel?: string | null;
  qaModel?: string | null;
  nodes?: SymbolNode[];
  edges?: SymbolEdge[];
  fileContent?: string;
  message?: string;
}

export const App: FC = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const transitionDirection = useAppStore((state) => state.transitionDirection);
  const toasts = useAppStore((state) => state.toasts);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
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

    const handler = (event: MessageEvent<{ type: string; payload?: WebviewEventPayload }>): void => {
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
  }, [setAISummarySettings]);

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
    return <S02WorkspaceScreen />;
  }

  if (currentScreen === 'S06') {
    return <S06SettingsScreen />;
  }

  if (currentScreen === 'S07') {
    return <S07NoteScreen />;
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
