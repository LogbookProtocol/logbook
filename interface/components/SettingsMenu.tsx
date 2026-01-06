'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DateFormat,
  TimeFormat,
  getDateFormat,
  setDateFormat,
  getDateFormatOptions,
  getTimeFormat,
  setTimeFormat,
  getTimeFormatOptions,
} from '@/lib/format-date';

// Verified languages: English is always first, others are shuffled
const englishFirst = { code: 'en', key: 'english' } as const;
const otherVerifiedLanguages: { code: string; key: string }[] = [
  // Add more verified languages here as they get reviewed
];

// AI generated languages (machine translations, not yet reviewed)
const aiGeneratedLanguages = [
  // { code: 'ru', key: 'russian' },
  // { code: 'zh', key: 'chinese' },
  // { code: 'es', key: 'spanish' },
  // { code: 'he', key: 'hebrew' },
  // { code: 'uk', key: 'ukrainian' },
  // { code: 'be', key: 'belarusian' },
  // { code: 'pt', key: 'portuguese' },
  // { code: 'fr', key: 'french' },
  // { code: 'de', key: 'german' },
  // { code: 'ja', key: 'japanese' },
  // { code: 'ko', key: 'korean' },
  // { code: 'it', key: 'italian' },
  // { code: 'tr', key: 'turkish' },
  // { code: 'ca', key: 'catalan' },
] as const;

