import type { CSSProperties, FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { AIProvider, AIProviderButtonState } from '../../types/commit';
import { CLIInstallLink } from './CLIInstallLink';

interface AIProviderButtonProps {
  provider: AIProvider;
  state: AIProviderButtonState;
  errorMessage?: string;
  onToggle: () => void;
  onOpenInstall: (url: string) => void;
}

export const AIProviderButton: FC<AIProviderButtonProps> = ({ provider, state, errorMessage, onToggle, onOpenInstall }) => {
  const { t } = useTranslation();
  const isActive = state === 'active';
  const isRegistering = state === 'registering';
  const isError = state === 'error';

  return (
    <div className={`ai-provider-button ai-provider-button-${state}`} style={{ '--provider-brand-color': provider.brandColor } as CSSProperties}>
      <button
        type="button"
        className="ai-provider-main-button"
        disabled={isRegistering}
        aria-label={`${provider.label} ${isActive ? t('provider.click_disable') : t('provider.click_enable')}`}
        aria-pressed={isActive}
        title={getTitle(state, t)}
        onClick={onToggle}
      >
        <span className="ai-provider-mark" aria-hidden="true">
          <ProviderIcon providerName={provider.name} />
        </span>
        <span className="ai-provider-copy">
          <span className="ai-provider-name-row">
            <span className="ai-provider-label">{provider.label}</span>
            <span className="ai-provider-cli">{provider.cli}</span>
          </span>
          <span className="ai-provider-status">{getStatusText(state, t)}</span>
        </span>
        <span className="ai-provider-state-pill">
          {isRegistering ? <span className="ai-provider-spinner" aria-hidden="true" /> : null}
          {getStateLabel(state, t)}
        </span>
      </button>
      {isError ? (
        <div className="ai-provider-error" role="alert">
          <span>{errorMessage || t('settings.provider_cli_missing')}</span>
          <CLIInstallLink
            url={provider.installUrl}
            label={t('settings.open_install_page', { name: provider.label })}
            ariaLabel={t('settings.open_install_page', { name: provider.label })}
            onOpen={onOpenInstall}
          />
        </div>
      ) : null}
    </div>
  );
};

function getTitle(state: AIProviderButtonState, t: (key: string) => string): string {
  if (state === 'active') {
    return t('provider.click_disable');
  }

  if (state === 'inactive') {
    return t('provider.click_enable');
  }

  if (state === 'error') {
    return t('provider.click_reregister');
  }

  return t('provider.click_register');
}

function getStateLabel(state: AIProviderButtonState, t: (key: string) => string): string {
  return t(`provider.${state}`);
}

function getStatusText(state: AIProviderButtonState, t: (key: string) => string): string {
  if (state === 'unregistered') {
    return t('provider.unregistered');
  }

  if (state === 'registering') {
    return t('provider.cli_checking');
  }

  if (state === 'active') {
    return t('provider.active_in_use');
  }

  if (state === 'inactive') {
    return t('provider.registered_inactive');
  }

  return t('provider.connection_failed');
}

const ProviderIcon: FC<{ providerName: AIProvider['name'] }> = ({ providerName }) => {
  if (providerName === 'claude') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1.4 9.6 5.8 14 7.4 9.6 9 8 13.4 6.4 9 2 7.4 6.4 5.8 8 1.4Z" />
      </svg>
    );
  }

  if (providerName === 'gemini') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1.2c.3 3.2 2.4 5.3 5.6 5.6V8c-3.2.3-5.3 2.4-5.6 5.6H7C6.7 10.4 4.6 8.3 1.4 8V6.8C4.6 6.5 6.7 4.4 7 1.2h1Z" />
      </svg>
    );
  }

  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="5.4" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
};
