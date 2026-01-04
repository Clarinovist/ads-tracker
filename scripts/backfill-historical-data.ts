import dotenv from 'dotenv';
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { syncBusinessData } from "../src/services/dataSync";

/**
 * Script to backfill historical data for all active businesses
 * Usage: npx tsx scripts/backfill-historical-data.ts [days]
 * Example: npx tsx scripts/backfill-historical-data.ts 30
 */

async function backfillHistoricalData(daysBack: number = 30) {
    console.log(`🔄 Starting Historical Data Backfill for ${daysBack} days...`);

    try {
        const businesses = await prisma.business.findMany({
            where: { is_active: true },
        });

        if (businesses.length === 0) {
            console.log("⚠️ No active businesses found.");
            return;
        }

        const today = new Date();
        const dates: Date[] = [];

        // Generate array of dates to fetch
        for (let i = 1; i <= daysBack; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date);
        }

        console.log(`📅 Will fetch data for ${dates.length} days`);

        for (const business of businesses) {
            console.log(`\n🏢 Processing Business: ${business.name} (${business.ad_account_id})`);

            for (const date of dates) {
                const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                try {
                    console.log(`  📅 Fetching data for: ${dateStr}`);
                    await syncBusinessData(business, date);
                    // Add a small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 300));

                } catch (err) {
                    console.error(`  ❌ Failed to sync ${dateStr}:`, err);
                }
            }
            console.log(`✅ Completed backfill for ${business.name}`);
        }

        console.log("\n🎉 Historical Data Backfill Completed!");

    } catch (error) {
        console.error("❌ Critical Error in Backfill:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get days from command line argument or default to 30
const daysBack = parseInt(process.argv[2]) || 30;
backfillHistoricalData(daysBack);
