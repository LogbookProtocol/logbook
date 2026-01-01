'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Link as LinkIcon, Paperclip, FolderTree } from 'lucide-react';
import {
  findContentByIdGlobal,
  getContentPath,
  mockMyContent,
  mockAccessibleContent,
  mockStanfordContent,
} from '@/lib/mock/content';
import { ContentBreadcrumbs } from '@/components/content/ContentBreadcrumbs';
import { ContentCard } from '@/components/content/ContentCard';
import { AttachmentItem } from '@/components/content/AttachmentItem';
import { ContentIcon } from '@/components/content/ContentIcon';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const content = findContentByIdGlobal(id);
  const allContent = [...mockMyContent, ...mockAccessibleContent, ...mockStanfordContent];
  const path = getContentPath(id, allContent) || [];

  if (!content) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Content not found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The content you are looking for does not exist or has been deleted.
          </p>
          <Link
            href="/content"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
          >
            <ArrowLeft size={18} />
            <span>Back to Content</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = content.owner === '0x1234567890abcdef1234567890abcdef12345678'; // Mock owner check
  const attachmentCount = content.attachments.length;
  const childrenCount = content.children?.length || 0;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
      router.push('/content');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <ContentBreadcrumbs path={path} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <ContentIcon isFolder size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {content.title}
            </h1>
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
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>
                Updated{' '}
                {new Date(content.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition">
              <Edit size={20} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {content.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {content.description}
        </p>
      )}

      {/* Content Sections */}
      <div className="space-y-8">
        {/* Attachments Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Paperclip size={18} />
              Attachments
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({attachmentCount})
              </span>
            </h2>
            {isOwner && (
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition text-sm">
                <Plus size={14} />
                Upload
              </button>
            )}
          </div>

          {content.attachments.length > 0 ? (
            <div className="space-y-2">
              {content.attachments.map((attachment) => (
                <AttachmentItem key={attachment.id} attachment={attachment} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
              No attachments yet
            </p>
          )}
        </div>

        {/* Contains (Children) */}
        {(childrenCount > 0 || isOwner) && (
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderTree size={18} />
                Contains
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({childrenCount})
                </span>
              </h2>
              {isOwner && (
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition text-sm">
                  <Plus size={14} />
                  Add Content
                </button>
              )}
            </div>

            {content.children && content.children.length > 0 ? (
              <div className="space-y-3">
                {content.children.map((child) => (
                  <ContentCard
                    key={child.id}
                    content={child}
                    href={`/content/${child.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                No content yet
              </p>
            )}
          </div>
        )}

        {/* Details & Links */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Content Info */}
          <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Content Information
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(content.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Updated</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(content.updated_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Owner</dt>
                <dd className="text-gray-900 dark:text-white font-mono text-xs">
                  {content.owner.slice(0, 8)}...{content.owner.slice(-6)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Linked to */}
          {(content.linked_campaigns?.length || content.linked_spaces?.length) ? (
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <LinkIcon size={16} />
                Linked to
              </h3>
              <div className="space-y-2">
                {content.linked_campaigns?.map((campaignId) => (
                  <Link
                    key={campaignId}
                    href={`/campaigns/${campaignId}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Campaign #{campaignId}
                  </Link>
                ))}
                {content.linked_spaces?.map((spaceId) => (
                  <Link
                    key={spaceId}
                    href={`/spaces/${spaceId}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Space: {spaceId}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <LinkIcon size={16} />
                Linked to
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Not linked to any campaigns or spaces
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
