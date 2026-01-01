import { create } from 'zustand';
import { CampaignStore, CampaignFormData, GeneralInfo, Economics, Question, PendingChange, AppliedChange } from '@/types/campaign';

const initialFormData: CampaignFormData = {
  generalInfo: {
    title: '',
    description: '',
    campaignType: 'survey',
    accessControl: 'public',
    campaignStartDate: '',
    campaignEndDate: '',
  },
  economics: {
    creatorPaysRespondents: false,
    respondentsPayCreator: false,
  },
  questions: [],
  attachedContentIds: [],
};

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  currentStep: 1,
  formData: initialFormData,

  setCurrentStep: (step: number) => set({ currentStep: step }),

  updateGeneralInfo: (data: Partial<GeneralInfo>) =>
    set((state) => ({
      formData: {
        ...state.formData,
        generalInfo: {
          ...state.formData.generalInfo,
          ...data,
        },
      },
    })),

  updateEconomics: (data: Partial<Economics>) =>
    set((state) => ({
      formData: {
        ...state.formData,
        economics: {
          ...state.formData.economics,
          ...data,
        },
      },
    })),

  updateAttachedContent: (contentIds: string[]) =>
    set((state) => ({
      formData: {
        ...state.formData,
        attachedContentIds: contentIds,
      },
    })),

  addQuestion: (question: Question) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questions: [...state.formData.questions, question],
      },
    })),

  updateQuestion: (id: string, questionData: Partial<Question>) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questions: state.formData.questions.map((q) =>
          q.id === id ? { ...q, ...questionData } : q
        ),
      },
    })),

  deleteQuestion: (id: string) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questions: state.formData.questions.filter((q) => q.id !== id),
      },
    })),

  reorderQuestions: (questions: Question[]) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questions,
      },
    })),

  saveAIChatMessage: (message: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; fieldUpdates?: { field: string; value: any; label: string }[] }) => {
    set((state) => ({
      formData: {
        ...state.formData,
        aiChatHistory: [...(state.formData.aiChatHistory || []), message],
      },
    }));
    // Save to localStorage immediately so chat history persists
    get().saveDraft();
  },

  addPendingChange: (change: PendingChange) =>
    set((state) => ({
      formData: {
        ...state.formData,
        pendingChanges: [...(state.formData.pendingChanges || []), change],
      },
    })),

  approvePendingChange: (changeId: string) => {
    const state = get();
    const change = state.formData.pendingChanges?.find((c) => c.id === changeId);
    if (!change) return;

    // Apply the change
    const [section, ...rest] = change.field.split('.');
    const fieldName = rest.join('.');

    if (section === 'generalInfo') {
      get().updateGeneralInfo({ [fieldName]: change.value });
    } else if (section === 'economics') {
      get().updateEconomics({ [fieldName]: change.value });
    } else if (section === 'questions' && fieldName === 'add') {
      get().addQuestion(change.value);
    }

    // Remove from pending AND clear the "Updated" badge for this field
    set((state) => ({
      formData: {
        ...state.formData,
        pendingChanges: state.formData.pendingChanges?.filter((c) => c.id !== changeId),
        appliedChanges: state.formData.appliedChanges?.filter((c) => c.field !== change.field),
      },
    }));

    // Save to localStorage so the change persists and doesn't reappear
    get().saveDraft();
  },

  rejectPendingChange: (changeId: string) => {
    const state = get();
    const change = state.formData.pendingChanges?.find((c) => c.id === changeId);
    if (!change) return;

    // Restore old value
    const [section, ...rest] = change.field.split('.');
    const fieldName = rest.join('.');

    // Update field value AND remove from pending in a SINGLE set() call
    if (section === 'generalInfo') {
      set((state) => ({
        formData: {
          ...state.formData,
          generalInfo: {
            ...state.formData.generalInfo,
            [fieldName]: change.oldValue,
          },
          pendingChanges: state.formData.pendingChanges?.filter((c) => c.id !== changeId),
        },
      }));
    } else if (section === 'economics') {
      set((state) => ({
        formData: {
          ...state.formData,
          economics: {
            ...state.formData.economics,
            [fieldName]: change.oldValue,
          },
          pendingChanges: state.formData.pendingChanges?.filter((c) => c.id !== changeId),
        },
      }));
    }

    // Save draft to persist the restored value to localStorage
    get().saveDraft();
  },

  markFieldAsUpdated: (field: string) =>
    set((state) => ({
      formData: {
        ...state.formData,
        appliedChanges: [
          ...(state.formData.appliedChanges || []),
          { field, timestamp: new Date().toISOString() },
        ],
      },
    })),

  clearFieldUpdate: (field: string) =>
    set((state) => ({
      formData: {
        ...state.formData,
        appliedChanges: state.formData.appliedChanges?.filter((c) => c.field !== field),
      },
    })),

  clearAllFieldUpdates: () =>
    set((state) => ({
      formData: {
        ...state.formData,
        appliedChanges: [],
      },
    })),

  rejectAllPendingChanges: () => {
    const state = get();
    const pendingChanges = state.formData.pendingChanges || [];

    // Restore old values for all pending changes
    pendingChanges.forEach((change) => {
      const [section, ...rest] = change.field.split('.');
      const fieldName = rest.join('.');

      if (section === 'generalInfo') {
        get().updateGeneralInfo({ [fieldName]: change.oldValue });
      } else if (section === 'economics') {
        get().updateEconomics({ [fieldName]: change.oldValue });
      }
    });

    // Clear all pending changes
    set((state) => ({
      formData: {
        ...state.formData,
        pendingChanges: [],
      },
    }));
  },

  saveDraft: () => {
    const state = get();
    // Don't save appliedChanges (Updated badges) - they should be session-only
    const { appliedChanges, ...formDataToSave } = state.formData;
    localStorage.setItem('campaign_draft', JSON.stringify({ ...formDataToSave, appliedChanges: [] }));
    localStorage.setItem('campaign_draft_step', String(state.currentStep));
  },

  loadDraft: () => {
    const draftData = localStorage.getItem('campaign_draft');
    const draftStep = localStorage.getItem('campaign_draft_step');

    if (draftData) {
      try {
        const formData = JSON.parse(draftData);
        set({
          formData,
          currentStep: draftStep ? parseInt(draftStep) : 1,
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  },

  clearChatHistory: () => {
    console.log('🗑️ clearChatHistory called in store');
    set((state) => ({
      formData: {
        ...state.formData,
        aiChatHistory: [],
      },
    }));
    console.log('💾 Saving to localStorage...');
    // Save to localStorage immediately
    get().saveDraft();
    console.log('✅ Chat history cleared and saved');
  },

  resetForm: () => {
    set({ formData: initialFormData, currentStep: 1 });
    localStorage.removeItem('campaign_draft');
    localStorage.removeItem('campaign_draft_step');
  },
}));
