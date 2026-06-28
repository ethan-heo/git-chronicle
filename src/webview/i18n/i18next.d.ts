import type en from './locales/en/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

declare global {
  interface Window {
    __LANG__?: string;
  }
}
