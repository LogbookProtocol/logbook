export type CampaignType = 'survey' | 'voting' | 'certification' | 'registration' | 'competition';

export type AccessControl = 'public' | 'link_only' | 'whitelist' | 'application_based';

export type QuestionType = 'survey' | 'voting' | 'certification' | 'text_input' | 'file_upload';

export type DistributionMethod = 'equal' | 'based_on_answers' | 'random_lottery';

export type VotingRule = 'simple_majority' | 'supermajority' | 'custom';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect?: boolean; // For certification type
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  mediaName?: string;
  answers: AnswerOption[];
  required: boolean;
  votingRule?: VotingRule;
  supermajorityPercentage?: number;
  customRuleDescription?: string;
}

export interface GeneralInfo {
  title: string;
  description: string;
  campaignType: CampaignType;
  accessControl: AccessControl;
  warmupStartDate?: string;
  campaignStartDate: string;
  campaignEndDate: string;
  whitelistAddresses?: string[];
}

export interface Economics {
  creatorPaysRespondents: boolean;
  rewardAmountPerRespondent?: number;
  distributionMethod?: DistributionMethod;
  respondentsPayCreator: boolean;
  participationFee?: number;
  expectedParticipants?: number;
}

export interface PendingChange {
  id: string;
  field: string;
  value: any;
  oldValue: any;
  label: string;
  timestamp: string;
}

export interface AppliedChange {
  field: string;
  timestamp: string;
}

export interface CampaignFormData {
  generalInfo: GeneralInfo;
  economics: Economics;
  questions: Question[];
  attachedContentIds?: string[];
  aiChatHistory?: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    fieldUpdates?: {
      field: string;
      value: any;
      label: string;
    }[];
  }[];
  pendingChanges?: PendingChange[];
  appliedChanges?: AppliedChange[];
}

export interface CampaignStore {
  // State
  currentStep: number;
  formData: CampaignFormData;

  // Actions
  setCurrentStep: (step: number) => void;
  updateGeneralInfo: (data: Partial<GeneralInfo>) => void;
  updateEconomics: (data: Partial<Economics>) => void;
  updateAttachedContent: (contentIds: string[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  reorderQuestions: (questions: Question[]) => void;
  saveAIChatMessage: (message: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; fieldUpdates?: { field: string; value: any; label: string }[] }) => void;
  addPendingChange: (change: PendingChange) => void;
  approvePendingChange: (changeId: string) => void;
  rejectPendingChange: (changeId: string) => void;
  rejectAllPendingChanges: () => void;
  markFieldAsUpdated: (field: string) => void;
  clearFieldUpdate: (field: string) => void;
  clearAllFieldUpdates: () => void;
  clearChatHistory: () => void;
  saveDraft: () => void;
  loadDraft: () => void;
  resetForm: () => void;
}
