import { useEffect, useState, type FC } from 'react';
import { postMessage } from './bridge/vscodeApi';
import {
  BackButton,
  EmptyState,
  ErrorState,
  FileActionButtons,
  FileStatusBadge,
  LoadingState,
  PrimaryButton,
  SavedBadge,
  ToastContainer,
  TopHeader,
  type ToastItem,
} from './shared/components';

type ConnectionStatus = 'idle' | 'connected' | 'unknown';

export const App: FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [message, setMessage] = useState('Extension Host 응답을 기다리는 중입니다.');
  const [toasts, setToasts] = useState<ToastItem[]>([
    { id: 'preview-success', message: '파일 AI 정리가 완료되었습니다', type: 'success', duration: 6000 },
  ]);

  const showPreviewToast = (): void => {
    const id = crypto.randomUUID();
    setToasts((current) => [
      ...current,
      {
        id,
        message: current.length % 2 === 0 ? '완료되었습니다. 실패 2개' : '저장 경로를 먼저 설정해주세요',
        type: current.length % 2 === 0 ? 'warning' : 'error',
        duration: 3500,
      },
    ]);
  };

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { message?: string } }>): void => {
      if (event.data.type === 'PONG') {
        setStatus('connected');
        setMessage(event.data.payload?.message ?? '연결되었습니다.');
        return;
      }

      if (event.data.type === 'UNKNOWN_MESSAGE') {
        setStatus('unknown');
        setMessage(event.data.payload?.message ?? '알 수 없는 메시지입니다.');
      }
    };

    window.addEventListener('message', handler);
    postMessage('PING');

    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <main className="app-shell">
      <TopHeader title="Git Author Explorer" context="디자인 토큰 및 전역 컴포넌트 적용" showSettingsIcon />
      <section className="hero-panel">
        <p className="eyebrow">VSCode Extension + React Webview</p>
        <h1>VSCode 테마 변수 기반 디자인 시스템을 사용할 준비가 되었습니다.</h1>
        <p className="description">
          주어진 디자인 팔레트의 의미 토큰을 Webview 전역 CSS 변수로 매핑하고, 이후 F01부터
          재사용할 공통 컴포넌트를 프로젝트 구조에 맞춰 추출했습니다.
        </p>
        <div className="status-row">
          <span className={`status-dot status-${status}`} />
          <span>{message}</span>
        </div>
      </section>
      <section className="design-system-section" aria-labelledby="components-title">
        <div className="section-title">
          <h2 id="components-title">Global Components</h2>
          <span>토큰으로 구성한 전역 컴포넌트 미리보기</span>
        </div>
        <div className="component-grid">
          <div className="component-card">
            <div className="component-card-title">PrimaryButton</div>
            <div className="component-card-stack">
              <PrimaryButton onClick={showPreviewToast}>AI 정리 생성</PrimaryButton>
              <PrimaryButton disabled onClick={showPreviewToast}>
                disabled
              </PrimaryButton>
              <PrimaryButton isLoading onClick={showPreviewToast}>
                loading
              </PrimaryButton>
            </div>
          </div>
          <div className="component-card">
            <div className="component-card-title">BackButton · FileActionButtons</div>
            <div className="component-card-stack">
              <BackButton onClick={showPreviewToast} />
              <FileActionButtons isVisible onCodeView={showPreviewToast} onAISummary={showPreviewToast} />
            </div>
          </div>
          <div className="component-card">
            <div className="component-card-title">FileStatusBadge · SavedBadge</div>
            <div className="component-card-stack">
              <FileStatusBadge status="A" />
              <FileStatusBadge status="M" />
              <FileStatusBadge status="D" />
              <FileStatusBadge status="R" />
              <SavedBadge />
            </div>
          </div>
          <div className="component-card">
            <div className="component-card-title">LoadingState · ErrorState</div>
            <div className="component-card-stack">
              <LoadingState label="AI 정리 생성 중..." />
              <ErrorState message="생성에 실패했습니다" onRetry={showPreviewToast} />
            </div>
          </div>
          <div className="component-card">
            <div className="component-card-title">EmptyState</div>
            <EmptyState message="조건에 맞는 커밋이 없습니다" ctaLabel="설정으로 이동" onCtaClick={showPreviewToast} />
          </div>
        </div>
      </section>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </main>
  );
};
