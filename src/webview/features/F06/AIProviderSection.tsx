import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { AIProviderButtonState, AIProviderName } from '../../types/commit';
import { AIProviderButton } from './AIProviderButton';
import { ModelSelectorGroup } from './ModelSelectorGroup';
import { AI_PROVIDERS, AI_PROVIDER_MODELS } from './providers';

interface AIProviderSectionProps {
  activeAIProvider: AIProviderName | null;
  registeredProviders: AIProviderName[];
  registeringProvider: AIProviderName | null;
  providerErrors: Partial<Record<AIProviderName, string>>;
  summaryModel: string | null;
  onProviderClick: (providerName: AIProviderName) => void;
  onSummaryModelChange: (providerName: AIProviderName, model: string) => void;
  onOpenInstall: (url: string) => void;
}

export const AIProviderSection: FC<AIProviderSectionProps> = ({
  activeAIProvider,
  registeredProviders,
  registeringProvider,
  providerErrors,
  summaryModel,
  onProviderClick,
  onSummaryModelChange,
  onOpenInstall,
}) => {
  const { t } = useTranslation();
  const activeProvider = AI_PROVIDERS.find((provider) => provider.name === activeAIProvider);

  return (
    <section className="border-b border-line px-[14px] pt-4 pb-[18px]" role="group" aria-label={t('settings.ai_section_label')}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-bold text-muted">{t('settings.ai_section_heading')}</h2>
          <p className="mt-1 mb-0 text-[11.5px] leading-[1.5] text-muted">{t('settings.ai_section_desc')}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] text-muted">
          <span className={`size-1.5 rounded-full ${activeProvider ? 'bg-renamed' : 'bg-muted'}`} />
          {activeProvider ? t('settings.ai_active', { name: activeProvider.label }) : t('settings.ai_no_active')}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {AI_PROVIDERS.map((provider) => (
          <AIProviderButton
            key={provider.name}
            provider={provider}
            state={getProviderState(provider.name, registeredProviders, activeAIProvider, registeringProvider, providerErrors)}
            errorMessage={providerErrors[provider.name]}
            onToggle={() => onProviderClick(provider.name)}
            onOpenInstall={onOpenInstall}
          >
            {activeAIProvider === provider.name ? (
              <ModelSelectorGroup
                summaryModel={summaryModel}
                models={AI_PROVIDER_MODELS[provider.name]}
                onChangeSummaryModel={(model) => onSummaryModelChange(provider.name, model)}
              />
            ) : null}
          </AIProviderButton>
        ))}
      </div>
    </section>
  );
};

function getProviderState(
  providerName: AIProviderName,
  registeredProviders: AIProviderName[],
  activeAIProvider: AIProviderName | null,
  registeringProvider: AIProviderName | null,
  providerErrors: Partial<Record<AIProviderName, string>>,
): AIProviderButtonState {
  if (registeringProvider === providerName) {
    return 'registering';
  }

  if (providerErrors[providerName]) {
    return 'error';
  }

  if (activeAIProvider === providerName) {
    return 'active';
  }

  if (registeredProviders.includes(providerName)) {
    return 'inactive';
  }

  return 'unregistered';
}
