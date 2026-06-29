export type AIProviderName = 'claude' | 'gemini' | 'codex';

export interface AIProviderDefinition {
  name: AIProviderName;
  label: string;
  installUrl: string;
  checkCommand: string;
}

export type AIModelUsage = 'summary' | 'qa';

export type AIProviderModelMap = Record<AIProviderName, string>;
