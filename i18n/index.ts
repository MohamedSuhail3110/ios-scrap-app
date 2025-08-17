import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import ku from './locales/ku.json';
import ar from './locales/ar.json';

const setRTL = (lng: string) => {
  const isRTL = lng === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    // Optionally reload the app to apply RTL changes
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ku: { translation: ku },
      ar: { translation: ar },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Listen for language changes to update RTL
 i18n.on('languageChanged', setRTL);
setRTL(i18n.language);

export default i18n;