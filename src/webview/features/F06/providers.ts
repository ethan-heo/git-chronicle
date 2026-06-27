import type { AIProvider } from '../../types/commit';

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'claude',
    label: 'Claude',
    cli: 'claude',
    installUrl: 'https://docs.anthropic.com/claude-code',
    brandColor: '#d97757',
  },
  {
    name: 'gemini',
    label: 'Gemini',
    cli: 'gemini',
    installUrl: 'https://github.com/google-gemini/gemini-cli',
    brandColor: '#4285f4',
  },
  {
    name: 'codex',
    label: 'Codex',
    cli: 'codex',
    installUrl: 'https://github.com/openai/codex',
    brandColor: '#10a37f',
  },
];
