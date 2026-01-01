'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Paperclip } from 'lucide-react';
import { Content } from '@/lib/mock/content';
import { ContentIcon } from './ContentIcon';

interface ContentTreeProps {
  content: Content[];
  onSelect?: (content: Content) => void;
  selectedId?: string;
  level?: number;
}

export function ContentTree({
  content,
  onSelect,
  selectedId,
  level = 0,
}: ContentTreeProps) {
  return (
    <div className="space-y-1">
      {content.map((item) => (
        <ContentTreeItem
          key={item.id}
          content={item}
          onSelect={onSelect}
          selectedId={selectedId}
          level={level}
        />
      ))}
    </div>
  );
}

interface ContentTreeItemProps {
  content: Content;
  onSelect?: (content: Content) => void;
  selectedId?: string;
  level: number;
}

function ContentTreeItem({
  content,
  onSelect,
  selectedId,
  level,
}: ContentTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedId === content.id;
  const hasChildren = content.children && content.children.length > 0;
  const attachmentCount = content.attachments.length;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    onSelect?.(content);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
          isSelected
            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {hasChildren ? (
          <span className="shrink-0 text-gray-400">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        ) : (
          <span className="shrink-0 w-4" />
        )}

        <ContentIcon isFolder isOpen={isOpen} size={18} />

        <span className="flex-1 truncate text-sm">{content.title}</span>

        {attachmentCount > 0 && (
          <span className="shrink-0 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Paperclip size={12} />
            {attachmentCount}
          </span>
        )}
      </button>

      {isOpen && hasChildren && (
        <ContentTree
          content={content.children!}
          onSelect={onSelect}
          selectedId={selectedId}
          level={level + 1}
        />
      )}
    </div>
  );
}

interface ContentTreeCompactProps {
  content: Content[];
  onSelect?: (content: Content) => void;
}

export function ContentTreeCompact({ content, onSelect }: ContentTreeCompactProps) {
  return (
    <div className="border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
      <div className="max-h-[400px] overflow-y-auto p-2">
        <ContentTree content={content} onSelect={onSelect} />
      </div>
    </div>
  );
}
