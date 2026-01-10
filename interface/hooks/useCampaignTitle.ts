import { useState, useEffect } from 'react';
import { getStoredPassword, decryptData } from '@/lib/crypto';

/**
 * Hook to get the display title for a campaign.
 * If the campaign is encrypted and user has the password, returns decrypted title.
 * Otherwise returns the original (possibly encrypted) title.
 */
export function useCampaignTitle(
  campaignId: string | undefined,
  encryptedTitle: string | undefined,
  isEncrypted: boolean | undefined,
  userAddress?: string | null
): string {
  const [displayTitle, setDisplayTitle] = useState<string>(encryptedTitle || '');

  useEffect(() => {
    // If no title or campaignId, return empty string
    if (!encryptedTitle || !campaignId) {
      setDisplayTitle('');
      return;
    }

    // If not encrypted, return title as-is
    if (!isEncrypted) {
      setDisplayTitle(encryptedTitle);
      return;
    }

    // If no user address, can't decrypt (no way to get password)
    if (!userAddress) {
      setDisplayTitle('Encrypted Campaign');
      return;
    }

    // Check if we're in browser environment (not SSR)
    if (typeof window === 'undefined') {
      setDisplayTitle('Encrypted Campaign');
      return;
    }

    // Try to decrypt
    const decrypt = async () => {
      try {
        // Check if password exists in localStorage
        const password = getStoredPassword(campaignId, userAddress);

        // If no password, show "Encrypted Campaign" instead of gibberish
        if (!password) {
          setDisplayTitle('Encrypted Campaign');
          return;
        }

        const decrypted = await decryptData(encryptedTitle, password);
        // Return decrypted title if successful, otherwise show "Encrypted Campaign"
        setDisplayTitle(decrypted || 'Encrypted Campaign');
      } catch (error) {
        // If decryption fails, show "Encrypted Campaign" instead of encrypted text
        console.error('Failed to decrypt campaign title:', error);
        setDisplayTitle('Encrypted Campaign');
      }
    };

    decrypt();
  }, [campaignId, encryptedTitle, isEncrypted, userAddress]);

  return displayTitle;
}
