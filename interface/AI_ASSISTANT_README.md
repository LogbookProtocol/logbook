# AI Assistant Feature for Campaign Creation

## Overview
AI-powered chat assistant using Claude API (Sonnet 4.5) to help users create campaigns through conversation, auto-fill fields, validate data, and provide proactive suggestions.

## Completed Implementation

### 1. Core Infrastructure ✅

#### Type Definitions ([types/ai.ts](types/ai.ts))
- `PersonalityType`: Professional, Friendly, Technical, Creative
- `Message`, `FieldUpdate`, `UploadedFile` interfaces
- `AIAssistantState` with full state management types
- `ParsedFileData` for file upload handling

#### System Prompts ([lib/ai/prompts.ts](lib/ai/prompts.ts))
- Dynamic system prompt generation based on:
  - Personality type (4 modes with different tones)
  - Current form state
  - Current step (1-4)
  - Missing required fields
- Context-aware suggestions
- Field update syntax definitions
- Welcome messages per personality

#### Claude API Integration ([lib/ai/claude.ts](lib/ai/claude.ts))
- Streaming response support
- Field update parsing (`UPDATE_FIELD:path:value:label`)
- Question generation parsing (`ADD_QUESTION:{...}`)
- Token estimation and credit usage tracking
- Error handling

#### File Parser ([lib/ai/fileParser.ts](lib/ai/fileParser.ts))
- CSV parsing for whitelists and general data
- Excel file detection
- PDF/Word document base64 conversion
- Text file analysis
- Image upload support
- File size validation (10MB limit)
- Supported formats: CSV, TXT, PDF, DOCX, XLSX, JPG, PNG

### 2. Features Implemented ✅

**Conversational Campaign Creation**
- System prompts adapt to current step and form state
- AI can auto-fill form fields via UPDATE_FIELD commands
- Context-aware suggestions based on campaign type

**File Upload & Parsing**
- CSV whitelist extraction
- General CSV data parsing
- Base64 encoding for PDFs/documents
- File type validation
- Size limit enforcement

**Personality System**
- 4 personalities with distinct tones:
  - Professional 💼: Formal, precise
  - Friendly 😊: Casual, encouraging
  - Technical 🔧: Detailed, expert
  - Creative 🎨: Playful, innovative

**Validation & Suggestions**
- Real-time missing field detection
- Context-specific suggestions per campaign type
- Step-specific validation rules
- Proactive help messages

## Installation

```bash
# Install required dependencies
npm install @anthropic-ai/sdk

# For voice input (optional)
npm install react-speech-recognition

# Set up environment variable
# Add to .env.local:
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

## Implementation Roadmap

### Phase 1: Core AI Components (To Be Built)

**AI Assistant Hook** (`hooks/useAIAssistant.ts`)
```typescript
export function useAIAssistant() {
  // State management for AI panel
  // Message handling
  // Streaming response processing
  // Field update application
  // File upload handling
}
```

**Chat Message Component** (`components/ai/ChatMessage.tsx`)
- User/AI message bubbles
- Streaming animation
- Field update indicators
- Copy message button
- Regenerate option

**AI Panel Component** (`components/ai/AIAssistantPanel.tsx`)
- Right sidebar layout (30% width)
- Minimize/maximize toggle
- Personality selector
- Chat interface
- File upload area
- Voice input button

### Phase 2: Advanced Features

**Voice Input** (`components/ai/VoiceInput.tsx`)
- Web Speech API integration
- Recording indicator
- Transcription display

**File Upload** (`components/ai/FileUpload.tsx`)
- Drag & drop zone
- Progress indicators
- File previews
- Extraction summaries

**Personality Selector** (`components/ai/PersonalitySelector.tsx`)
- Dropdown with 4 options
- Persistence to localStorage
- Dynamic icon display

### Phase 3: Integration

**Form Integration**
- Modify `CreateCampaignForm.tsx` to include AI panel
- Connect field updates to form state
- Add field highlight animations
- Implement undo functionality

## Usage Example

```typescript
// In CreateCampaignForm.tsx
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';

export function CreateCampaignForm() {
  const { formData, updateGeneralInfo } = useCampaignStore();

  const handleFieldUpdate = (field: string, value: any) => {
    // Apply AI-suggested field updates
    // with animation/highlight
  };

  return (
    <div className="flex">
      <div className="flex-1">
        {/* Existing form steps */}
      </div>

      <AIAssistantPanel
        formData={formData}
        currentStep={currentStep}
        onFieldUpdate={handleFieldUpdate}
      />
    </div>
  );
}
```

## Field Update Format

AI uses this syntax to update fields:
```
UPDATE_FIELD:generalInfo.title:Community Voting Q1 2025:Campaign Title
UPDATE_FIELD:economics.creatorPaysRespondents:true:Enable Rewards
```

Parser extracts:
- `field`: Path to form field (generalInfo.title)
- `value`: New value (auto-parsed to correct type)
- `label`: Human-readable label (for UI feedback)

## Question Generation Format

```
ADD_QUESTION:{"text":"Do you support the proposal?","type":"voting","answers":[{"text":"Yes"},{"text":"No"}],"required":true}
```

## Credit Management

- Free tier: 50 messages per campaign
- Approximate token counting
- Usage displayed in panel header
- Warning at 80% usage
- Block at 100% with upgrade prompt

## Error Handling

- API timeout: Retry button
- Network error: Message queue
- File too large: Clear error message
- Unsupported file: Format list
- Rate limit: Cooldown timer

## Security Notes

**IMPORTANT**: Current implementation uses `dangerouslyAllowBrowser: true` for the Anthropic client. This is acceptable for demos but **NOT for production**.

For production:
1. Create API route: `/app/api/ai/chat/route.ts`
2. Move Anthropic client to server-side
3. Stream responses through API route
4. Keep API key server-side only

## Next Steps

1. **Build UI Components**: Create the actual React components for the AI panel
2. **Implement State Hook**: Build `useAIAssistant` hook for state management
3. **Connect to Form**: Integrate AI panel with campaign creation form
4. **Add Voice**: Implement voice input feature
5. **Test & Refine**: User testing and prompt optimization
6. **Production Security**: Move API calls to server-side routes

## Files Created

```
types/ai.ts                      # TypeScript interfaces
lib/ai/prompts.ts               # System prompt templates
lib/ai/claude.ts                # Claude API integration
lib/ai/fileParser.ts            # File parsing utilities
AI_ASSISTANT_README.md          # This file
```

## Files To Create

```
hooks/useAIAssistant.ts         # AI state management
components/ai/AIAssistantPanel.tsx   # Main panel
components/ai/ChatMessage.tsx        # Message bubble
components/ai/FileUpload.tsx         # File upload UI
components/ai/VoiceInput.tsx         # Voice recording
components/ai/PersonalitySelector.tsx # Personality dropdown
```

---

**Status**: Core infrastructure completed. UI components and integration pending.