// Auto option is always first
const autoLanguage = { code: 'auto', key: 'auto' } as const;

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { languageSetting, setLanguage, t } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();

  // Shuffled languages - computed once on component mount
  // Structure: { auto, verified (English first, rest shuffled), aiGenerated (shuffled) }
  const [languageGroups] = useState(() => ({
    auto: autoLanguage,
    verified: [englishFirst, ...shuffleArray(otherVerifiedLanguages)],
    aiGenerated: shuffleArray(aiGeneratedLanguages),
  }));

  // Date format settings
  const [dateFormat, setDateFormatState] = useState<DateFormat>('auto');
  const [showDateFormats, setShowDateFormats] = useState(false);
  const dateFormatOptions = getDateFormatOptions();

  // Time format settings
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('auto');
  const [showTimeFormats, setShowTimeFormats] = useState(false);
  const timeFormatOptions = getTimeFormatOptions();

  useEffect(() => {
    setDateFormatState(getDateFormat());
    setTimeFormatState(getTimeFormat());
  }, []);

  // Close main menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close any open submenu when clicking anywhere
  useEffect(() => {
    function handleGlobalClick() {
      // Close all submenus on any click
      setShowThemes(false);
      setShowLanguages(false);
      setShowDateFormats(false);
      setShowTimeFormats(false);
    }

    const anySubmenuOpen = showThemes || showLanguages || showDateFormats || showTimeFormats;
    if (anySubmenuOpen) {
      // Use setTimeout to let the current click event complete first
      // This allows the option selection to happen before closing
      const timer = setTimeout(() => {
        document.addEventListener('click', handleGlobalClick, { once: true });
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [showThemes, showLanguages, showDateFormats, showTimeFormats]);

  // Close all submenus
  const closeAllSubmenus = () => {
    setShowThemes(false);
    setShowLanguages(false);
    setShowDateFormats(false);
    setShowTimeFormats(false);
  };

  // Toggle submenu - close others first
  const toggleThemes = () => {
    const newState = !showThemes;
    closeAllSubmenus();
    setShowThemes(newState);
  };

  const toggleLanguages = () => {
    const newState = !showLanguages;
    closeAllSubmenus();
    setShowLanguages(newState);
  };

  const toggleDateFormats = () => {
    const newState = !showDateFormats;
    closeAllSubmenus();
    setShowDateFormats(newState);
  };

  const toggleTimeFormats = () => {
    const newState = !showTimeFormats;
    closeAllSubmenus();
    setShowTimeFormats(newState);
  };

  const handleLanguageSelect = (lang: 'auto' | 'en' | 'ru' | 'zh' | 'es' | 'he' | 'uk' | 'be' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'it' | 'tr' | 'ca') => {
    setLanguage(lang);
    setShowLanguages(false);
  };

  const handleThemeSelect = (mode: 'auto' | 'light' | 'dark') => {
    setThemeMode(mode);
    setShowThemes(false);
  };

  const getThemeLabelText = (mode: 'auto' | 'light' | 'dark') => {
    switch (mode) {
      case 'auto': return 'Auto';
      case 'light': return 'Light';
      case 'dark': return 'Dark';
    }
  };

  const handleDateFormatSelect = (format: DateFormat) => {
    setDateFormat(format);
    setDateFormatState(format);
    setShowDateFormats(false);
  };

  const handleTimeFormatSelect = (format: TimeFormat) => {
    setTimeFormat(format);
    setTimeFormatState(format);
    setShowTimeFormats(false);
  };


  const getThemeLabel = () => {
    switch (themeMode) {
      case 'auto':
        return t('theme.auto');
      case 'light':
        return t('theme.light');
      case 'dark':
        return t('theme.dark');
      default:
        return t('theme.auto');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded transition-all text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Settings"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('settings.title')}</h3>
          </div>

          <div className="py-2">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.general')}</p>
            </div>

            {/* Theme Selection */}
            <div className="px-4 py-2 relative">
              <button
                onClick={toggleThemes}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100">Theme</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {getThemeLabelText(themeMode)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showThemes ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showThemes && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 mx-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-600"
                >
                  {(['auto', 'light', 'dark'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleThemeSelect(mode)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>{getThemeLabelText(mode)}</span>
                      {themeMode === mode && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selection */}
            <div className="px-4 py-2 relative">
              <button
                onClick={toggleLanguages}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100">{t('settings.language')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {t(`language.${languageSetting === 'auto' ? 'auto' : languageSetting === 'en' ? 'english' : languageSetting === 'ru' ? 'russian' : languageSetting === 'zh' ? 'chinese' : languageSetting === 'es' ? 'spanish' : languageSetting === 'he' ? 'hebrew' : languageSetting === 'uk' ? 'ukrainian' : languageSetting === 'be' ? 'belarusian' : languageSetting === 'pt' ? 'portuguese' : languageSetting === 'fr' ? 'french' : languageSetting === 'de' ? 'german' : languageSetting === 'ja' ? 'japanese' : languageSetting === 'ko' ? 'korean' : languageSetting === 'it' ? 'italian' : languageSetting === 'tr' ? 'turkish' : 'catalan'}`)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showLanguages ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showLanguages && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 mx-4 py-1 max-h-64 overflow-y-auto bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-600"
                >
                  {/* Auto */}
                  <button
                    onClick={() => handleLanguageSelect(languageGroups.auto.code)}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>{t(`language.${languageGroups.auto.key}`)}</span>
                    {languageSetting === languageGroups.auto.code && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                  </button>

                  {/* Divider with Verified label */}
                  <div className="my-1 flex items-center gap-2 px-3">
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-600" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Verified</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-600" />
                  </div>

                  {/* Verified languages */}
                  {languageGroups.verified.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>{t(`language.${lang.key}`)}</span>
                      {languageSetting === lang.code && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                    </button>
                  ))}

                  {/* AI Generated languages - temporarily hidden
                  <div className="my-1 flex items-center gap-2 px-3">
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-600" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">AI Generated</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-600" />
                  </div>

                  {languageGroups.aiGenerated.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>{t(`language.${lang.key}`)}</span>
                      {languageSetting === lang.code && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                    </button>
                  ))}
                  */}
                </div>
              )}
            </div>

            {/* Date Format Selection */}
            <div className="px-4 py-2 relative">
              <button
                onClick={toggleDateFormats}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100">Date Format</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {dateFormatOptions.find(o => o.value === dateFormat)?.label || 'Auto'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showDateFormats ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showDateFormats && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 mx-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-600"
                >
                  {dateFormatOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleDateFormatSelect(option.value)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>
                        {option.label}
                        <span className="ml-2 opacity-60">({option.example})</span>
                      </span>
                      {dateFormat === option.value && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Format Selection */}
            <div className="px-4 py-2 relative">
              <button
                onClick={toggleTimeFormats}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100">Time Format</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {timeFormatOptions.find(o => o.value === timeFormat)?.label || 'Auto'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showTimeFormats ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showTimeFormats && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 mx-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-600"
                >
                  {timeFormatOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeFormatSelect(option.value)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>
                        {option.label}
                        <span className="ml-2 opacity-60">({option.example})</span>
                      </span>
                      {timeFormat === option.value && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
