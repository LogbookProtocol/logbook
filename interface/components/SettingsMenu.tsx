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
import {
  DataSource,
  getDataSource,
  setDataSource,
} from '@/lib/sui-config';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();

  // Date format settings
  const [dateFormat, setDateFormatState] = useState<DateFormat>('auto');
  const [showDateFormats, setShowDateFormats] = useState(false);
  const dateFormatOptions = getDateFormatOptions();

  // Time format settings
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('auto');
  const [showTimeFormats, setShowTimeFormats] = useState(false);
  const timeFormatOptions = getTimeFormatOptions();

  // Data source settings
  const [dataSource, setDataSourceState] = useState<DataSource>('mock');
  const [showDataSources, setShowDataSources] = useState(false);

  useEffect(() => {
    setDateFormatState(getDateFormat());
    setTimeFormatState(getTimeFormat());
    setDataSourceState(getDataSource());
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
      setShowDataSources(false);
    }

    const anySubmenuOpen = showThemes || showLanguages || showDateFormats || showTimeFormats || showDataSources;
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
  }, [showThemes, showLanguages, showDateFormats, showTimeFormats, showDataSources]);

  // Close all submenus
  const closeAllSubmenus = () => {
    setShowThemes(false);
    setShowLanguages(false);
    setShowDateFormats(false);
    setShowTimeFormats(false);
    setShowDataSources(false);
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

  const toggleDataSources = () => {
    const newState = !showDataSources;
    closeAllSubmenus();
    setShowDataSources(newState);
  };

  const handleLanguageSelect = (lang: 'en' | 'ru' | 'zh' | 'es' | 'ar' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'it' | 'tr' | 'ca') => {
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

  const handleDataSourceSelect = (source: DataSource) => {
    setDataSource(source);
    setDataSourceState(source);
    setShowDataSources(false);
    // Reload the page to apply the new data source
    window.location.reload();
  };

  const getDataSourceLabel = (source: DataSource) => {
    switch (source) {
      case 'mock': return 'Mock Data';
      case 'devnet': return 'Sui Devnet';
      case 'testnet': return 'Sui Testnet';
      case 'mainnet': return 'Sui Mainnet';
    }
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
                    {t(`language.${language === 'en' ? 'english' : language === 'ru' ? 'russian' : language === 'zh' ? 'chinese' : language === 'es' ? 'spanish' : language === 'ar' ? 'arabic' : language === 'hi' ? 'hindi' : language === 'pt' ? 'portuguese' : language === 'fr' ? 'french' : language === 'de' ? 'german' : language === 'ja' ? 'japanese' : language === 'ko' ? 'korean' : language === 'it' ? 'italian' : language === 'tr' ? 'turkish' : 'catalan'}`)}
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
                  {([
                    { code: 'en', key: 'english' },
                    { code: 'ru', key: 'russian' },
                    { code: 'zh', key: 'chinese' },
                    { code: 'es', key: 'spanish' },
                    { code: 'ar', key: 'arabic' },
                    { code: 'hi', key: 'hindi' },
                    { code: 'pt', key: 'portuguese' },
                    { code: 'fr', key: 'french' },
                    { code: 'de', key: 'german' },
                    { code: 'ja', key: 'japanese' },
                    { code: 'ko', key: 'korean' },
                    { code: 'it', key: 'italian' },
                    { code: 'tr', key: 'turkish' },
                    { code: 'ca', key: 'catalan' },
                  ] as const).map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between"
                    >
                      <span>{t(`language.${lang.key}`)}</span>
                      {language === lang.code && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
                    </button>
                  ))}
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

            {/* Divider */}
            <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Source</p>
            </div>

            {/* Data Source Selection */}
            <div className="px-4 py-2 relative">
              <button
                onClick={toggleDataSources}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100">Source</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${dataSource === 'devnet' ? 'text-orange-600 dark:text-orange-400' : dataSource === 'testnet' ? 'text-cyan-600 dark:text-cyan-400' : dataSource === 'mainnet' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {getDataSourceLabel(dataSource)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showDataSources ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showDataSources && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 mx-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-600"
                >
                  {(['mock', 'devnet', 'testnet', 'mainnet'] as const).map(source => (
                    <button
                      key={source}
                      onClick={() => handleDataSourceSelect(source)}
                      disabled={source === 'mainnet'}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between ${source === 'mainnet' ? 'opacity-50 cursor-not-allowed' : ''} ${source === 'devnet' ? 'text-orange-600 dark:text-orange-400' : source === 'testnet' ? 'text-cyan-600 dark:text-cyan-400' : source === 'mainnet' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}
                    >
                      <span>
                        {getDataSourceLabel(source)}
                        {source === 'devnet' && <span className="ml-2 opacity-60">(zkLogin)</span>}
                        {source === 'mainnet' && <span className="ml-2 opacity-60">(Coming soon)</span>}
                      </span>
                      {dataSource === source && <span className="text-cyan-500 dark:text-cyan-400">✓</span>}
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
