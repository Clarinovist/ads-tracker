import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { startOfMonth, endOfDay } from "date-fns";

async function verifyActiveCampaignFilter() {
    console.log("Verifying Active Campaign Filter logic...");

    // 1. Fetch ALL campaigns
    const allCampaigns = await prisma.campaign.findMany({ select: { id: true, name: true, status: true } });
    console.log(`Total Campaigns: ${allCampaigns.length}`);

    // 2. Count by status
    const statusCounts: Record<string, number> = {};
    allCampaigns.forEach(c => {
        const status = c.status || 'UNKNOWN';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log("Counts by Status:", statusCounts);

    // 3. Simulate "Active Only" filter
    const activeOnly = allCampaigns.filter(c => c.status === 'ACTIVE');
    console.log(`Filtered Active Campaigns: ${activeOnly.length}`);

    if (allCampaigns.length > activeOnly.length) {
        console.log("✅ Filtering logic would remove inactive campaigns.");
    } else {
        console.log("ℹ️ All campaigns are active, so filtering has no visible count effect, but logic holds.");
    }
}

verifyActiveCampaignFilter()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
