'use client';

import { useState, useCallback } from 'react';

export function useCopyLink() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = useCallback(async (campaignId: string, e?: React.MouseEvent, password?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let url = `${window.location.origin}/campaigns/${campaignId}`;
    if (password) {
      url += `?key=${encodeURIComponent(password)}`;
    }
    await navigator.clipboard.writeText(url);
    setCopiedId(campaignId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const isCopied = useCallback((campaignId: string) => copiedId === campaignId, [copiedId]);

  return { copyLink, isCopied };
}
