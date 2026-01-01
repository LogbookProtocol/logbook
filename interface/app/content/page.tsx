'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Grid, List, FolderPlus, Unlock } from 'lucide-react';
import { mockMyContent, mockAccessibleContent } from '@/lib/mock/content';
import { ContentCard, ContentCardSkeleton } from '@/components/content/ContentCard';

type TabType = 'created' | 'access';
type ViewMode = 'grid' | 'list';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading] = useState(false);

  const createdContent = mockMyContent;
  const accessibleContent = mockAccessibleContent;

  const currentContent = activeTab === 'created' ? createdContent : accessibleContent;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your files and folders
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Grid size={18} />
            </button>
          </div>

          <Link
            href="/content/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
          >
            <Plus size={18} />
            <span>Create Content</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-white/[0.06]">
        <button
          onClick={() => setActiveTab('created')}
          className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
            activeTab === 'created'
              ? 'text-gray-900 dark:text-white border-cyan-500'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Created
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
            activeTab === 'access'
              ? 'text-gray-900 dark:text-white border-cyan-500'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          My Access
        </button>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          <ContentCardSkeleton count={6} />
        </div>
      ) : currentContent.length === 0 ? (
        activeTab === 'created' ? <EmptyCreatedState /> : <EmptyAccessState />
      ) : (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {currentContent.map((item) => (
            <ContentCard key={item.id} content={item} href={`/content/${item.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyCreatedState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
        <FolderPlus size={40} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        You haven&apos;t created any content yet
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        Create your first content to store files and folders. You can attach content to campaigns and spaces.
      </p>
      <Link
        href="/content/new"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
      >
        <Plus size={18} />
        <span>Create Content</span>
      </Link>
    </div>
  );
}

function EmptyAccessState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
        <Unlock size={40} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        You don&apos;t have access to any content yet
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        Complete campaigns to unlock content. Content creators can attach exclusive files and folders to their campaigns.
      </p>
      <Link
        href="/campaigns"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition"
      >
        <span>Explore Campaigns</span>
      </Link>
    </div>
  );
}
