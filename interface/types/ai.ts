export type PersonalityType = 'professional' | 'friendly' | 'technical' | 'creative';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  fieldUpdates?: FieldUpdate[];
}

export interface FieldUpdate {
  field: string;
  value: any;
  label: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: any;
  progress: number;
  error?: string;
}

export interface PersonalityConfig {
  type: PersonalityType;
  label: string;
  description: string;
  icon: string;
  systemPromptModifier: string;
}

export interface AISettings {
  personality: PersonalityType;
  isEnabled: boolean;
  autoSuggestions: boolean;
  voiceInput: boolean;
}

export interface CreditUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface AIAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
  uploadedFiles: UploadedFile[];
  settings: AISettings;
  creditUsage: CreditUsage;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

export interface StreamResponse {
  content: string;
  fieldUpdates?: FieldUpdate[];
  isComplete: boolean;
}

export interface ParsedFileData {
  type: 'whitelist' | 'questions' | 'general' | 'unknown';
  data: any;
  confidence: number;
  suggestions: string[];
}
