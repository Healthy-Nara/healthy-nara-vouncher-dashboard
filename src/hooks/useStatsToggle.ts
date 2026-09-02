import { useState, useCallback } from 'react';

/**
 * Hook to toggle overview/metric summary sections on table pages.
 * Remembers the user's collapse/expand preference in localStorage.
 */
export function useStatsToggle(pageKey: string, defaultOpen = true) {
  const [showStats, setShowStats] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`hn_show_stats_${pageKey}`);
      return saved !== null ? saved === 'true' : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const toggleStats = useCallback(() => {
    setShowStats((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`hn_show_stats_${pageKey}`, String(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  }, [pageKey]);

  return [showStats, toggleStats] as const;
}
