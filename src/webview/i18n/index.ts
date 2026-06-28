import en from './locales/en/translation.json';
import ko from './locales/ko/translation.json';
import { initI18n as initRuntimeI18n, normalizeLanguage } from './runtime';

export function initI18n(language: string): void {
  initRuntimeI18n(language, {
    en: en as Record<string, unknown>,
    ko: ko as Record<string, unknown>,
  });
}

export function getInitialLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return normalizeLanguage((window as typeof window & { __LANG__?: string }).__LANG__ ?? 'en');
}

export { normalizeLanguage };
