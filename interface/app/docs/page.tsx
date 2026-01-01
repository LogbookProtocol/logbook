'use client';

import { useState } from 'react';
import { docsNavigation, docsContent } from '@/lib/mock-docs';

// Simple markdown-like renderer
function renderMarkdown(content: string): string {
  return content
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-6 mb-3 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^\- \*\*(.*?)\*\*: (.*$)/gm, '<li class="text-gray-600 dark:text-gray-300 ml-4 mb-2"><strong class="text-gray-900 dark:text-white">$1</strong>: $2</li>')
    .replace(/^\- (.*$)/gm, '<li class="text-gray-600 dark:text-gray-300 ml-4 mb-2">• $1</li>')
    .replace(/^\d\. (.*$)/gm, '<li class="text-gray-600 dark:text-gray-300 ml-4 mb-2">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>')
    .split('\n\n')
    .map(para => {
      if (para.startsWith('<h') || para.startsWith('<li')) return para;
      if (para.trim() === '') return '';
      return `<p class="text-gray-600 dark:text-gray-400 mb-4">${para}</p>`;
    })
    .join('\n');
}

export default function DocsPage() {
  const [activeSlug, setActiveSlug] = useState('introduction');
  const activeDoc = docsContent[activeSlug] || docsContent.introduction;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex gap-12">

        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Documentation</h1>

            <nav className="space-y-6">
              {docsNavigation.map(section => (
                <div key={section.title}>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h2>
                  <ul className="space-y-1">
                    {section.items.map(item => (
                      <li key={item.slug}>
                        <button
                          onClick={() => setActiveSlug(item.slug)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                            activeSlug === item.slug
                              ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile navigation */}
        <div className="lg:hidden mb-6 w-full">
          <select
            value={activeSlug}
            onChange={(e) => setActiveSlug(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white"
          >
            {docsNavigation.map(section => (
              <optgroup key={section.title} label={section.title}>
                {section.items.map(item => (
                  <option key={item.slug} value={item.slug}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <article>
            <div className="p-8 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div
                className="docs-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(activeDoc.content) }}
              />
            </div>
          </article>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200 dark:border-white/[0.06]">
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              ← Previous
            </button>
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              Next →
            </button>
          </div>
        </main>

      </div>
    </div>
  );
}
