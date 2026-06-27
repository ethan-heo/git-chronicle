import type { CSSProperties, FC } from 'react';
import type { AIProvider, AIProviderButtonState } from '../../types/commit';
import { CLIInstallLink } from './CLIInstallLink';

interface AIProviderButtonProps {
  provider: AIProvider;
  state: AIProviderButtonState;
  errorMessage?: string;
  onToggle: () => void;
  onOpenInstall: (url: string) => void;
}

const STATE_LABELS: Record<AIProviderButtonState, string> = {
  unregistered: '등록',
  registering: '확인 중',
  active: '활성',
  inactive: '활성화',
  error: '실패',
};

const STATUS_TEXT: Record<AIProviderButtonState, string> = {
  unregistered: '미등록',
  registering: 'CLI 버전 확인 중...',
  active: '활성 - AI 정리에 사용 중',
  inactive: '등록됨 · 비활성',
  error: '연동 실패',
};

export const AIProviderButton: FC<AIProviderButtonProps> = ({ provider, state, errorMessage, onToggle, onOpenInstall }) => {
  const isActive = state === 'active';
  const isRegistering = state === 'registering';
  const isError = state === 'error';

  return (
    <div className={`ai-provider-button ai-provider-button-${state}`} style={{ '--provider-brand-color': provider.brandColor } as CSSProperties}>
      <button
        type="button"
        className="ai-provider-main-button"
        disabled={isRegistering}
        aria-label={`${provider.label} ${isActive ? '비활성화' : '활성화'}`}
        aria-pressed={isActive}
        title={getTitle(state)}
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
          <span className="ai-provider-status">{STATUS_TEXT[state]}</span>
        </span>
        <span className="ai-provider-state-pill">
          {isRegistering ? <span className="ai-provider-spinner" aria-hidden="true" /> : null}
          {STATE_LABELS[state]}
        </span>
      </button>
      {isError ? (
        <div className="ai-provider-error" role="alert">
          <span>{errorMessage || 'CLI가 감지되지 않습니다. 설치 페이지를 확인하세요'}</span>
          <CLIInstallLink url={provider.installUrl} label={`${provider.label} 설치 페이지 열기`} ariaLabel={`${provider.label} 설치 페이지 열기`} onOpen={onOpenInstall} />
        </div>
      ) : null}
    </div>
  );
};

function getTitle(state: AIProviderButtonState): string {
  if (state === 'active') {
    return '클릭하여 비활성화';
  }

  if (state === 'inactive') {
    return '클릭하여 활성화';
  }

  if (state === 'error') {
    return '클릭하여 다시 등록';
  }

  return '클릭하여 등록';
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
