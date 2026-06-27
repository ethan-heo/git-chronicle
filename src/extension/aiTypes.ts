export type AIProviderName = 'claude' | 'gemini' | 'codex';

export interface AIProviderDefinition {
  name: AIProviderName;
  label: string;
  installUrl: string;
  checkCommand: string;
}
