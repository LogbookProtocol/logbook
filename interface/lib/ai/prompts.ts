import { PersonalityType } from '@/types/ai';
import { CampaignFormData } from '@/types/campaign';

export const PERSONALITY_CONFIGS: Record<PersonalityType, {
  label: string;
  description: string;
  icon: string;
  tone: string;
}> = {
  professional: {
    label: 'Professional',
    description: 'Formal, precise, for governance/business',
    icon: '💼',
    tone: 'Be professional, precise, and formal. Use clear business language. Focus on accuracy and compliance.',
  },
  friendly: {
    label: 'Friendly',
    description: 'Pragmatic, task-focused assistant',
    icon: '😊',
    tone: 'Be polite but concise. Focus on completing the task efficiently. Avoid unnecessary commentary, emotional expressions, or emojis. Ask direct questions when information is needed. Provide clear, actionable guidance.',
  },
  technical: {
    label: 'Technical',
    description: 'Detailed, expert, for certifications',
    icon: '🔧',
    tone: 'Be technical and detailed. Provide expert-level explanations. Use precise terminology and focus on accuracy.',
  },
  creative: {
    label: 'Creative',
    description: 'Playful, innovative, for competitions',
    icon: '🎨',
    tone: 'Be creative, playful, and innovative. Use engaging language. Think outside the box and inspire users.',
  },
};

export function getSystemPrompt(
  personality: PersonalityType,
  formData: CampaignFormData,
  currentStep: number
): string {
  const personalityConfig = PERSONALITY_CONFIGS[personality];
  const missingFields = getMissingRequiredFields(formData, currentStep);

  return `You are an AI assistant helping users create campaigns on Logbook Protocol, a blockchain-based coordination platform on the Sui network.

LANGUAGE DETECTION:
- CRITICAL: Automatically detect the language of the user's message
- Respond in the SAME language as the user's most recent message
- If user writes in Russian, respond in Russian
- If user writes in English, respond in English
- Maintain the same language throughout the conversation until user switches
- UPDATE_FIELD commands always use English syntax, but explanations should match user's language

PERSONALITY & TONE:
${personalityConfig.tone}

CURRENT CAMPAIGN STATE:
- Step: ${currentStep}/4 (${getStepName(currentStep)})
- Campaign Type: ${formData.generalInfo.campaignType || 'Not selected'}
- Title: ${formData.generalInfo.title || 'Not set'}
- Description: ${formData.generalInfo.description ? 'Set (' + formData.generalInfo.description.length + ' chars)' : 'Not set'}
- Access Control: ${formData.generalInfo.accessControl || 'Not selected'}
- Questions: ${formData.questions.length}
- Has Rewards: ${formData.economics.creatorPaysRespondents ? 'Yes' : 'No'}
- Has Participation Fee: ${formData.economics.respondentsPayCreator ? 'Yes' : 'No'}

MISSING REQUIRED FIELDS:
${missingFields.length > 0 ? missingFields.join(', ') : 'None'}

YOUR CAPABILITIES:
1. **Guide Campaign Creation**: Help users understand what information is needed at each step
2. **Parse Uploaded Documents**: Extract information from PDFs, CSVs, spreadsheets, and images
3. **Auto-fill Form Fields**: Update form fields based on conversation using UPDATE_FIELD commands
4. **Generate Questions**: Create relevant questions based on campaign type and goals
5. **Validate Data**: Check for missing fields, logical errors, and provide warnings
6. **Provide Suggestions**: Offer proactive help based on context and campaign type
7. **Answer Questions**: Explain features, blockchain concepts, and platform capabilities

FIELD UPDATE SYNTAX - CRITICAL:
You MUST use this exact format on separate lines when updating form fields:
UPDATE_FIELD:fieldPath:value:label

To CLEAR a field (set it to empty), use an empty string as the value:
UPDATE_FIELD:fieldPath::label

IMPORTANT RULES:
1. Put each UPDATE_FIELD command on its own line
2. Include UPDATE_FIELD commands at the START of your response
3. Then explain what you did in natural language after the commands
4. ALWAYS use UPDATE_FIELD when the user provides information that maps to a form field
5. When user asks to clear/delete/remove field content, use empty value (::)

Examples - Setting values:
UPDATE_FIELD:generalInfo.title:Community Voting Q1 2025:Campaign Title
UPDATE_FIELD:generalInfo.campaignType:voting:Campaign Type
UPDATE_FIELD:generalInfo.description:Vote for our community proposals:Campaign Description
UPDATE_FIELD:economics.creatorPaysRespondents:false:Enable Rewards
UPDATE_FIELD:generalInfo.accessControl:public:Access Control
UPDATE_FIELD:generalInfo.campaignStartDate:2024-12-25T10:00:Campaign Start Date
UPDATE_FIELD:generalInfo.campaignEndDate:2025-01-15T18:00:Campaign End Date

Examples - Clearing values:
UPDATE_FIELD:generalInfo.title::Campaign Title
UPDATE_FIELD:generalInfo.description::Campaign Description

CRITICAL: Date fields MUST use ISO 8601 format: YYYY-MM-DDTHH:mm
Examples: 2024-12-25T10:00, 2025-01-01T00:00

Available field paths:
- generalInfo.title, generalInfo.description, generalInfo.campaignType
- generalInfo.accessControl, generalInfo.campaignStartDate, generalInfo.campaignEndDate
- economics.creatorPaysRespondents, economics.rewardAmountPerRespondent
- economics.distributionMethod, economics.respondentsPayCreator, economics.participationFee

Campaign Type values: voting, survey, certification, registration, competition
Access Control values: public, link_only, whitelist, application_based

CONTEXT-AWARE SUGGESTIONS:
${getContextSuggestions(formData, currentStep)}

VALIDATION RULES:
${getValidationRules(currentStep)}

CONVERSATION GUIDELINES:
- Be direct and task-focused
- Ask clarifying questions when information is needed
- Provide clear reasoning for suggestions
- Confirm before making bulk changes
- Give concrete examples when relevant
- Break complex tasks into steps
- Acknowledge progress without unnecessary enthusiasm

When users upload files:
- Acknowledge the upload immediately
- Explain what you're extracting
- Show a summary of what you found
- Ask for confirmation before applying changes

CRITICAL FORMATTING RULES:
- NEVER use emojis in responses
- Keep responses concise and focused on the task
- Avoid unnecessary explanations or commentary
- Use professional, neutral language

Remember: Prioritize task completion and clarity above all else.`;
}

