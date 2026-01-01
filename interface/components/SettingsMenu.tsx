'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();

  // AI settings from localStorage
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiAutoMode, setAiAutoMode] = useState(true);

  useEffect(() => {
    const savedAiPreference = localStorage.getItem('ai_assistant_enabled');
    if (savedAiPreference !== null) {
      setAiEnabled(savedAiPreference === 'true');
    }

    const savedAutoMode = localStorage.getItem('ai_auto_mode');
    if (savedAutoMode !== null) {
      setAiAutoMode(savedAutoMode === 'true');
    }
  }, []);

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

  const handleLanguageSelect = (lang: 'en' | 'ru' | 'zh' | 'es' | 'ar' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'it' | 'tr' | 'ca') => {
    setLanguage(lang);
    setShowLanguages(false);
  };

  const handleThemeSelect = (mode: 'auto' | 'light' | 'dark') => {
    setThemeMode(mode);
  };

  const handleAiStatusToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem('ai_assistant_enabled', String(enabled));
    // Dispatch custom event to notify CreateCampaignForm
    window.dispatchEvent(new CustomEvent('ai-settings-changed', { detail: { enabled, autoMode: aiAutoMode } }));
  };

  const handleAiModeToggle = (autoMode: boolean) => {
    setAiAutoMode(autoMode);
    localStorage.setItem('ai_auto_mode', String(autoMode));
    // Dispatch custom event to notify CreateCampaignForm
    window.dispatchEvent(new CustomEvent('ai-settings-changed', { detail: { enabled: aiEnabled, autoMode } }));
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
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('settings.title')}</h3>
          </div>

          <div className="py-2">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.general')}</p>
            </div>

            {/* Theme Toggle */}
            <div className="px-4 py-2">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">{t('settings.theme')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeSelect('auto')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    themeMode === 'auto'
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Auto
                </button>
                <button
                  onClick={() => handleThemeSelect('light')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    themeMode === 'light'
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => handleThemeSelect('dark')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    themeMode === 'dark'
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="px-4 py-2">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
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
                <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleLanguageSelect('en')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'en'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.english')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('ru')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'ru'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.russian')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('zh')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'zh'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.chinese')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('es')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'es'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.spanish')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('ar')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'ar'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.arabic')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('hi')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'hi'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.hindi')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('pt')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'pt'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.portuguese')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('fr')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'fr'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.french')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('de')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'de'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.german')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('ja')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'ja'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.japanese')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('ko')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'ko'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.korean')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('it')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'it'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.italian')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('tr')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'tr'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.turkish')}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('ca')}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                      language === 'ca'
                        ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('language.catalan')}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign AI Assistant</p>
            </div>

            {/* AI Status Toggle */}
            <div className="px-4 py-2">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">Status</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAiStatusToggle(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    aiEnabled
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  On
                </button>
                <button
                  onClick={() => handleAiStatusToggle(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    !aiEnabled
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Off
                </button>
              </div>
            </div>

            {/* AI Mode Toggle */}
            <div className="px-4 py-2">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">Apply Changes</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAiModeToggle(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    aiAutoMode
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Automatically
                </button>
                <button
                  onClick={() => handleAiModeToggle(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition ${
                    !aiAutoMode
                      ? 'bg-gray-700 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  With Review
                </button>
              </div>
            </div>

            {/* Reset Chat Button */}
            <div className="px-4 py-2">
              <button
                onClick={() => {
                  console.log('🔴 Reset Chat History button clicked');
                  // Dispatch event to clear chat history
                  window.dispatchEvent(new CustomEvent('clear-ai-chat'));
                  console.log('📤 clear-ai-chat event dispatched');
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-sm transition border border-red-200 dark:border-red-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium">Reset AI Chat History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
