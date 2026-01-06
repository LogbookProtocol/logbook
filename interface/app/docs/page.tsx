'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { docsNavigation, docsContent } from '@/lib/mock-docs';

// Icons for sections
const sectionIcons: Record<string, React.ReactNode> = {
  'Introduction': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Getting Started': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'Campaigns': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  'Technical': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
};

// Extract headings for table of contents (only h2)
function extractHeadings(content: string): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{2})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ level, text, id });
    }
  }

  return headings;
}

// Enhanced markdown renderer with beautiful styling
function renderMarkdown(content: string): string {
  let html = content;

  // Code blocks (triple backticks)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="code-block-wrapper">
      ${lang ? `<div class="code-block-lang">${lang}</div>` : ''}
      <pre class="code-block"><code>${code.trim()}</code></pre>
    </div>`;
  });

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g, (match) => {
    const lines = match.trim().split('\n');
    const headers = lines[0].split('|').filter(cell => cell.trim());
    const rows = lines.slice(2).map(line => line.split('|').filter(cell => cell.trim()));

    let table = '<div class="table-wrapper"><table class="docs-table">';
    table += '<thead><tr>';
    headers.forEach(h => {
      table += `<th>${h.trim()}</th>`;
    });
    table += '</tr></thead><tbody>';
    rows.forEach(row => {
      table += '<tr>';
      row.forEach(cell => {
        table += `<td>${cell.trim()}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table></div>';
    return table;
  });

  // Headers with anchors
  html = html.replace(/^# (.*$)/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h1 id="${id}" class="docs-h1">${text}</h1>`;
  });
  html = html.replace(/^## (.*$)/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h2 id="${id}" class="docs-h2"><a href="#${id}" class="anchor-link">#</a>${text}</h2>`;
  });
  html = html.replace(/^### (.*$)/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h3 id="${id}" class="docs-h3"><a href="#${id}" class="anchor-link">#</a>${text}</h3>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="docs-bold">$1</strong>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="docs-link" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists with proper nesting
  html = html.replace(/^(\d+)\. \*\*(.*?)\*\*: (.*$)/gm, '<li class="docs-li numbered"><span class="list-number">$1</span><span class="list-content"><strong class="docs-bold">$2</strong>: $3</span></li>');
  html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="docs-li numbered"><span class="list-number">$1</span><span class="list-content">$2</span></li>');
  html = html.replace(/^- \*\*(.*?)\*\*: (.*$)/gm, '<li class="docs-li bulleted"><span class="list-bullet"></span><span class="list-content"><strong class="docs-bold">$1</strong>: $2</span></li>');
  html = html.replace(/^- (.*$)/gm, '<li class="docs-li bulleted"><span class="list-bullet"></span><span class="list-content">$1</span></li>');

  // Wrap consecutive list items in ul/ol
  html = html.replace(/((?:<li class="docs-li numbered">.*<\/li>\n?)+)/g, '<ol class="docs-ol">$1</ol>');
  html = html.replace(/((?:<li class="docs-li bulleted">.*<\/li>\n?)+)/g, '<ul class="docs-ul">$1</ul>');

  // Paragraphs - wrap remaining text
  const lines = html.split('\n\n');
  html = lines.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<table')) {
      return trimmed;
    }
    return `<p class="docs-p">${trimmed}</p>`;
  }).join('\n\n');

  // Replace "Logbook" with gradient brand text (only in paragraphs and list content, not in headings)
  html = html.replace(/<p class="docs-p">([\s\S]*?)<\/p>/g, (match, content) => {
    const branded = content.replace(/\bLogbook\b/g, '<span class="logbook-brand">Logbook</span>');
    return `<p class="docs-p">${branded}</p>`;
  });
  html = html.replace(/<span class="list-content">([\s\S]*?)<\/span>/g, (match, content) => {
    const branded = content.replace(/\bLogbook\b/g, '<span class="logbook-brand">Logbook</span>');
    return `<span class="list-content">${branded}</span>`;
  });

  // Wrap Example sections - find h3 with "Example" text and wrap until next heading
  html = html.replace(/<h3 id="example"[^>]*>.*?Example.*?<\/h3>([\s\S]*?)(?=<h[23]|$)/gi, (match, content) => {
    return `<div class="docs-example-box"><div class="docs-example-label">Example</div>${content.trim()}</div>`;
  });

  return html;
}

// Get all docs in flat order
function getAllDocs(): { slug: string; title: string; section: string }[] {
  const docs: { slug: string; title: string; section: string }[] = [];
  docsNavigation.forEach(section => {
    section.items.forEach(item => {
      docs.push({ slug: item.slug, title: item.title, section: section.title });
    });
  });
  return docs;
}

