// Navigation history utility for smart back button behavior
// Saves the referrer URL when navigating to a page, so back button can return to the correct location

const NAVIGATION_KEY = 'logbook-nav-referrer';

export interface NavigationEntry {
  referrer: string;
  timestamp: number;
}

// Extract pathname from a path (removes query params)
function getPathname(path: string): string {
  const queryIndex = path.indexOf('?');
  return queryIndex >= 0 ? path.slice(0, queryIndex) : path;
}

// Save where the user came from before navigating
export function saveReferrer(targetPath: string): void {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname + window.location.search;

  // Don't save if we're on the same page
  if (currentPath === targetPath) return;

  const entry: NavigationEntry = {
    referrer: currentPath,
    timestamp: Date.now(),
  };

  // Store per-target-path (use pathname only as key to match getReferrer)
  const targetPathname = getPathname(targetPath);
  sessionStorage.setItem(`${NAVIGATION_KEY}:${targetPathname}`, JSON.stringify(entry));
}

// Get the referrer URL for the current page
export function getReferrer(fallback: string = '/'): string {
  if (typeof window === 'undefined') return fallback;

  const currentPath = window.location.pathname;
  const stored = sessionStorage.getItem(`${NAVIGATION_KEY}:${currentPath}`);

  if (!stored) return fallback;

  try {
    const entry: NavigationEntry = JSON.parse(stored);

    // Expire after 30 minutes
    if (Date.now() - entry.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem(`${NAVIGATION_KEY}:${currentPath}`);
      return fallback;
    }

    return entry.referrer;
  } catch {
    return fallback;
  }
}

// Clear referrer for current page (call after navigating back)
export function clearReferrer(): void {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  sessionStorage.removeItem(`${NAVIGATION_KEY}:${currentPath}`);
}

// Navigate to a page while saving the current location as referrer
export function navigateWithReferrer(router: { push: (path: string) => void }, targetPath: string): void {
  saveReferrer(targetPath);
  router.push(targetPath);
}
