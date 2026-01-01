import Anthropic from '@anthropic-ai/sdk';
import { Message, PersonalityType, FieldUpdate, StreamResponse } from '@/types/ai';
import { CampaignFormData } from '@/types/campaign';
import { getSystemPrompt } from './prompts';

// Initialize Anthropic client
const getAnthropicClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Only for demo - in production, use API routes
  });
};

export interface StreamCampaignAssistantOptions {
  messages: Message[];
  formData: CampaignFormData;
  currentStep: number;
  personality: PersonalityType;
  fileContext?: string;
}

export async function* streamCampaignAssistant(
  options: StreamCampaignAssistantOptions
): AsyncGenerator<StreamResponse> {
  const { messages, formData, currentStep, personality, fileContext } = options;

  try {
    console.log('🤖 Starting AI stream...', { messagesCount: messages.length, currentStep, personality });
    console.log('📋 Form data received in streamCampaignAssistant:', {
      title: formData.generalInfo.title,
      description: formData.generalInfo.description?.substring(0, 50),
      campaignType: formData.generalInfo.campaignType,
    });
    const anthropic = getAnthropicClient();
    console.log('✅ API client created');
    const systemPrompt = getSystemPrompt(personality, formData, currentStep);
    console.log('✅ System prompt generated, length:', systemPrompt.length);
    console.log('📝 System prompt excerpt:', systemPrompt.substring(0, 500));

    // Add file context if provided
    const contextMessages = fileContext
      ? [
          {
            role: 'user' as const,
            content: `[Context from uploaded file]: ${fileContext}`,
          },
        ]
      : [];

    // Convert our messages to Anthropic format
    const anthropicMessages = [
      ...contextMessages,
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    ];

    console.log('📤 Sending request to Claude API...', { model: 'claude-sonnet-4-5-20250929', messagesCount: anthropicMessages.length });

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      system: systemPrompt,
      messages: anthropicMessages,
      temperature: 0.7,
    });

    console.log('✅ Stream started');
    let fullContent = '';

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const newText = chunk.delta.text;
        fullContent += newText;

        yield {
          content: fullContent,
          isComplete: false,
        };
      }
    }

    // Parse field updates from final content
    const fieldUpdates = parseFieldUpdates(fullContent);

    yield {
      content: fullContent,
      fieldUpdates,
      isComplete: true,
    };
  } catch (error: any) {
    console.error('Claude API error:', error);
    throw new Error(error.message || 'Failed to get response from AI assistant');
  }
}

export function parseFieldUpdates(content: string): FieldUpdate[] {
  const updates: FieldUpdate[] = [];
  // Updated regex: capture field, then everything (including empty) up to the last colon, then label
  // This handles values with colons (like dates: 2026-01-31T00:00) AND empty values (::)
  const updateRegex = /UPDATE_FIELD:([^:]+):(.*):([^:]+)$/gm;
  let match;

  console.log('🔍 Parsing field updates from content:', content.substring(0, 500));

  while ((match = updateRegex.exec(content)) !== null) {
    const [fullMatch, field, valueAndRest, label] = match;
    // The middle group captures everything between first and last colon
    // We need to split from the RIGHT to get the label
    const parts = fullMatch.split(':');
    if (parts.length < 4) {
      console.warn('⚠️ Invalid UPDATE_FIELD format:', fullMatch);
      continue;
    }

    // parts[0] = "UPDATE_FIELD"
    // parts[1] = field path
    // parts[2..n-1] = value (may contain colons, or be empty for clearing)
    // parts[n] = label
    const fieldPath = parts[1];
    const labelText = parts[parts.length - 1];
    const valueText = parts.slice(2, -1).join(':'); // Rejoin value parts with colons

    console.log('✅ Found UPDATE_FIELD:', {
      fullMatch,
      field: fieldPath,
      value: valueText === '' ? '(empty - clearing field)' : valueText,
      label: labelText
    });

    // Handle empty values (clearing fields)
    const parsedValue = valueText === '' ? '' : parseValue(valueText.trim());

    updates.push({
      field: fieldPath.trim(),
      value: parsedValue,
      label: labelText.trim(),
    });
  }

  console.log('📊 Parsed', updates.length, 'field updates:', updates);
  return updates;
}

function parseValue(value: string): any {
  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Try to parse as number
  const num = parseFloat(value);
  if (!isNaN(num)) return num;

  // Try to parse as JSON (for objects/arrays)
  try {
    return JSON.parse(value);
  } catch {
    // Return as string
    return value;
  }
}

export function parseQuestionAdd(content: string): any[] {
  const questions: any[] = [];
  const questionRegex = /ADD_QUESTION:({[^}]+})/g;
  let match;

  while ((match = questionRegex.exec(content)) !== null) {
    try {
      const questionData = JSON.parse(match[1]);
      questions.push(questionData);
    } catch (error) {
      console.error('Failed to parse question:', error);
    }
  }

  return questions;
}

export function cleanAIResponse(content: string): string {
  // Remove UPDATE_FIELD and ADD_QUESTION commands from display
  let cleaned = content.replace(/UPDATE_FIELD:[^\n]+\n?/g, '');
  cleaned = cleaned.replace(/ADD_QUESTION:{[^}]+}\n?/g, '');
  return cleaned.trim();
}

// Token counting (approximate)
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function calculateCreditUsage(messages: Message[]): number {
  const totalTokens = messages.reduce((sum, msg) => {
    return sum + estimateTokens(msg.content);
  }, 0);

  // Estimate: ~1000 tokens per message pair (user + assistant)
  return Math.ceil(totalTokens / 1000);
}
