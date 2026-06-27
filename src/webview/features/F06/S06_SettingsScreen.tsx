import { useEffect, useState, type FC } from 'react';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { AIProviderName } from '../../types/commit';
import { AIProviderSection } from './AIProviderSection';
import { SavePathSection } from './SavePathSection';

type ProviderErrors = Partial<Record<AIProviderName, string>>;

interface AISettingsPayload {
  savePath?: string | null;
  registeredProviders?: AIProviderName[];
  activeAIProvider?: AIProviderName | null;
  providerName?: AIProviderName;
  message?: string;
}

export const S06SettingsScreen: FC = () => {
  const savePath = useAppStore((state) => state.savePath);
  const registeredProviders = useAppStore((state) => state.registeredProviders);
  const activeAIProvider = useAppStore((state) => state.activeAIProvider);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const setAISummarySettings = useAppStore((state) => state.setAISummarySettings);
  const isRouteSlotActive = useRouteSlotActive();
  const [registeringProvider, setRegisteringProvider] = useState<AIProviderName | null>(null);
  const [providerErrors, setProviderErrors] = useState<ProviderErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    if (isVSCodeRuntime()) {
      postMessage('FETCH_AI_SUMMARY_SETTINGS');
    }
  }, [isRouteSlotActive]);

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    const handler = (event: MessageEvent<{ type: string; payload?: AISettingsPayload }>): void => {
      const { type, payload } = event.data;

      if (
        type === 'AI_SUMMARY_SETTINGS_LOADED' ||
        type === 'AI_PROVIDER_REGISTERED' ||
        type === 'AI_PROVIDER_STATE_UPDATED' ||
        type === 'SAVE_PATH_SET' ||
        type === 'SAVE_PATH_CLEARED'
      ) {
        setAISummarySettings({
          savePath: payload?.savePath ?? null,
          registeredProviders: payload?.registeredProviders ?? [],
          activeAIProvider: payload?.activeAIProvider ?? null,
        });
        setRegisteringProvider(null);
        setProviderErrors({});
        setStatusMessage(getSuccessMessage(type, payload?.providerName, payload?.activeAIProvider ?? null));
        return;
      }

      if (type === 'AI_PROVIDER_REGISTRATION_FAILED') {
        setRegisteringProvider(null);
        if (payload?.providerName) {
          setProviderErrors((errors) => ({
            ...errors,
            [payload.providerName as AIProviderName]: payload.message || 'CLI가 감지되지 않습니다. 설치 페이지를 확인하세요',
          }));
        }
        setStatusMessage(payload?.message || '연동에 실패했습니다');
        return;
      }

      if (type === 'AI_SETTINGS_ERROR') {
        setRegisteringProvider(null);
        setStatusMessage(payload?.message || '설정을 변경하지 못했습니다');
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [isRouteSlotActive, setAISummarySettings]);

  const handleProviderClick = (providerName: AIProviderName): void => {
    if (registeringProvider) {
      return;
    }

    setProviderErrors((errors) => ({ ...errors, [providerName]: undefined }));

    if (!isVSCodeRuntime()) {
      handleDemoProviderClick(providerName);
      return;
    }

    if (registeredProviders.includes(providerName)) {
      postMessage('ACTIVATE_AI_PROVIDER', { name: providerName });
      return;
    }

    setRegisteringProvider(providerName);
    postMessage('REGISTER_AI_PROVIDER', { name: providerName });
  };

  const handleDemoProviderClick = (providerName: AIProviderName): void => {
    if (!registeredProviders.includes(providerName)) {
      setRegisteringProvider(providerName);
      window.setTimeout(() => {
        setRegisteringProvider(null);
        if (providerName === 'codex') {
          setProviderErrors((errors) => ({
            ...errors,
            codex: 'CLI가 감지되지 않습니다. 설치 페이지를 확인하세요',
          }));
          setStatusMessage('Codex CLI를 찾을 수 없습니다');
          return;
        }

        setAISummarySettings({
          registeredProviders: Array.from(new Set([...registeredProviders, providerName])),
          activeAIProvider: providerName,
        });
        setStatusMessage(`${providerName} 등록 완료 · 활성화됨`);
      }, 700);
      return;
    }

    setAISummarySettings({
      registeredProviders,
      activeAIProvider: activeAIProvider === providerName ? null : providerName,
    });
    setStatusMessage(activeAIProvider === providerName ? 'AI가 비활성화되었습니다' : `${providerName} 활성화됨`);
  };

  const handleOpenInstall = (url: string): void => {
    if (isVSCodeRuntime()) {
      postMessage('OPEN_EXTERNAL_URL', { url });
      return;
    }

    window.open(url, '_blank', 'noopener');
  };

  const handlePathSelect = (): void => {
    if (isVSCodeRuntime()) {
      postMessage('SET_SAVE_PATH');
      return;
    }

    setAISummarySettings({ savePath: '/Users/example/git-author-summaries' });
    setStatusMessage('저장 경로가 설정되었습니다');
  };

  const handlePathDelete = (): void => {
    if (isVSCodeRuntime()) {
      postMessage('CLEAR_SAVE_PATH');
      return;
    }

    setAISummarySettings({ savePath: null });
    setStatusMessage('저장 경로 설정을 삭제했습니다 · 기존 파일은 유지됩니다');
  };

  return (
    <main className="app-shell commit-log-shell settings-shell">
      <TopHeader title="설정" context="Git Author Explorer" showBackButton onBackClick={goBackFromDetail} />
      <div className="settings-screen">
        <AIProviderSection
          registeredProviders={registeredProviders}
          activeAIProvider={activeAIProvider}
          registeringProvider={registeringProvider}
          providerErrors={providerErrors}
          onProviderClick={handleProviderClick}
          onOpenInstall={handleOpenInstall}
        />
        <SavePathSection savePath={savePath} onPathSelect={handlePathSelect} onPathDelete={handlePathDelete} />
      </div>
      {statusMessage ? (
        <div className="settings-toast" role="status">
          {statusMessage}
        </div>
      ) : null}
    </main>
  );
};

function getSuccessMessage(type: string, providerName: AIProviderName | undefined, activeAIProvider: AIProviderName | null): string | null {
  if (type === 'AI_SUMMARY_SETTINGS_LOADED') {
    return null;
  }

  if (type === 'AI_PROVIDER_REGISTERED' && providerName) {
    return `${providerName} 등록 완료 · 활성화됨`;
  }

  if (type === 'AI_PROVIDER_STATE_UPDATED') {
    return activeAIProvider ? `${activeAIProvider} 활성화됨` : 'AI가 비활성화되었습니다';
  }

  if (type === 'SAVE_PATH_SET') {
    return '저장 경로가 설정되었습니다';
  }

  if (type === 'SAVE_PATH_CLEARED') {
    return '저장 경로 설정을 삭제했습니다 · 기존 파일은 유지됩니다';
  }

  return null;
}
