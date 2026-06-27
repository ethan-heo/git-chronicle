import type { FC } from 'react';
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
  const activeProvider = AI_PROVIDERS.find((provider) => provider.name === activeAIProvider);

  return (
    <section className="ai-provider-section" role="group" aria-label="AI 등록">
      <div className="settings-section-heading">
        <div>
          <h2>AI 등록</h2>
          <p>사용할 AI CLI를 등록하고 활성화하세요. 한 번에 하나만 활성화됩니다.</p>
        </div>
        <span className="ai-provider-active-summary">
          <span className={activeProvider ? 'active-summary-dot active-summary-dot-on' : 'active-summary-dot'} />
          {activeProvider ? `${activeProvider.label} 활성` : '활성 AI 없음'}
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
