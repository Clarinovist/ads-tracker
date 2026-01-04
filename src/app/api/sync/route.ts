import { NextResponse } from 'next/server';
import { syncDailyInsights } from '@/services/dataSync';

export async function POST() {
    try {
        console.log('Triggering manual sync...');
        // We don't await this if we want it to be async, but for manual trigger feedback it's better to await or return status.
        // Given it's a background sync usually, we maybe just trigger it.
        // But for "Fetch-and-Store", if the user clicks "Sync Now", they might want to know when it's done.
        await syncDailyInsights();

        return NextResponse.json({ success: true, message: 'Sync completed successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
