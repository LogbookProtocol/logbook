'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'en' | 'ru' | 'zh' | 'es' | 'he' | 'uk' | 'be' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'it' | 'tr' | 'ca';
export type LanguageSetting = 'auto' | Language;

interface LanguageContextType {
  language: Language; // The actual resolved language (never 'auto')
  languageSetting: LanguageSetting; // The user's setting (can be 'auto')
  setLanguage: (lang: LanguageSetting) => void;
  t: (key: string) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Common language names used across all translations
const languageNames = {
  'language.auto': 'Auto',
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.chinese': '中文',
  'language.spanish': 'Español',
  'language.hebrew': 'עברית',
  'language.ukrainian': 'Українська',
  'language.belarusian': 'Беларуская',
  'language.portuguese': 'Português',
  'language.french': 'Français',
  'language.german': 'Deutsch',
  'language.japanese': '日本語',
  'language.korean': '한국어',
  'language.italian': 'Italiano',
  'language.turkish': 'Türkçe',
  'language.catalan': 'Català',
};

const baseEnglish = {
  // Header
  'app.name': 'app.logbookprotocol',

  // Auth buttons
  'auth.google': 'Google',
  'auth.apple': 'Apple',
  'auth.connecting': 'Connecting...',
  'auth.connectWallet': 'Connect Wallet',
  'auth.disconnect': 'Disconnect',
  'auth.logout': 'Logout',

  // Main page
  'main.title': 'Decentralized Polls, Forms & Surveys',
  'main.description': 'Create decentralized polls, forms, and surveys on Sui blockchain. Every response validated on-chain. Transparent, immutable, and verifiable results. No central authority.',
  'main.createPoll': '+ Create Poll',
  'main.documentation': 'Documentation',
  'main.filterBy': 'Filter by:',
  'main.starred': '⭐ Starred',
  'main.publicForms': 'Public Forms',
  'main.myForms': 'My Forms',
  'main.loading': 'Loading forms...',
  'main.noPublicForms': 'No public forms available',
  'main.noForms': 'No forms yet',
  'main.createFirstForm': 'Create Your First Form',
  'main.formsCreated': 'Forms I Created',
  'main.formsResponded': 'Forms I Responded To',

  // Table headers
  'table.form': 'Form',
  'table.status': 'Status',
  'table.responses': 'Responses',
  'table.plan': 'Plan',
  'table.active': 'Active',
  'table.free': 'Free',

  // Footer
  'footer.documentation': 'Documentation',
  'footer.security': 'Security',
  'footer.terms': 'Terms',
  'footer.copyright': '© 2025',

  // Settings
  'settings.title': 'Settings',
  'settings.general': 'General',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.close': 'Close',

  // Theme modes
  'theme.auto': 'Auto',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
};

const baseRussian = {
  // Header
  'app.name': 'app.logbookprotocol',

  // Auth buttons
  'auth.google': 'Google',
  'auth.apple': 'Apple',
  'auth.connecting': 'Подключение...',
  'auth.connectWallet': 'Подключить кошелёк',
  'auth.disconnect': 'Отключить',
  'auth.logout': 'Выйти',

  // Main page
  'main.title': 'Децентрализованные опросы, формы и голосования',
  'main.description': 'Создавайте децентрализованные опросы, формы и голосования на блокчейне Sui. Каждый ответ валидируется он-чейн. Прозрачные, неизменяемые и проверяемые результаты. Без центрального органа управления.',
  'main.createPoll': '+ Создать опрос',
  'main.documentation': 'Документация',
  'main.filterBy': 'Фильтр:',
  'main.starred': '⭐ Избранное',
  'main.publicForms': 'Публичные формы',
  'main.myForms': 'Мои формы',
  'main.loading': 'Загрузка форм...',
  'main.noPublicForms': 'Нет доступных публичных форм',
  'main.noForms': 'Пока нет форм',
  'main.createFirstForm': 'Создать первую форму',
  'main.formsCreated': 'Созданные мной формы',
  'main.formsResponded': 'Формы, на которые я ответил',

  // Table headers
  'table.form': 'Форма',
  'table.status': 'Статус',
  'table.responses': 'Ответы',
  'table.plan': 'План',
  'table.active': 'Активна',
  'table.free': 'Бесплатно',

  // Footer
  'footer.documentation': 'Документация',
  'footer.security': 'Безопасность',
  'footer.terms': 'Условия',
  'footer.copyright': '© 2025',

  // Settings
  'settings.title': 'Настройки',
  'settings.general': 'Общие',
  'settings.language': 'Язык',
  'settings.theme': 'Тема',
  'settings.close': 'Закрыть',

  // Theme modes
  'theme.auto': 'Авто',
  'theme.light': 'Светлая',
  'theme.dark': 'Темная',
};

const translations = {
  en: { ...baseEnglish, ...languageNames },
  ru: { ...baseRussian, ...languageNames },
  zh: { ...baseEnglish, ...languageNames },
  es: { ...baseEnglish, ...languageNames },
  he: { ...baseEnglish, ...languageNames },
  uk: { ...baseEnglish, ...languageNames },
  be: { ...baseEnglish, ...languageNames },
  pt: { ...baseEnglish, ...languageNames },
  fr: { ...baseEnglish, ...languageNames },
  de: { ...baseEnglish, ...languageNames },
  ja: { ...baseEnglish, ...languageNames },
  ko: { ...baseEnglish, ...languageNames },
  it: { ...baseEnglish, ...languageNames },
  tr: { ...baseEnglish, ...languageNames },
  ca: { ...baseEnglish, ...languageNames },
};

// Detect browser language and map to supported language
function detectBrowserLanguage(): Language {
  const validLanguages: Language[] = ['en', 'ru', 'zh', 'es', 'he', 'uk', 'be', 'pt', 'fr', 'de', 'ja', 'ko', 'it', 'tr', 'ca'];

  // Get browser languages (returns array like ['ru-RU', 'en-US', 'en'])
  const browserLanguages = navigator.languages || [navigator.language];

  for (const browserLang of browserLanguages) {
    // Extract base language code (e.g., 'ru' from 'ru-RU')
    const baseLang = browserLang.split('-')[0].toLowerCase() as Language;

    // Direct match
    if (validLanguages.includes(baseLang)) {
      return baseLang;
    }

    // Special case: zh-TW, zh-HK -> zh (Chinese)
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
  }

  // Default to English
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languageSetting, setLanguageSettingState] = useState<LanguageSetting>('auto');
  const [resolvedLanguage, setResolvedLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Update resolved language when setting changes or when in auto mode
  const updateResolvedLanguage = (setting: LanguageSetting) => {
    if (setting === 'auto') {
      setResolvedLanguage(detectBrowserLanguage());
    } else {
      setResolvedLanguage(setting);
    }
  };

  useEffect(() => {
    setMounted(true);
    const validSettings: LanguageSetting[] = ['auto', 'en', 'ru', 'zh', 'es', 'he', 'uk', 'be', 'pt', 'fr', 'de', 'ja', 'ko', 'it', 'tr', 'ca'];

    // Check for saved language preference
    const savedSetting = localStorage.getItem('language') as LanguageSetting | null;
    if (savedSetting && validSettings.includes(savedSetting)) {
      setLanguageSettingState(savedSetting);
      updateResolvedLanguage(savedSetting);
    } else {
      // Default to auto
      setLanguageSettingState('auto');
      updateResolvedLanguage('auto');
    }
  }, []);

  // Listen for system language changes when in auto mode
  useEffect(() => {
    if (languageSetting !== 'auto') return;

    const handleLanguageChange = () => {
      setResolvedLanguage(detectBrowserLanguage());
    };

    // Listen for language change events (works in some browsers)
    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [languageSetting]);

  const setLanguage = (lang: LanguageSetting) => {
    setLanguageSettingState(lang);
    updateResolvedLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[resolvedLanguage][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: resolvedLanguage, languageSetting, setLanguage, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
