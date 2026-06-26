import { useEffect, useState, type FC } from 'react';
import { postMessage } from './bridge/vscodeApi';
import { TopHeader } from './shared/components/TopHeader';

type ConnectionStatus = 'idle' | 'connected' | 'unknown';

export const App: FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [message, setMessage] = useState('Extension Host 응답을 기다리는 중입니다.');

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
      <TopHeader title="Git Author Explorer" context="개발 환경 준비 화면" />
      <section className="hero-panel">
        <p className="eyebrow">VSCode Extension + React Webview</p>
        <h1>Git 변경 이력을 탐색할 준비가 되었습니다.</h1>
        <p className="description">
          현재 화면은 개발 환경 검증용 최소 Webview입니다. 이후 F01 커밋 로그부터 문서의
          Feature-First 구조에 맞춰 확장할 수 있습니다.
        </p>
        <div className="status-row">
          <span className={`status-dot status-${status}`} />
          <span>{message}</span>
        </div>
      </section>
    </main>
  );
};
