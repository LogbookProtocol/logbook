'use client';

import { useCampaignStore } from '@/store/campaignStore';
import { ContentSelector } from '@/components/content/ContentSelector';
import { mockContent } from '@/lib/mock/content';

interface AttachContentProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function AttachContent({ onNext, onPrevious }: AttachContentProps) {
  const { formData, updateAttachedContent } = useCampaignStore();
  const selectedIds = formData.attachedContentIds || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Attach Content
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select content that participants will unlock after completing this campaign. This step is optional.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Content you attach here will be gated behind campaign completion. Participants who submit a response will gain access to view and download the selected files and folders.
        </p>
      </div>

      <ContentSelector
        selectedIds={selectedIds}
        onChange={updateAttachedContent}
        availableContent={mockContent}
      />

      {selectedIds.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No content selected. You can skip this step if you don&apos;t want to attach any content.</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          {selectedIds.length > 0 ? 'Continue' : 'Skip'}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
