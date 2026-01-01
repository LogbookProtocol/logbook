'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Content } from '@/lib/mock/content';

interface ContentBreadcrumbsProps {
  path: Content[];
  onNavigate?: (content: Content | null) => void;
}

export function ContentBreadcrumbs({ path, onNavigate }: ContentBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      <Link
        href="/content"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition shrink-0"
        onClick={() => onNavigate?.(null)}
      >
        <Home size={14} />
        <span>Content</span>
      </Link>

      {path.map((item, index) => {
        const isLast = index === path.length - 1;

        return (
          <div key={item.id} className="flex items-center gap-1 shrink-0">
            <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />

            {isLast ? (
              <span className="px-2 py-1 text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                {item.title}
              </span>
            ) : (
              <Link
                href={`/content/${item.id}`}
                className="px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition truncate max-w-[200px]"
                onClick={() => onNavigate?.(item)}
              >
                {item.title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
