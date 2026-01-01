'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'zh' | 'es' | 'ar' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'it' | 'tr' | 'ca';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Common language names used across all translations
const languageNames = {
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.chinese': '中文',
  'language.spanish': 'Español',
  'language.arabic': 'العربية',
  'language.hindi': 'हिन्दी',
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
  ar: { ...baseEnglish, ...languageNames },
  hi: { ...baseEnglish, ...languageNames },
  pt: { ...baseEnglish, ...languageNames },
  fr: { ...baseEnglish, ...languageNames },
  de: { ...baseEnglish, ...languageNames },
  ja: { ...baseEnglish, ...languageNames },
  ko: { ...baseEnglish, ...languageNames },
  it: { ...baseEnglish, ...languageNames },
  tr: { ...baseEnglish, ...languageNames },
  ca: { ...baseEnglish, ...languageNames },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem('language') as Language | null;
    const validLanguages: Language[] = ['en', 'ru', 'zh', 'es', 'ar', 'hi', 'pt', 'fr', 'de', 'ja', 'ko', 'it', 'tr', 'ca'];
    if (savedLanguage && validLanguages.includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, mounted }}>
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
