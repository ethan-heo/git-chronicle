import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { AIModelUsage, AIProviderName } from '../../types/commit';
import { AIProviderSection } from './AIProviderSection';
import { AI_PROVIDER_MODELS } from './providers';
import { SavePathSection } from './SavePathSection';

type ProviderErrors = Partial<Record<AIProviderName, string>>;

interface AISettingsPayload {
  savePath?: string | null;
  registeredProviders?: AIProviderName[];
  activeAIProvider?: AIProviderName | null;
  summaryModel?: string | null;
  qaModel?: string | null;
  providerName?: AIProviderName;
  message?: string;
}

export const S06SettingsScreen: FC = () => {
  const { t } = useTranslation();
  const savePath = useAppStore((state) => state.savePath);
  const registeredProviders = useAppStore((state) => state.registeredProviders);
  const activeAIProvider = useAppStore((state) => state.activeAIProvider);
  const summaryModel = useAppStore((state) => state.summaryModel);
  const qaModel = useAppStore((state) => state.qaModel);
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
        type === 'AI_MODEL_UPDATED' ||
        type === 'SAVE_PATH_SET' ||
        type === 'SAVE_PATH_CLEARED'
      ) {
        setAISummarySettings({
          savePath: payload?.savePath ?? null,
          registeredProviders: payload?.registeredProviders ?? [],
          activeAIProvider: payload?.activeAIProvider ?? null,
          summaryModel: payload?.summaryModel ?? null,
          qaModel: payload?.qaModel ?? null,
        });
        setRegisteringProvider(null);
        setProviderErrors({});
        setStatusMessage(getSuccessMessage(t, type, payload?.providerName, payload?.activeAIProvider ?? null));
        return;
      }

      if (type === 'AI_PROVIDER_REGISTRATION_FAILED') {
        setRegisteringProvider(null);
        if (payload?.providerName) {
          setProviderErrors((errors) => ({ ...errors, [payload.providerName as AIProviderName]: payload.message || t('settings.provider_cli_missing') }));
        }
        setStatusMessage(payload?.message || t('settings.msg_register_failed'));
        return;
      }

      if (type === 'AI_SETTINGS_ERROR') {
        setRegisteringProvider(null);
        setStatusMessage(payload?.message || t('settings.msg_settings_error'));
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
            codex: t('settings.provider_cli_missing'),
          }));
          setStatusMessage(t('settings.provider_codex_missing'));
          return;
        }

        setAISummarySettings({
          registeredProviders: Array.from(new Set([...registeredProviders, providerName])),
          activeAIProvider: providerName,
          summaryModel: AI_PROVIDER_MODELS[providerName][0],
          qaModel: AI_PROVIDER_MODELS[providerName][0],
        });
        setStatusMessage(t('settings.msg_provider_registered', { name: providerName }));
      }, 700);
      return;
    }

    setAISummarySettings({
      registeredProviders,
      activeAIProvider: activeAIProvider === providerName ? null : providerName,
      ...(activeAIProvider === providerName ? {} : { summaryModel: AI_PROVIDER_MODELS[providerName][0], qaModel: AI_PROVIDER_MODELS[providerName][0] }),
    });
    setStatusMessage(activeAIProvider === providerName ? t('settings.msg_ai_deactivated') : t('settings.msg_provider_activated', { name: providerName }));
  };

  const handleOpenInstall = (url: string): void => {
    if (isVSCodeRuntime()) {
      postMessage('OPEN_EXTERNAL_URL', { url });
      return;
    }

    window.open(url, '_blank', 'noopener');
  };

  const handleModelChange = (providerName: AIProviderName, usage: AIModelUsage, model: string): void => {
    if (!isVSCodeRuntime()) {
      setAISummarySettings(usage === 'summary' ? { summaryModel: model } : { qaModel: model });
      return;
    }

    postMessage('SET_AI_MODEL', {
      provider: providerName,
      providerName,
      usage,
      model,
    });
  };

  const handlePathSelect = (): void => {
    if (isVSCodeRuntime()) {
      postMessage('SET_SAVE_PATH');
      return;
    }

    setAISummarySettings({ savePath: '/Users/example/git-author-summaries' });
    setStatusMessage(t('settings.msg_save_path_set'));
  };

  const handlePathDelete = (): void => {
    if (isVSCodeRuntime()) {
      postMessage('CLEAR_SAVE_PATH');
      return;
    }

    setAISummarySettings({ savePath: null });
    setStatusMessage(t('settings.msg_save_path_cleared'));
  };

  return (
    <main className="app-shell relative flex h-screen min-h-0 flex-col overflow-hidden bg-surface">
      <TopHeader title={t('settings.title')} context={t('settings.context')} showBackButton onBackClick={goBackFromDetail} />
      <div className="min-h-0 flex-1 overflow-auto bg-surface">
        <AIProviderSection
          registeredProviders={registeredProviders}
          activeAIProvider={activeAIProvider}
          registeringProvider={registeringProvider}
          providerErrors={providerErrors}
          summaryModel={summaryModel}
          qaModel={qaModel}
          onProviderClick={handleProviderClick}
          onSummaryModelChange={(providerName, model) => handleModelChange(providerName, 'summary', model)}
          onQAModelChange={(providerName, model) => handleModelChange(providerName, 'qa', model)}
          onOpenInstall={handleOpenInstall}
        />
        <SavePathSection savePath={savePath} onPathSelect={handlePathSelect} onPathDelete={handlePathDelete} />
      </div>
      {statusMessage ? (
        <div
          className="absolute bottom-3 left-1/2 z-30 max-w-[88%] -translate-x-1/2 overflow-hidden rounded-sm border border-line border-l-[3px] border-l-accent bg-elevated px-[13px] py-2 text-sm text-text shadow-[0_3px_12px_rgba(0,0,0,0.45)] text-ellipsis whitespace-nowrap"
          role="status"
        >
          {statusMessage}
        </div>
      ) : null}
    </main>
  );
};

function getSuccessMessage(
  t: (key: string, vars?: Record<string, string | number>) => string,
  type: string,
  providerName: AIProviderName | undefined,
  activeAIProvider: AIProviderName | null,
): string | null {
  if (type === 'AI_SUMMARY_SETTINGS_LOADED') {
    return null;
  }

  if (type === 'AI_PROVIDER_REGISTERED' && providerName) {
    return t('settings.msg_provider_registered', { name: providerName });
  }

  if (type === 'AI_PROVIDER_STATE_UPDATED') {
    return activeAIProvider ? t('settings.msg_provider_activated', { name: activeAIProvider }) : t('settings.msg_ai_deactivated');
  }

  if (type === 'SAVE_PATH_SET') {
    return t('settings.msg_save_path_set');
  }

  if (type === 'SAVE_PATH_CLEARED') {
    return t('settings.msg_save_path_cleared');
  }

  return null;
}
