'use client';

import { Message } from '@/types/ai';
import { cleanAIResponse } from '@/lib/ai/claude';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const cleanContent = cleanAIResponse(message.content);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          AI
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        <div className="text-sm break-words prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
          {isUser ? (
            <div className="whitespace-pre-wrap">{cleanContent}</div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">{children}</code>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          )}
          {message.isStreaming && (
            <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>

        {message.fieldUpdates && message.fieldUpdates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs opacity-75 mb-2">Field updates:</p>
            {message.fieldUpdates.map((update, idx) => {
              // Extract readable field name from field path (e.g., "generalInfo.accessControl" → "Access Control")
              const fieldName = update.field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || update.field;
              const formattedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

              // Format value for display (convert snake_case to Title Case, etc.)
              const formatValue = (value: any): string => {
                if (typeof value === 'boolean') {
                  return value ? 'Yes' : 'No';
                }
                if (typeof value === 'object') {
                  return JSON.stringify(value);
                }
                const strValue = String(value);
                // Convert snake_case or kebab-case to Title Case
                if (strValue.includes('_') || strValue.includes('-')) {
                  return strValue
                    .split(/[_-]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                }
                // Capitalize first letter for regular strings
                return strValue.charAt(0).toUpperCase() + strValue.slice(1);
              };

              const displayValue = formatValue(update.value);

              return (
                <div
                  key={idx}
                  className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1.5 mb-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-green-600 dark:text-green-400">✓</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{formattedFieldName}</span>
                      <span className="opacity-60 mx-1.5">→</span>
                      <span className="font-mono">{displayValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2 text-xs opacity-60">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-bold shrink-0">
          U
        </div>
      )}
    </div>
  );
}
