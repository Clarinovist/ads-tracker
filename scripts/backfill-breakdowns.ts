
import 'dotenv/config';
import { syncDailyInsights } from '../src/services/dataSync';
import { subDays } from 'date-fns';

async function main() {
    const daysToBackfill = 7;
    console.log(`Starting backfill for the last ${daysToBackfill} days...`);

    for (let i = 0; i < daysToBackfill; i++) {
        const date = subDays(new Date(), i);
        console.log(`\n--- Backfilling for ${date.toISOString().split('T')[0]} ---`);
        await syncDailyInsights(date);
    }
}

main().catch(console.error);
