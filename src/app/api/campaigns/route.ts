import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (businessId) where.business_id = businessId;
    if (status) where.status = status;

    try {
        // 1. Fetch Campaigns (Lightweight)
        const campaigns = await prisma.campaign.findMany({
            where,
            include: {
                business: {
                    select: { name: true, color_code: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        if (campaigns.length === 0) {
            return NextResponse.json([]);
        }

        const campaignIds = campaigns.map(c => c.id);

        // 2. Fetch Aggregated Insights (Optimized)
        const dateFilter: Prisma.DateTimeFilter = {};
        if (startDateStr) {
            const [y, m, d] = startDateStr.split('-').map(Number);
            dateFilter.gte = startOfDay(new Date(y, m - 1, d));
        }
        if (endDateStr) {
            const [y, m, d] = endDateStr.split('-').map(Number);
            dateFilter.lte = endOfDay(new Date(y, m - 1, d));
        }

        const aggregates = await prisma.campaignDailyInsight.groupBy({
            by: ['campaign_id'],
            where: {
                campaign_id: { in: campaignIds },
                date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
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

        // Map aggregates for O(1) lookup
        const aggMap = new Map(aggregates.map(a => [a.campaign_id, a._sum]));

        // 3. Merge and Calculate Derived Metrics
        const campaignsWithAggregate = campaigns.map(camp => {
            const agg = aggMap.get(camp.id);

            const aggregate = {
                spend: agg?.spend || 0,
                impressions: agg?.impressions || 0,
                clicks: agg?.clicks || 0,
                leads: agg?.leads || 0,
                conversions: agg?.conversions || 0,
                revenue: agg?.revenue || 0,
            };

            // Derived aggregate metrics
            const ctr = aggregate.impressions > 0 ? (aggregate.clicks / aggregate.impressions) * 100 : 0;
            const cpc = aggregate.clicks > 0 ? aggregate.spend / aggregate.clicks : 0;
            const cpl = aggregate.leads > 0 ? aggregate.spend / aggregate.leads : 0;
            const roas = aggregate.spend > 0 ? aggregate.revenue / aggregate.spend : 0;

            return {
                ...camp,
                aggregate: {
                    ...aggregate,
                    ctr,
                    cpc,
                    cpl,
                    roas
                }
            };
        });

        return NextResponse.json(campaignsWithAggregate);
    } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}
