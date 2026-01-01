'use client';

import { useState, useEffect, useRef } from 'react';
import { PersonalityType } from '@/types/ai';
import { PERSONALITY_CONFIGS } from '@/lib/ai/prompts';
import { ChatMessage } from './ChatMessage';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { CampaignFormData } from '@/types/campaign';

interface AIAssistantPanelProps {
  formData: CampaignFormData;
  currentStep: number;
  onFieldUpdate?: (field: string, value: any, label: string) => void;
  onSaveChatMessage?: (message: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; fieldUpdates?: { field: string; value: any; label: string }[] }) => void;
  onClearChat?: () => void;
}

export function AIAssistantPanel({ formData, currentStep, onFieldUpdate, onSaveChatMessage, onClearChat }: AIAssistantPanelProps) {
  const {
    messages,
    isStreaming,
    personality,
    isPanelOpen,
    setIsPanelOpen,
    sendMessage,
    changePersonality,
    initializeChat,
    clearChat,
  } = useAIAssistant(formData, currentStep, onFieldUpdate, onSaveChatMessage, onClearChat);

  const [inputValue, setInputValue] = useState('');
  const [aiAutoMode, setAiAutoMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load AI auto mode preference from localStorage
  useEffect(() => {
    const savedAutoMode = localStorage.getItem('ai_auto_mode');
    if (savedAutoMode !== null) {
      setAiAutoMode(savedAutoMode === 'true');
    }

    // Listen for AI settings changes
    const handleAiSettingsChanged = (event: CustomEvent) => {
      const { autoMode } = event.detail;
      setAiAutoMode(autoMode);
    };

    window.addEventListener('ai-settings-changed', handleAiSettingsChanged as EventListener);
    return () => {
      window.removeEventListener('ai-settings-changed', handleAiSettingsChanged as EventListener);
    };
  }, []);

  const handleAutoModeToggle = () => {
    const newValue = !aiAutoMode;
    setAiAutoMode(newValue);
    localStorage.setItem('ai_auto_mode', String(newValue));
    window.dispatchEvent(new CustomEvent('ai-settings-changed', {
      detail: { enabled: true, autoMode: newValue }
    }));
  };

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0 rounded-t-2xl">
        <div>
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold">AI Assistant</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">Campaign creation helper</p>
        </div>

        {/* Auto Apply Toggle */}
        <div className="relative group">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apply changes automatically</span>
            <button
              onClick={handleAutoModeToggle}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                aiAutoMode ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  aiAutoMode ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
            {aiAutoMode ? 'Changes apply automatically' : 'Review changes before applying'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0 rounded-b-2xl">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your campaign..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={4}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition self-end"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
