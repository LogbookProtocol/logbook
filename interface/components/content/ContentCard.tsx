'use client';

import Link from 'next/link';
import { Paperclip, FolderTree } from 'lucide-react';
import { Content } from '@/lib/mock/content';
import { ContentIcon } from './ContentIcon';

interface ContentCardProps {
  content: Content;
  onClick?: () => void;
  href?: string;
}

export function ContentCard({ content, onClick, href }: ContentCardProps) {
  const attachmentCount = content.attachments.length;
  const childrenCount = content.children?.length || 0;

  const cardContent = (
    <div className="group p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition">
          <ContentIcon isFolder size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
            {content.title}
          </h3>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Paperclip size={14} />
              {attachmentCount} {attachmentCount === 1 ? 'attachment' : 'attachments'}
            </span>
            {childrenCount > 0 && (
              <span className="flex items-center gap-1">
                <FolderTree size={14} />
                contains {childrenCount}
              </span>
            )}
          </div>

          {content.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {content.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>
              {new Date(content.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {(content.linked_campaigns?.length || content.linked_spaces?.length) && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>
                  {content.linked_campaigns?.length ? `${content.linked_campaigns.length} campaign${content.linked_campaigns.length > 1 ? 's' : ''}` : ''}
                  {content.linked_campaigns?.length && content.linked_spaces?.length ? ', ' : ''}
                  {content.linked_spaces?.length ? `${content.linked_spaces.length} space${content.linked_spaces.length > 1 ? 's' : ''}` : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{cardContent}</button>;
  }

  return cardContent;
}

interface ContentCardSkeletonProps {
  count?: number;
}

export function ContentCardSkeleton({ count = 3 }: ContentCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-1/4 bg-gray-100 dark:bg-white/5 rounded" />
              <div className="h-4 w-2/3 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
