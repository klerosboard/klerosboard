import React, { useEffect, useState } from 'react';
import { I18nProvider as LinguiI18nProvider } from '@lingui/react';
import { i18n } from '@lingui/core';
import { I18nContext } from './I18nContext';
import { LocaleEnum } from './types';

// Activate a default locale synchronously so LinguiI18nProvider renders on first paint
i18n.activate(LocaleEnum.English);

const detectLocale = (): string | null => {
  return localStorage.getItem('lang');
};

const isLocalePresent = (locale: string) => {
  let isPresent = false;
  Object.values(LocaleEnum).forEach((enumLocaleValue) => {
    if (enumLocaleValue === locale) {
      isPresent = true;
    }
  });

  return isPresent;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    const stored = detectLocale();
    if (stored && isLocalePresent(stored)) {
      return stored as LocaleEnum;
    }
    return LocaleEnum.English;
  });

  const handleChangeLocale = (locale: LocaleEnum) => {
    localStorage.setItem('lang', locale);
    setLocale(locale);
  };

  useEffect(() => {
    // Dynamically load the catalogs — .po files handled by @lingui/vite-plugin
    import(`../locales/${locale}/messages.po`)
      .then((module) => {
        const messages = module.messages ?? module.default?.messages ?? {};
        i18n.load(locale, messages);
        i18n.activate(locale);
      })
      .catch(() => {
        // Fallback: locale not available, stay with current
      });
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        handleChangeLocale,
      }}
    >
      <LinguiI18nProvider i18n={i18n}>{children}</LinguiI18nProvider>
    </I18nContext.Provider>
  );
};
