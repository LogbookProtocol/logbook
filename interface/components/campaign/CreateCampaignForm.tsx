'use client';

import React, { useEffect, useState } from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { GeneralInfo } from './steps/GeneralInfo';
import { Economics } from './steps/Economics';
import { Questions } from './steps/Questions';
import { AttachContent } from './steps/AttachContent';
import { Review } from './steps/Review';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';

export function CreateCampaignForm() {
  const {
    currentStep,
    setCurrentStep,
    saveDraft,
    loadDraft,
    formData,
    updateGeneralInfo,
    updateEconomics,
    addQuestion,
    saveAIChatMessage,
    addPendingChange,
    markFieldAsUpdated,
    resetForm,
    clearAllFieldUpdates,
    rejectAllPendingChanges,
    clearChatHistory,
  } = useCampaignStore();

  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiAutoMode, setAiAutoMode] = useState(true);

  useEffect(() => {
    // Load draft on mount
    loadDraft();

    // Load AI preferences from localStorage
    const savedAiPreference = localStorage.getItem('ai_assistant_enabled');
    if (savedAiPreference !== null) {
      setAiEnabled(savedAiPreference === 'true');
    }

    const savedAutoMode = localStorage.getItem('ai_auto_mode');
    if (savedAutoMode !== null) {
      setAiAutoMode(savedAutoMode === 'true');
    }

    // Listen for AI settings changes from SettingsMenu
    const handleAiSettingsChanged = (event: CustomEvent) => {
      const { enabled, autoMode } = event.detail;
      setAiEnabled(enabled);
      setAiAutoMode(autoMode);

      // When switching to manual mode, clear all "Updated" badges
      if (!autoMode) {
        clearAllFieldUpdates();
      }
    };

    // Listen for clear chat event from SettingsMenu
    const handleClearAiChat = () => {
      console.log('📥 clear-ai-chat event received in CreateCampaignForm');
      clearChatHistory();
      console.log('✅ clearChatHistory() called');
    };

    window.addEventListener('ai-settings-changed', handleAiSettingsChanged as EventListener);
    window.addEventListener('clear-ai-chat', handleClearAiChat);

    // Cleanup function: Clear all badges when leaving the page
    return () => {
      window.removeEventListener('ai-settings-changed', handleAiSettingsChanged as EventListener);
      window.removeEventListener('clear-ai-chat', handleClearAiChat);
      // Clear all "Updated" badges when unmounting (leaving /campaigns/new page)
      clearAllFieldUpdates();
    };
  }, [loadDraft, clearAllFieldUpdates, clearChatHistory]);

  useEffect(() => {
    // Auto-save draft when form data changes
    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  const steps = [
    { number: 1, title: 'General Info', description: 'Campaign details' },
    { number: 2, title: 'Economics', description: 'Fees and rewards' },
    { number: 3, title: 'Questions', description: 'Form content' },
    { number: 4, title: 'Content', description: 'Attach files' },
    { number: 5, title: 'Review', description: 'Deploy campaign' },
  ];

  const handleNext = () => {
    saveDraft();
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    saveDraft();
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStep = (step: number) => {
    saveDraft();
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFieldUpdate = (field: string, value: any, label: string) => {
    console.log('🔄 AI field update received:', { field, value, label, aiAutoMode });

    const [section, ...rest] = field.split('.');
    const fieldName = rest.join('.');

    if (aiAutoMode) {
      // Auto mode: Apply changes immediately and mark as updated
      console.log('⚡ Auto mode: Applying change immediately');

      if (section === 'generalInfo') {
        console.log('✅ Updating generalInfo:', { [fieldName]: value });
        updateGeneralInfo({ [fieldName]: value });
        markFieldAsUpdated(field);
      } else if (section === 'economics') {
        console.log('✅ Updating economics:', { [fieldName]: value });
        updateEconomics({ [fieldName]: value });
        markFieldAsUpdated(field);
      } else if (section === 'questions' && fieldName === 'add') {
        console.log('✅ Adding question:', value);
        addQuestion(value);
        markFieldAsUpdated(field);
      } else {
        console.warn('⚠️ Unknown field path:', { section, fieldName, value });
      }
    } else {
      // Manual mode: Get oldValue FIRST, then apply change AND add to pending
      console.log('📋 Manual mode: Capturing oldValue, applying change, and adding to pending');

      // Get current value BEFORE applying the change - use fresh state from store
      const currentFormData = useCampaignStore.getState().formData;
      let oldValue;
      if (section === 'generalInfo') {
        oldValue = currentFormData.generalInfo[fieldName as keyof typeof currentFormData.generalInfo];
      } else if (section === 'economics') {
        oldValue = currentFormData.economics[fieldName as keyof typeof currentFormData.economics];
      }

      console.log('📸 Captured oldValue:', { field, oldValue, newValue: value });

      // Apply the new value to the form
      if (section === 'generalInfo') {
        console.log('✅ Applying to generalInfo:', { [fieldName]: value, oldValue });
        updateGeneralInfo({ [fieldName]: value });
      } else if (section === 'economics') {
        console.log('✅ Applying to economics:', { [fieldName]: value, oldValue });
        updateEconomics({ [fieldName]: value });
      } else if (section === 'questions' && fieldName === 'add') {
        console.log('✅ Adding question:', value);
        addQuestion(value);
      }

      // Add to pending changes for user confirmation
      addPendingChange({
        id: `${Date.now()}-${Math.random()}`,
        field,
        value,
        oldValue,
        label,
        timestamp: new Date().toISOString(),
      });
    }

    console.log('💾 Saving draft...');
    saveDraft();
    console.log('✅ Field update complete');
  };

  const handleAiToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem('ai_assistant_enabled', String(enabled));

    // Dispatch event for SettingsMenu to sync
    window.dispatchEvent(new CustomEvent('ai-settings-changed', {
      detail: { enabled, autoMode: aiAutoMode }
    }));
  };

  const handleAutoModeToggle = (autoMode: boolean) => {
    setAiAutoMode(autoMode);
    localStorage.setItem('ai_auto_mode', String(autoMode));

    // When switching to manual mode, clear all "Updated" badges
    if (!autoMode) {
      clearAllFieldUpdates();
    }

    // Dispatch event for SettingsMenu to sync
    window.dispatchEvent(new CustomEvent('ai-settings-changed', {
      detail: { enabled: aiEnabled, autoMode }
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Two Column Layout */}
      <div className={aiEnabled ? "flex gap-6 items-start pt-8" : "pt-8"}>
        {/* Main Form Column */}
        <div className={aiEnabled ? "w-[60%] pl-4 sm:pl-6 space-y-8" : "max-w-4xl mx-auto px-4 sm:px-6 space-y-8"}>
          {/* AI Toggle */}
          <div className="flex items-center justify-end">
            <div className="group relative">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AI Assistant</span>
                <button
                  onClick={() => handleAiToggle(!aiEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    aiEnabled ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
              <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                {aiEnabled ? 'AI assistant enabled' : 'AI assistant disabled'}
              </div>
            </div>
          </div>

          {/* Step Indicator as Header */}
          <div id="step-form" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
            {/* Header with Steps */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
              <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
                {steps.map((step) => (
                  <button
                    key={step.number}
                    onClick={() => step.number <= currentStep && handleEditStep(step.number)}
                    disabled={step.number > currentStep}
                    className="p-4 flex flex-col items-center justify-center gap-2 group transition hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition shrink-0 ${
                        step.number === currentStep
                          ? 'bg-blue-600 text-white'
                          : step.number < currentStep
                          ? 'bg-green-600 text-white group-hover:bg-green-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-sm font-medium ${
                          step.number === currentStep
                            ? 'text-gray-900 dark:text-gray-100'
                            : step.number < currentStep
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div
                        className={`text-xs ${
                          step.number === currentStep
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-500 dark:text-gray-500'
                        }`}
                      >
                        {step.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 sm:p-8">
              {currentStep === 1 && <GeneralInfo onNext={handleNext} />}
              {currentStep === 2 && <Economics onNext={handleNext} onPrevious={handlePrevious} />}
              {currentStep === 3 && <Questions onNext={handleNext} onPrevious={handlePrevious} />}
              {currentStep === 4 && <AttachContent onNext={handleNext} onPrevious={handlePrevious} />}
              {currentStep === 5 && <Review onPrevious={handlePrevious} onEditStep={handleEditStep} />}
            </div>
          </div>

          {/* Save Draft Notice */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <svg className="inline w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Your progress is automatically saved as a draft
            </p>
          </div>
        </div>

        {/* AI Assistant Column */}
        {aiEnabled && (
          <div className="w-[40%] pr-4 sm:pr-6 sticky self-start mb-8" style={{ top: '6rem', height: 'calc(100vh - 8rem)' }}>
            {/* AI Assistant Panel */}
            <div className="h-full overflow-hidden">
              <AIAssistantPanel
                formData={formData}
                currentStep={currentStep}
                onFieldUpdate={handleFieldUpdate}
                onSaveChatMessage={saveAIChatMessage}
                onClearChat={clearChatHistory}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}