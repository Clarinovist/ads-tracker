"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";

/**
 * BackgroundSync component - triggers a sync for today's data when the app loads.
 * This runs silently in the background without blocking the UI.
 * The SyncStatusIndicator will show the sync progress.
 */
export function BackgroundSync() {
    const syncTriggered = useRef(false);

    useEffect(() => {
        // Only trigger once per session
        if (syncTriggered.current) return;
        syncTriggered.current = true;

        const triggerBackgroundSync = async () => {
            try {
                const today = new Date();
                const dateStr = format(today, 'yyyy-MM-dd');

                console.log(`[BackgroundSync] Triggering background sync for today: ${dateStr}`);

                // Fire and forget - don't await
                fetch(`/api/sync?date=${dateStr}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => {
                    if (res.ok) {
                        console.log('[BackgroundSync] Today sync completed successfully');
                    } else {
                        console.warn('[BackgroundSync] Today sync returned non-ok status');
                    }
                }).catch(err => {
                    console.warn('[BackgroundSync] Today sync failed:', err.message);
                });
            } catch (error) {
                console.warn('[BackgroundSync] Failed to trigger sync:', error);
            }
        };

        // Delay sync slightly to not interfere with initial page load
        const timeoutId = setTimeout(triggerBackgroundSync, 2000);

        return () => clearTimeout(timeoutId);
    }, []);

    // This component doesn't render anything
    return null;
}
