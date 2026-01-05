'use client';

import { useState, useEffect } from 'react';
import { formatDateTime } from '@/lib/format-date';

interface ClientDateProps {
  dateString: string;
  prefix?: string;
}

/**
 * Client-only date component to avoid hydration mismatches.
 * Renders a placeholder on the server and the formatted date on the client.
 * Listens for date format changes and re-renders accordingly.
 */
export function ClientDate({ dateString, prefix }: ClientDateProps) {
  const [mounted, setMounted] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-render when date format changes
  useEffect(() => {
    const handleFormatChange = () => forceUpdate(n => n + 1);
    window.addEventListener('date-format-changed', handleFormatChange);
    return () => window.removeEventListener('date-format-changed', handleFormatChange);
  }, []);

  // Show nothing on server to avoid hydration mismatch
  if (!mounted) {
    return <span>{prefix}</span>;
  }

  return <span>{prefix}{formatDateTime(dateString)}</span>;
}
