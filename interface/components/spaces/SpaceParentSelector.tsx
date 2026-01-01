'use client';

import { useState } from 'react';
import { mockSpaces, buildSpaceTree, SPACE_TYPES, SpaceTreeNode, SpaceType } from '@/lib/mock-spaces';

interface SpaceParentSelectorProps {
  value: string | null;
  onChange: (parentId: string | null) => void;
  excludeId?: string; // Exclude space and its children (when editing)
}

export function SpaceParentSelector({ value, onChange, excludeId }: SpaceParentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tree = buildSpaceTree();
  const selectedSpace = value ? mockSpaces.find((s) => s.id === value) : null;

  // Recursively render tree
  const renderTree = (nodes: SpaceTreeNode[], depth = 0) => {
    return nodes
      .filter((node) => node.id !== excludeId)
      .map((node) => {
        const typeInfo = SPACE_TYPES[node.type as SpaceType];

        return (
          <div key={node.id}>
            <button
              onClick={() => {
                onChange(node.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-2 ${
                value === node.id
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              style={{ paddingLeft: `${16 + depth * 20}px` }}
            >
              <span>{typeInfo?.icon}</span>
              <span>{node.name}</span>
            </button>
            {node.children.length > 0 && renderTree(node.children, depth + 1)}
          </div>
        );
      });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-left flex items-center justify-between hover:border-gray-300 dark:hover:border-white/20 transition"
      >
        {selectedSpace ? (
          <span className="flex items-center gap-2">
            <span>{SPACE_TYPES[selectedSpace.type as SpaceType]?.icon}</span>
            <span className="text-gray-900 dark:text-white">{selectedSpace.name}</span>
          </span>
        ) : (
          <span className="text-gray-500">None - standalone space</span>
        )}
        <span className="text-gray-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/[0.06] shadow-xl z-50 max-h-80 overflow-y-auto">
          {/* None option */}
          <button
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 transition ${
              value === null
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            None - standalone space
          </button>

          <div className="border-t border-gray-200 dark:border-white/[0.06]" />

          {/* Tree */}
          {renderTree(tree)}
        </div>
      )}
    </div>
  );
}
