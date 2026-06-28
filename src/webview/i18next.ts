import { changeLanguage, initI18n, translate, useTranslation } from './i18n/runtime';

const i18n = {
  changeLanguage,
  t: translate,
};

export default i18n;
export { changeLanguage, initI18n, useTranslation };