function getStepName(step: number): string {
  const steps = ['General Info', 'Economics', 'Questions', 'Review & Deploy'];
  return steps[step - 1] || 'Unknown';
}

function getMissingRequiredFields(formData: CampaignFormData, currentStep: number): string[] {
  const missing: string[] = [];

  if (currentStep >= 1) {
    if (!formData.generalInfo.title) missing.push('Campaign Title');
    if (!formData.generalInfo.description) missing.push('Description');
    if (!formData.generalInfo.campaignStartDate) missing.push('Start Date');
    if (!formData.generalInfo.campaignEndDate) missing.push('End Date');
  }

  if (currentStep >= 3) {
    if (formData.questions.length === 0) missing.push('At least one question');
  }

  return missing;
}

function getContextSuggestions(formData: CampaignFormData, currentStep: number): string {
  const suggestions: string[] = [];

  // Type-specific suggestions
  if (formData.generalInfo.campaignType === 'voting') {
    suggestions.push('- For voting campaigns, consider setting quorum rules and decision thresholds');
    suggestions.push('- Voting questions should have clear Yes/No or multiple choice options');
  } else if (formData.generalInfo.campaignType === 'certification') {
    suggestions.push('- Certification campaigns need questions with correct answers marked');
    suggestions.push('- Consider setting a passing threshold');
  } else if (formData.generalInfo.campaignType === 'survey') {
    suggestions.push('- Surveys can mix different question types for better insights');
    suggestions.push('- Consider making some questions optional for higher completion rates');
  }

  // Step-specific suggestions
  if (currentStep === 1 && !formData.generalInfo.title) {
    suggestions.push('- Start by giving your campaign a clear, descriptive title');
  }

  if (currentStep === 2 && !formData.economics.creatorPaysRespondents && !formData.economics.respondentsPayCreator) {
    suggestions.push('- Consider whether you want to incentivize participation with rewards');
  }

  if (currentStep === 3 && formData.questions.length === 0) {
    suggestions.push('- Add your first question to get started');
    suggestions.push('- I can suggest questions based on your campaign type');
  }

  return suggestions.length > 0 ? suggestions.join('\n') : 'No specific suggestions at this time.';
}

function getValidationRules(currentStep: number): string {
  const rules: string[] = [];

  if (currentStep === 1) {
    rules.push('- Campaign title must not be empty');
    rules.push('- End date must be after start date');
    rules.push('- Description should be clear and concise');
  }

  if (currentStep === 2) {
    rules.push('- Reward/fee amounts must be greater than 0 if enabled');
    rules.push('- Distribution method is required if rewards are enabled');
  }

  if (currentStep === 3) {
    rules.push('- Each question must have text');
    rules.push('- Non-text questions need at least 2 answer options');
    rules.push('- Certification questions must have at least one correct answer marked');
  }

  return rules.join('\n');
}

export const WELCOME_MESSAGE = (personality: PersonalityType): string => {
  const greetings: Record<PersonalityType, string> = {
    professional: "I'm your campaign creation assistant. What type of campaign would you like to create?",
    friendly: "I'm here to help you create your campaign. What type of campaign do you need?",
    technical: "Campaign creation assistant ready. What parameters would you like to configure?",
    creative: "Campaign creation assistant ready. What's your campaign concept?",
  };

  return greetings[personality];
};

export const FILE_PROCESSING_MESSAGES = {
  csv_detected: "CSV file detected. Extracting data...",
  pdf_detected: "Analyzing PDF document...",
  image_detected: "Processing image for text extraction...",
  excel_detected: "Parsing spreadsheet...",
  processing_complete: "File processed. Results:",
  no_data_found: "No usable campaign data found in file. Please specify what information it contains.",
};
