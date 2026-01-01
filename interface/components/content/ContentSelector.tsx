'use client';

import { useState, useMemo } from 'react';
import { Search, Check, Plus, X, Paperclip, FolderTree } from 'lucide-react';
import { Content, mockContent } from '@/lib/mock/content';
import { ContentIcon } from './ContentIcon';
import Link from 'next/link';

interface ContentSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  availableContent?: Content[];
  maxSelections?: number;
}

export function ContentSelector({
  selectedIds,
  onChange,
  availableContent = mockContent,
  maxSelections,
}: ContentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten content for search (include all nested items)
  const flattenedContent = useMemo(() => {
    const result: Content[] = [];

    function flatten(items: Content[]) {
      for (const item of items) {
        result.push(item);
        if (item.children) {
          flatten(item.children);
        }
      }
    }

    flatten(availableContent);
    return result;
  }, [availableContent]);

  // Filter by search
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableContent; // Show only top-level when not searching
    }

    const query = searchQuery.toLowerCase();
    return flattenedContent.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }, [availableContent, flattenedContent, searchQuery]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      if (maxSelections && selectedIds.length >= maxSelections) {
        return;
      }
      onChange([...selectedIds, id]);
    }
  };

  const selectedContent = flattenedContent.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Selected items */}
      {selectedContent.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContent.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm"
            >
              <ContentIcon isFolder size={14} />
              <span className="truncate max-w-[150px]">{item.title}</span>
              <button
                onClick={() => handleToggle(item.id)}
                className="hover:text-cyan-700 dark:hover:text-cyan-300"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Content list */}
      <div className="border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 dark:divide-white/[0.06]">
          {filteredContent.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No content found' : 'No content available'}
            </div>
          ) : (
            filteredContent.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const attachmentCount = item.attachments.length;
              const childrenCount = item.children?.length || 0;
              const isDisabled =
                !isSelected && maxSelections && selectedIds.length >= maxSelections;

              return (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    isSelected
                      ? 'bg-cyan-500/5'
                      : isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <div
                    className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-cyan-500 border-cyan-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </div>

                  <ContentIcon isFolder size={20} />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Paperclip size={10} />
                        {attachmentCount}
                      </span>
                      {childrenCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FolderTree size={10} />
                          {childrenCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Create new link */}
      <Link
        href="/content/new"
        target="_blank"
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition text-sm"
      >
        <Plus size={16} />
        <span>Create new content</span>
      </Link>
    </div>
  );
}

interface ContentSelectorCompactProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ContentSelectorCompact({
  selectedIds,
  onChange,
}: ContentSelectorCompactProps) {
  const flattenedContent = useMemo(() => {
    const result: Content[] = [];

    function flatten(items: Content[]) {
      for (const item of items) {
        result.push(item);
        if (item.children) {
          flatten(item.children);
        }
      }
    }

    flatten(mockContent);
    return result;
  }, []);

  const selectedContent = flattenedContent.filter((c) => selectedIds.includes(c.id));

  if (selectedContent.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        No content attached
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selectedContent.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5"
        >
          <ContentIcon isFolder size={18} />
          <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
            {item.title}
          </span>
          <button
            onClick={() => onChange(selectedIds.filter((id) => id !== item.id))}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
