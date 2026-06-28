import { useSyncExternalStore } from 'react';

type Language = 'en' | 'ko';

type Resources = Record<Language, Record<string, unknown>>;

type Listener = () => void;

class I18nRuntime {
  private language: Language = 'en';
  private readonly resources: Resources = { en: {}, ko: {} };
  private readonly listeners = new Set<Listener>();

  init(language: string, resources: Resources): void {
    this.language = normalizeLanguage(language);
    this.resources.en = resources.en;
    this.resources.ko = resources.ko;
    this.emit();
  }

  changeLanguage(language: string): void {
    this.language = normalizeLanguage(language);
    this.emit();
  }

  getLanguage(): Language {
    return this.language;
  }

  t(key: string, vars?: Record<string, string | number>): string {
    const value = lookup(this.resources[this.language], key) ?? lookup(this.resources.en, key) ?? key;

    if (typeof value !== 'string') {
      return key;
    }

    return interpolate(value, vars);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot = (): Language => this.language;

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

const runtime = new I18nRuntime();

export function initI18n(language: string, resources: Resources): void {
  runtime.init(language, resources);
}

export function changeLanguage(language: string): void {
  runtime.changeLanguage(language);
}

export function useTranslation() {
  useSyncExternalStore((cb) => runtime.subscribe(cb), runtime.snapshot, runtime.snapshot);
  return {
    t: (key: string, vars?: Record<string, string | number>) => runtime.t(key, vars),
    i18n: { language: runtime.getLanguage(), changeLanguage },
  };
}

export function translate(key: string, vars?: Record<string, string | number>): string {
  return runtime.t(key, vars);
}

function normalizeLanguage(language: string): Language {
  return language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export { normalizeLanguage };

function lookup(tree: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, tree);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);
}
