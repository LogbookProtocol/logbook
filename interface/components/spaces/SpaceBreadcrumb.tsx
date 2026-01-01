'use client';

import Link from 'next/link';
import { getSpacePath, SPACE_TYPES, SpaceType } from '@/lib/mock-spaces';

interface SpaceBreadcrumbProps {
  spaceId: string;
  className?: string;
}

export function SpaceBreadcrumb({ spaceId, className = '' }: SpaceBreadcrumbProps) {
  const path = getSpacePath(spaceId);

  if (path.length === 0) return null;

  return (
    <nav className={`flex items-center gap-2 text-sm flex-wrap ${className}`}>
      <Link
        href="/spaces"
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        Spaces
      </Link>
      {path.map((space, index) => {
        const isLast = index === path.length - 1;
        const typeInfo = SPACE_TYPES[space.type as SpaceType];

        return (
          <div key={space.id} className="flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-600">›</span>
            {isLast ? (
              <span className="text-gray-700 dark:text-gray-300">
                {typeInfo?.icon} {space.name}
              </span>
            ) : (
              <Link
                href={`/spaces/${space.id}`}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                {typeInfo?.icon} {space.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
