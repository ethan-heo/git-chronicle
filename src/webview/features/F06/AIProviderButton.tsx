import type { CSSProperties, FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AIProvider, AIProviderButtonState } from '../../types/commit';
import { CLIInstallLink } from './CLIInstallLink';

interface AIProviderButtonProps {
  provider: AIProvider;
  state: AIProviderButtonState;
  errorMessage?: string;
  onToggle: () => void;
  onOpenInstall: (url: string) => void;
  children?: ReactNode;
}

export const AIProviderButton: FC<AIProviderButtonProps> = ({ provider, state, errorMessage, onToggle, onOpenInstall, children }) => {
  const { t } = useTranslation();
  const isActive = state === 'active';
  const isRegistering = state === 'registering';
  const isError = state === 'error';
  const containerClassName = [
    'overflow-hidden rounded-md border bg-panel transition-colors duration-100 ease-in-out',
    isActive ? 'border-accent bg-selected' : 'border-line',
    isError
      ? 'border-[color-mix(in_srgb,var(--color-error)_54%,transparent)] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-panel))]'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  const markClassName = [
    'inline-flex size-7 shrink-0 items-center justify-center rounded-[7px] border',
    isActive || state === 'inactive' || isError
      ? 'border-transparent bg-[var(--provider-brand-color)] text-white'
      : 'border-[var(--provider-brand-color)] text-[var(--provider-brand-color)]',
  ].join(' ');
  const statePillClassName = [
    'inline-flex min-w-[54px] shrink-0 items-center justify-center gap-1.5 rounded-full border px-[9px] py-[3px] text-[11px] whitespace-nowrap',
    isActive
      ? 'border-transparent bg-accent font-bold text-on-accent'
      : isError
        ? 'border-transparent font-medium text-error'
        : 'border-line text-muted',
  ].join(' ');

  return (
    <div className={containerClassName} style={{ '--provider-brand-color': provider.brandColor } as CSSProperties}>
      <button
        type="button"
        className="flex min-h-12 w-full items-center gap-[11px] bg-transparent px-3 py-[9px] text-left text-text hover:bg-hover disabled:cursor-default disabled:hover:bg-transparent"
        disabled={isRegistering}
        aria-label={`${provider.label} ${isActive ? t('provider.click_disable') : t('provider.click_enable')}`}
        aria-pressed={isActive}
        title={getTitle(state, t)}
        onClick={onToggle}
      >
        <span className={markClassName} aria-hidden="true">
          <ProviderIcon providerName={provider.name} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-[7px]">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold text-text">{provider.label}</span>
            <span className="shrink-0 font-mono text-[10.5px] text-muted">{provider.cli}</span>
          </span>
          <span className={`overflow-hidden text-ellipsis whitespace-nowrap text-[11px] ${isActive ? 'text-renamed' : isError ? 'text-error' : 'text-muted'}`}>
            {getStatusText(state, t)}
          </span>
        </span>
        <span className={statePillClassName}>
          {isRegistering ? <span className="size-[13px] rounded-full border-2 border-line border-t-link motion-safe:animate-spin" aria-hidden="true" /> : null}
          {getStateLabel(state, t)}
        </span>
      </button>
      {isError ? (
        <div className="flex flex-col gap-[7px] px-3 pb-[11px] pl-[51px] text-[11.5px] leading-[1.5] text-error" role="alert">
          <span>{errorMessage || t('settings.provider_cli_missing')}</span>
          <CLIInstallLink
            url={provider.installUrl}
            label={t('settings.open_install_page', { name: provider.label })}
            ariaLabel={t('settings.open_install_page', { name: provider.label })}
            onOpen={onOpenInstall}
          />
        </div>
      ) : null}
      {children}
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
