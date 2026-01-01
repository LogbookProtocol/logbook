'use client';

import { Download } from 'lucide-react';
import { Attachment, formatFileSize } from '@/lib/mock/content';
import { ContentIcon, getFileTypeLabel } from './ContentIcon';

interface AttachmentItemProps {
  attachment: Attachment;
  onDownload?: (attachment: Attachment) => void;
}

export function AttachmentItem({ attachment, onDownload }: AttachmentItemProps) {
  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Mock download - in production this would trigger actual download
      console.log('Downloading:', attachment.filename);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10 transition group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center">
          <ContentIcon fileType={attachment.file_type} size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
            {attachment.filename}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{getFileTypeLabel(attachment.file_type)}</span>
            {attachment.file_size && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{formatFileSize(attachment.file_size)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition opacity-0 group-hover:opacity-100"
        title="Download"
      >
        <Download size={18} />
      </button>
    </div>
  );
}

interface AttachmentItemSkeletonProps {
  count?: number;
}

export function AttachmentItemSkeleton({ count = 3 }: AttachmentItemSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] animate-pulse"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-200 dark:bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-1/4 bg-gray-100 dark:bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
