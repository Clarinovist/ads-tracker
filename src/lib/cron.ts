import cron from 'node-cron';
import { syncDailyInsights } from '@/services/dataSync';
import { prisma } from '@/lib/prisma';

export function initCron() {
    // Run at 01:00 AM daily
    cron.schedule('0 1 * * *', async () => {
        console.log('⏰ running daily sync cron');

        // Check if auto sync is enabled
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'auto_sync_enabled' }
        });

        // Default to true if not set
        const isEnabled = setting ? setting.value === 'true' : true;

        if (!isEnabled) {
            console.log('⏸️ Auto sync is disabled. Skipping daily sync.');
            return;
        }

        await syncDailyInsights();
    });
    console.log('✅ Daily sync cron scheduled for 01:00 AM');
}
