import { create } from 'zustand';
import { CampaignStore, CampaignFormData, Question, CampaignAccessMode } from '@/types/campaign';

const initialFormData: CampaignFormData = {
  title: '',
  description: '',
  endDate: '',
  questions: [],
  accessMode: 'open',
};

export const useCampaignStore = create<CampaignStore>((set) => ({
  formData: initialFormData,
  isReviewMode: false,
  generatedPassword: null,

  updateFormData: (data: Partial<CampaignFormData>) =>
    set((state) => ({
      formData: {
        ...state.formData,
        ...data,
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

  setReviewMode: (isReview: boolean) => set({ isReviewMode: isReview }),

  setAccessMode: (mode: CampaignAccessMode) =>
    set((state) => ({
      formData: {
        ...state.formData,
        accessMode: mode,
      },
    })),

  setGeneratedPassword: (password: string | null) =>
    set({ generatedPassword: password }),

  resetForm: () =>
    set({ formData: initialFormData, isReviewMode: false, generatedPassword: null }),
}));
