'use client';

import { useState, useCallback } from 'react';

export function useCopyLink() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = useCallback(async (campaignId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const url = `${window.location.origin}/campaigns/${campaignId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(campaignId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const isCopied = useCallback((campaignId: string) => copiedId === campaignId, [copiedId]);

  return { copyLink, isCopied };
}
