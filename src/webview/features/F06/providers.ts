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

export const AI_PROVIDER_MODELS = {
  claude: ['claude-haiku-4-5-20251001', 'claude-sonnet-5', 'claude-opus-4-8', 'claude-fable-5'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'],
  codex: ['gpt-5.4-mini', 'gpt-5.4', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'],
} as const;
