'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, PersonalityType, FieldUpdate, UploadedFile } from '@/types/ai';
import { CampaignFormData } from '@/types/campaign';
import { streamCampaignAssistant } from '@/lib/ai/claude';
import { parseFile } from '@/lib/ai/fileParser';
import { WELCOME_MESSAGE } from '@/lib/ai/prompts';

export function useAIAssistant(
  formData: CampaignFormData,
  currentStep: number,
  onFieldUpdate?: (field: string, value: any, label: string) => void,
  onSaveChatMessage?: (message: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; fieldUpdates?: { field: string; value: any; label: string }[] }) => void,
  onClearChat?: () => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [personality, setPersonality] = useState<PersonalityType>('friendly');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use refs to always have the latest values without recreating callbacks
  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);

  // Update refs synchronously whenever props change
  formDataRef.current = formData;
  currentStepRef.current = currentStep;

  // Restore chat history when formData changes (after draft is loaded)
  useEffect(() => {
    // Priority 1: Restore from draft if available
    if (formData.aiChatHistory && formData.aiChatHistory.length > 0 && !isInitialized) {
      console.log('📥 Restoring', formData.aiChatHistory.length, 'messages from draft on formData change');
      const restoredMessages: Message[] = formData.aiChatHistory.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        fieldUpdates: msg.fieldUpdates,
      }));
      setMessages(restoredMessages);
      setIsInitialized(true);
    }
    // Priority 2: Show welcome if no history and not initialized
    else if (!formData.aiChatHistory?.length && !isInitialized && messages.length === 0) {
      console.log('ℹ️ No chat history in formData, showing welcome message');
      const welcomeMsg: Message = {
        id: '1',
        role: 'assistant',
        content: WELCOME_MESSAGE(personality),
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      setIsInitialized(true);
    }
    // Priority 3: Replace welcome message with restored history when draft loads
    else if (formData.aiChatHistory && formData.aiChatHistory.length > 0 && isInitialized && messages.length === 1 && messages[0].id === '1') {
      console.log('🔄 Draft loaded after welcome message, replacing with', formData.aiChatHistory.length, 'restored messages');
      const restoredMessages: Message[] = formData.aiChatHistory.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        fieldUpdates: msg.fieldUpdates,
      }));
      setMessages(restoredMessages);
    }
  }, [formData.aiChatHistory, isInitialized, messages, personality]);

  // Legacy initializeChat - now handled by useEffect above
  const initializeChat = useCallback(() => {
    console.log('🔄 initializeChat called (legacy, handled by useEffect)');
    // Do nothing - initialization is now handled by useEffect
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isStreaming) return;

      // Add user message (display version without context)
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Save user message to draft
      if (onSaveChatMessage) {
        onSaveChatMessage({
          id: userMsg.id,
          role: userMsg.role,
          content: userMsg.content,
          timestamp: userMsg.timestamp.toISOString(),
        });
      }

      setIsStreaming(true);

      try {
        // Create assistant message placeholder
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Stream response - use refs to get latest values
        console.log('🔍 Sending to AI with formData:', {
          title: formDataRef.current.generalInfo.title,
          description: formDataRef.current.generalInfo.description,
          campaignType: formDataRef.current.generalInfo.campaignType,
        });

        // Create API version of user message with form context
        const formContext = `[CURRENT FORM STATE - Use this as source of truth: Title="${formDataRef.current.generalInfo.title}", Campaign Type="${formDataRef.current.generalInfo.campaignType}", Description="${formDataRef.current.generalInfo.description?.substring(0, 100) || 'Not set'}", Access Control="${formDataRef.current.generalInfo.accessControl}"]`;

        const userMsgWithContext: Message = {
          ...userMsg,
          content: `${formContext}\n\n${userMsg.content}`,
        };

        const stream = streamCampaignAssistant({
          messages: [...messages, userMsgWithContext],
          formData: formDataRef.current,
          currentStep: currentStepRef.current,
          personality,
        });

        let finalFieldUpdates: FieldUpdate[] = [];
        let finalContent = '';

        for await (const chunk of stream) {
          console.log('📦 Received chunk:', {
            hasContent: !!chunk.content,
            isComplete: chunk.isComplete,
            hasFieldUpdates: !!chunk.fieldUpdates,
            fieldUpdatesCount: chunk.fieldUpdates?.length || 0
          });

          // Save field updates and content BEFORE setMessages
          if (chunk.fieldUpdates && chunk.fieldUpdates.length > 0) {
            console.log('💾 Saving field updates:', chunk.fieldUpdates);
            finalFieldUpdates = chunk.fieldUpdates;
          }
          if (chunk.content) {
            finalContent = chunk.content;
          }

          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = chunk.content;
              lastMessage.isStreaming = !chunk.isComplete;
              if (chunk.fieldUpdates) {
                lastMessage.fieldUpdates = chunk.fieldUpdates;
              }
            }
            return newMessages;
          });
        }

        // Apply field updates
        console.log('🎯 Final field updates:', finalFieldUpdates);
        if (finalFieldUpdates.length > 0 && onFieldUpdate) {
          console.log('🚀 Applying', finalFieldUpdates.length, 'field updates');
          finalFieldUpdates.forEach((update) => {
            console.log('📤 Calling onFieldUpdate:', update);
            onFieldUpdate(update.field, update.value, update.label);
          });
        } else {
          console.warn('⚠️ No field updates to apply or onFieldUpdate not provided:', {
            updateCount: finalFieldUpdates.length,
            hasCallback: !!onFieldUpdate,
          });
        }

        // Save assistant message to draft after streaming completes
        if (onSaveChatMessage && finalContent) {
          onSaveChatMessage({
            id: assistantMsg.id,
            role: 'assistant',
            content: finalContent,
            timestamp: assistantMsg.timestamp.toISOString(),
            fieldUpdates: finalFieldUpdates.length > 0 ? finalFieldUpdates : undefined,
          });
        }
      } catch (error) {
        console.error('AI Assistant error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I'm sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, personality, isStreaming, onFieldUpdate, onSaveChatMessage]
  );

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const parsedData = await parseFile(file);
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        parsedData,
        uploadedAt: new Date(),
      };

      setUploadedFiles((prev) => [...prev, uploadedFile]);

      // Send file info to AI
      const fileContext = `File uploaded: ${file.name}\nType: ${parsedData.type}\nSuggestions: ${parsedData.suggestions.join(', ')}`;
      await sendMessage(fileContext);
    } catch (error) {
      console.error('File upload error:', error);
    }
  }, [sendMessage]);

  const changePersonality = useCallback((newPersonality: PersonalityType) => {
    setPersonality(newPersonality);
    // Add system message about personality change
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: WELCOME_MESSAGE(newPersonality),
        timestamp: new Date(),
      },
    ]);
  }, []);

  const clearChat = useCallback(() => {
    console.log('🧹 clearChat called in useAIAssistant');
    // Clear local state and show welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: WELCOME_MESSAGE(personality),
        timestamp: new Date(),
      },
    ]);
    console.log('🔄 Messages reset to welcome message');

    // Keep isInitialized as true since we just set the welcome message
    setIsInitialized(true);
    console.log('🚩 isInitialized set to true (chat is initialized with welcome message)');

    // Clear chat history from formData/localStorage
    if (onClearChat) {
      console.log('📞 Calling onClearChat callback');
      onClearChat();
    } else {
      console.warn('⚠️ onClearChat callback not provided');
    }
  }, [personality, onClearChat]);

  // Listen for clear chat event from SettingsMenu
  useEffect(() => {
    const handleClearChatEvent = () => {
      console.log('📥 clear-ai-chat event received in useAIAssistant');
      clearChat();
    };

    window.addEventListener('clear-ai-chat', handleClearChatEvent);
    return () => {
      window.removeEventListener('clear-ai-chat', handleClearChatEvent);
    };
  }, [clearChat]);

  return {
    messages,
    isStreaming,
    personality,
    uploadedFiles,
    isPanelOpen,
    setIsPanelOpen,
    sendMessage,
    handleFileUpload,
    changePersonality,
    clearChat,
    initializeChat,
  };
}
