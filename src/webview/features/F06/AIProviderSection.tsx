import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { AIProviderButtonState, AIProviderName } from '../../types/commit';
import { AIProviderButton } from './AIProviderButton';
import { AI_PROVIDERS } from './providers';

interface AIProviderSectionProps {
  activeAIProvider: AIProviderName | null;
  registeredProviders: AIProviderName[];
  registeringProvider: AIProviderName | null;
  providerErrors: Partial<Record<AIProviderName, string>>;
  onProviderClick: (providerName: AIProviderName) => void;
  onOpenInstall: (url: string) => void;
}

export const AIProviderSection: FC<AIProviderSectionProps> = ({
  activeAIProvider,
  registeredProviders,
  registeringProvider,
  providerErrors,
  onProviderClick,
  onOpenInstall,
}) => {
  const { t } = useTranslation();
  const activeProvider = AI_PROVIDERS.find((provider) => provider.name === activeAIProvider);

  return (
    <section className="ai-provider-section" role="group" aria-label={t('settings.ai_section_label')}>
      <div className="settings-section-heading">
        <div>
          <h2>{t('settings.ai_section_heading')}</h2>
          <p>{t('settings.ai_section_desc')}</p>
        </div>
        <span className="ai-provider-active-summary">
          <span className={activeProvider ? 'active-summary-dot active-summary-dot-on' : 'active-summary-dot'} />
          {activeProvider ? t('settings.ai_active', { name: activeProvider.label }) : t('settings.ai_no_active')}
        </span>
      </div>
      <div className="ai-provider-list">
        {AI_PROVIDERS.map((provider) => (
          <AIProviderButton
            key={provider.name}
            provider={provider}
            state={getProviderState(provider.name, registeredProviders, activeAIProvider, registeringProvider, providerErrors)}
            errorMessage={providerErrors[provider.name]}
            onToggle={() => onProviderClick(provider.name)}
            onOpenInstall={onOpenInstall}
          />
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
