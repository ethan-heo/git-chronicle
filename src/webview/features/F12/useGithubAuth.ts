import { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { GithubAuthStatus } from './types';

export function useGithubAuth(options: { isActive: boolean }): void {
  const { isActive } = options;
  const hasCheckedGithubAuth = useAppStore((state) => state.hasCheckedGithubAuth);
  const fetchGithubAuthState = useAppStore((state) => state.fetchGithubAuthState);
  const handleGithubAuthState = useAppStore((state) => state.handleGithubAuthState);

  useEffect(() => {
    if (!isActive || hasCheckedGithubAuth) {
      return;
    }

    fetchGithubAuthState();
  }, [fetchGithubAuthState, hasCheckedGithubAuth, isActive]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (event: MessageEvent<{ type: string; payload?: { status?: GithubAuthStatus } }>): void => {
      if (event.data.type === 'GITHUB_AUTH_STATE' && event.data.payload?.status) {
        handleGithubAuthState(event.data.payload.status);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleGithubAuthState, isActive]);
}
