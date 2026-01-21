
import { prisma } from "../src/lib/prisma";
import { startOfDay, subDays } from "date-fns";

async function main() {
    console.log("🚀 Starting Benchmark...");

    // 1. Setup Data
    const businessId = "benchmark-business-" + Date.now();
    const campaignsCount = 1000;
    const daysCount = 30;

    console.log(`Creating Business: ${businessId}`);
    await prisma.business.create({
        data: {
            id: businessId,
            name: "Benchmark Business",
            ad_account_id: "act_" + Date.now(),
            color_code: "blue",
        }
    });

    console.log(`Creating ${campaignsCount} campaigns with ${daysCount} days of insights each...`);

    const campaignsData = [];
    const insightsData = [];

    const now = new Date();

    for (let i = 0; i < campaignsCount; i++) {
        const campaignId = `cmp_${i}_${Date.now()}`;
        campaignsData.push({
            id: campaignId,
            business_id: businessId,
            name: `Campaign ${i}`,
            status: "ACTIVE"
        });

        for (let d = 0; d < daysCount; d++) {
            insightsData.push({
                campaign_id: campaignId,
                date: startOfDay(subDays(now, d)),
                spend: Math.random() * 100,
                impressions: Math.floor(Math.random() * 1000),
                clicks: Math.floor(Math.random() * 50),
                leads: Math.floor(Math.random() * 5),
                revenue: Math.random() * 200,
            });
        }
    }

    // Bulk insert campaigns
    // Prisma createMany is supported
    await prisma.campaign.createMany({
        data: campaignsData
    });

    // Bulk insert insights
    // Chunking to avoid parameter limit
    const chunkSize = 5000;
    for (let i = 0; i < insightsData.length; i += chunkSize) {
        await prisma.campaignDailyInsight.createMany({
            data: insightsData.slice(i, i + chunkSize)
        });
    }

    console.log("✅ Data Seeded.");

    // 2. Measure "Slow" Method (Current Implementation)
    console.log("⏱️ Measuring Current Implementation...");
    const startSlow = performance.now();

    // Simulating the API logic
    const campaigns = await prisma.campaign.findMany({
        where: { business_id: businessId },
        include: {
            // business: { select: { name: true, color_code: true } }, // Skipping business include for fairer comparison of just aggregation
            insights: {
                // where: { date: ... } // simulating no date filter or full range
                orderBy: { date: 'asc' }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    const aggregatedSlow = campaigns.map(camp => {
        const aggregate = camp.insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
            conversions: acc.conversions + curr.conversions,
            revenue: acc.revenue + curr.revenue,
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 });

        return { ...camp, aggregate };
    });
    console.log(`Processed ${aggregatedSlow.length} records.`);

    const endSlow = performance.now();
    console.log(`🐢 Current Implementation took: ${(endSlow - startSlow).toFixed(2)}ms`);


    // 3. Measure "Fast" Method (Optimized)
    console.log("⏱️ Measuring Optimized Implementation...");
    const startFast = performance.now();

    // Fetch campaigns
    const campaignsFast = await prisma.campaign.findMany({
        where: { business_id: businessId },
        orderBy: { created_at: 'desc' }
    });

    // Fetch aggregates grouped by campaign_id
    const aggregates = await prisma.campaignDailyInsight.groupBy({
        by: ['campaign_id'],
        where: {
            campaign_id: { in: campaignsFast.map(c => c.id) }
            // Date filter would go here
        },
        _sum: {
            spend: true,
            impressions: true,
            clicks: true,
            leads: true,
            conversions: true,
            revenue: true,
        }
    });

    // Map aggregates to a dictionary for O(1) access
    const aggMap = new Map(aggregates.map(a => [a.campaign_id, a._sum]));

    const aggregatedFast = campaignsFast.map(camp => {
        const agg = aggMap.get(camp.id);
        const safeAgg = {
            spend: agg?.spend || 0,
            impressions: agg?.impressions || 0,
            clicks: agg?.clicks || 0,
            leads: agg?.leads || 0,
            conversions: agg?.conversions || 0,
            revenue: agg?.revenue || 0,
        };
         return { ...camp, aggregate: safeAgg };
    });
    console.log(`Processed ${aggregatedFast.length} records.`);

    const endFast = performance.now();
    console.log(`🐇 Optimized Implementation took: ${(endFast - startFast).toFixed(2)}ms`);

    console.log(`Improvement: ${((endSlow - startSlow) / (endFast - startFast)).toFixed(1)}x faster`);

    // 4. Cleanup
    console.log("🧹 Cleaning up...");
    await prisma.business.delete({ where: { id: businessId } });
    console.log("✅ Cleanup done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