export default function DocsPage() {
  const searchParams = useSearchParams();
  const docParam = searchParams.get('doc');

  const [activeSlug, setActiveSlug] = useState('introduction');
  const [activeHeading, setActiveHeading] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  // Read doc param from URL on mount
  useEffect(() => {
    if (docParam && docsContent[docParam]) {
      setActiveSlug(docParam);
    }
  }, [docParam]);

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@logbook.zone');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };
  const activeDoc = docsContent[activeSlug] || docsContent.introduction;

  const allDocs = useMemo(() => getAllDocs(), []);
  const currentIndex = allDocs.findIndex(d => d.slug === activeSlug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  const headings = useMemo(() => extractHeadings(activeDoc.content), [activeDoc.content]);
  const renderedContent = useMemo(() => renderMarkdown(activeDoc.content), [activeDoc.content]);

  // Track active heading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveHeading(headings[i].id);
          return;
        }
      }
      setActiveHeading('');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  // Calculate reading time
  const wordCount = activeDoc.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero header */}
      <div className="border-b border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 sm:gap-3 text-cyan-600 dark:text-cyan-400 mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs sm:text-sm font-medium tracking-wide uppercase">Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1 mb-2 sm:mb-3">
            Learn Logbook
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Everything you need to create blockchain-verified surveys, understand the technology, and get the most out of Logbook.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Left Sidebar - Navigation */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <nav className="space-y-6">
                {docsNavigation.map(section => (
                  <div key={section.title}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                      <span className="text-gray-400 dark:text-gray-500">
                        {sectionIcons[section.title]}
                      </span>
                      {section.title}
                    </div>
                    <ul className="space-y-1">
                      {section.items.map(item => (
                        <li key={item.slug}>
                          <button
                            onClick={() => {
                              setActiveSlug(item.slug);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`group w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                              activeSlug === item.slug
                                ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium border-l-2 border-cyan-500 -ml-[2px] pl-[14px]'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            {item.title}
                            {item.slug === 'free-tier' && (
                              <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* Help card */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-100 dark:border-cyan-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100">Need help?</span>
                </div>
                <p className="text-xs text-cyan-700 dark:text-cyan-300/70 mb-3">
                  Can't find what you're looking for?
                </p>
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-2 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                >
                  <span>hello@logbook.zone</span>
                  {emailCopied ? (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile navigation */}
          <div className="lg:hidden mb-6 w-full">
            <select
              value={activeSlug}
              onChange={(e) => setActiveSlug(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {/* Breadcrumb & meta */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 min-w-0">
                <span className="flex-shrink-0">Docs</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 dark:text-white truncate">{activeDoc.title}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readingTime} min read
                </span>
              </div>
            </div>

            {/* Article */}
            <article className="docs-article">
              <div
                className="docs-content"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            </article>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-white/[0.06]">
              {prevDoc ? (
                <button
                  onClick={() => {
                    setActiveSlug(prevDoc.slug);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group flex flex-col items-start gap-1 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition sm:max-w-[45%] border border-gray-100 dark:border-white/[0.04] sm:border-transparent"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate w-full">
                    {prevDoc.title}
                  </span>
                </button>
              ) : <div className="hidden sm:block" />}

              {nextDoc ? (
                <button
                  onClick={() => {
                    setActiveSlug(nextDoc.slug);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group flex flex-col items-end gap-1 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition sm:max-w-[45%] border border-gray-100 dark:border-white/[0.04] sm:border-transparent sm:ml-auto"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    Next
                    <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate w-full text-right">
                    {nextDoc.title}
                  </span>
                </button>
              ) : <div className="hidden sm:block" />}
            </div>
          </main>

          {/* Right Sidebar - Table of Contents */}
          <aside className="w-36 flex-shrink-0 hidden xl:block">
            <div className="sticky top-24">
              {headings.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    On this page
                  </h4>
                  <nav className="space-y-1">
                    {headings.map(heading => (
                      <button
                        key={heading.id}
                        onClick={() => {
                          const el = document.getElementById(heading.id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`block text-left w-full text-sm py-1.5 transition-colors duration-200 ${
                          heading.level === 3 ? 'pl-4' : ''
                        } ${
                          activeHeading === heading.id
                            ? 'text-cyan-600 dark:text-cyan-400 font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {heading.text}
                      </button>
                    ))}
                  </nav>
                </>
              )}

              {/* Quick links */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/[0.06]">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Resources
                </h4>
                <div className="space-y-2">
                  <a
                    href="https://github.com/logbook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </a>
                  <a
                    href="https://suiscan.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Block Explorer
                  </a>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
