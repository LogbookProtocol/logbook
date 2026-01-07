export type QuestionType = 'single_choice' | 'multiple_choice' | 'text_input';

export type CampaignAccessMode = 'open' | 'password_protected';

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  answers: AnswerOption[];
  required: boolean;
}

export interface CampaignFormData {
  title: string;
  description: string;
  endDate: string;
  questions: Question[];
  accessMode: CampaignAccessMode;
}

export interface CampaignStore {
  formData: CampaignFormData;
  isReviewMode: boolean;
  generatedPassword: string | null;

  updateFormData: (data: Partial<CampaignFormData>) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  reorderQuestions: (questions: Question[]) => void;
  setReviewMode: (isReview: boolean) => void;
  setAccessMode: (mode: CampaignAccessMode) => void;
  setGeneratedPassword: (password: string | null) => void;
  resetForm: () => void;
}
