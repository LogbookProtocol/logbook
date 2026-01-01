'use client';

import { Download, Lock, Paperclip, FolderTree } from 'lucide-react';
import { Content, Attachment, formatFileSize } from '@/lib/mock/content';
import { ContentIcon, getFileTypeLabel } from './ContentIcon';

interface ContentPreviewProps {
  content: Content;
  isLocked?: boolean;
  onDownload?: () => void;
}

export function ContentPreview({ content, isLocked = false, onDownload }: ContentPreviewProps) {
  const attachmentCount = content.attachments.length;
  const childrenCount = content.children?.length || 0;

  return (
    <div className="rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/[0.06] overflow-hidden">
      {/* Preview area */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        {isLocked ? (
          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <Lock size={32} />
            </div>
            <span className="text-sm">Content locked</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-400">
            <ContentIcon isFolder size={48} />
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Paperclip size={14} />
                {attachmentCount} attachments
              </span>
              {childrenCount > 0 && (
                <span className="flex items-center gap-1">
                  <FolderTree size={14} />
                  contains {childrenCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <ContentIcon isFolder size={24} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {content.title}
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {attachmentCount} attachments
              {childrenCount > 0 && ` • contains ${childrenCount}`}
            </div>
          </div>
        </div>

        {content.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {content.description}
          </p>
        )}

        {!isLocked && attachmentCount > 0 && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition"
            >
              <Download size={18} />
              <span>Download All</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AttachmentPreviewProps {
  attachment: Attachment;
  isLocked?: boolean;
  onDownload?: () => void;
}

export function AttachmentPreview({ attachment, isLocked = false, onDownload }: AttachmentPreviewProps) {
  return (
    <div className="rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/[0.06] overflow-hidden">
      {/* Preview area */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        {isLocked ? (
          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <Lock size={32} />
            </div>
            <span className="text-sm">Content locked</span>
          </div>
        ) : (
          <AttachmentPreviewContent attachment={attachment} />
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <ContentIcon fileType={attachment.file_type} size={24} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {attachment.filename}
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {getFileTypeLabel(attachment.file_type)}
              {attachment.file_size && ` • ${formatFileSize(attachment.file_size)}`}
            </div>
          </div>
        </div>

        {!isLocked && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AttachmentPreviewContent({ attachment }: { attachment: Attachment }) {
  switch (attachment.file_type) {
    case 'video':
      return (
        <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-400">
          <ContentIcon fileType="video" size={48} />
          <span className="text-sm">Video file</span>
        </div>
      );

    case 'image':
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800">
          <ContentIcon fileType="image" size={48} className="opacity-50" />
        </div>
      );

    case 'audio':
      return (
        <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-400">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <ContentIcon fileType="audio" size={40} className="text-white" />
          </div>
        </div>
      );

    case 'pdf':
      return (
        <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-24 h-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg flex flex-col items-center justify-center border border-gray-300 dark:border-gray-600">
            <ContentIcon fileType="pdf" size={32} />
            <span className="text-xs mt-2 text-gray-400">PDF</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
          <ContentIcon fileType={attachment.file_type} size={48} />
          <span className="text-sm">Preview not available</span>
        </div>
      );
  }
}

interface ContentPreviewLockedProps {
  content: Content;
  message?: string;
}

export function ContentPreviewLocked({
  content,
  message = 'Complete the campaign to unlock this content',
}: ContentPreviewLockedProps) {
  return (
    <div className="p-6 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/[0.06]">
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center">
          <Lock size={24} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {content.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
