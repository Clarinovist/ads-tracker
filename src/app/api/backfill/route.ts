import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAdAccountInsights } from '@/lib/meta';
import { startOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const { days = 7 } = await request.json();

        console.log(`🔄 Starting Historical Data Backfill for ${days} days...`);

        const businesses = await prisma.business.findMany({
            where: { is_active: true },
        });

        if (businesses.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No active businesses found'
            }, { status: 400 });
        }

        const today = new Date();
        const dates: Date[] = [];

        // Generate array of dates to fetch
        for (let i = 1; i <= days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date);
        }

        let totalSynced = 0;
        let totalFailed = 0;

        for (const business of businesses) {
            console.log(`🏢 Processing Business: ${business.name} (${business.ad_account_id})`);

            for (const date of dates) {
                const dateStr = date.toISOString().split('T')[0];

                // Normalize to start of day (midnight) to prevent duplicates
                const normalizedDate = startOfDay(new Date(dateStr));

                try {
                    console.log(`  📅 Fetching data for: ${dateStr}`);

                    if (!business.access_token) {
                        console.warn(`  ⚠️ Skipping ${dateStr} for ${business.name}: No access token found.`);
                        totalFailed++;
                        continue;
                    }

                    const insights = await fetchAdAccountInsights(business.ad_account_id, dateStr, business.access_token);

                    if (!insights) {
                        console.warn(`  ⚠️ No insights found for ${dateStr}`);
                        totalFailed++;
                        continue;
                    }

                    const spend = parseFloat(insights.spend || '0');
                    const impressions = parseInt(insights.impressions || '0');
                    const clicks = parseInt(insights.clicks || '0');
                    const reach = parseInt(insights.reach || '0');
                    const frequency = parseFloat(insights.frequency || '0');

                    const actions = insights.actions || [];
                    const leadsAction = actions.find(a => a.action_type === 'messaging_conversations' || a.action_type === 'lead');
                    const leads = leadsAction ? parseInt(leadsAction.value) : 0;

                    const videoViews = actions.find(a => a.action_type === 'video_view')?.value || '0';
                    const thruPlays = actions.find(a => a.action_type === 'video_thruplay')?.value || '0';

                    const hookRate = impressions > 0 ? (parseInt(videoViews) / impressions) * 100 : 0;
                    const holdRate = impressions > 0 ? (parseInt(thruPlays) / impressions) * 100 : 0;

                    const cpc = clicks > 0 ? spend / clicks : 0;
                    const cpl = leads > 0 ? spend / leads : 0;

                    await prisma.dailyInsight.upsert({
                        where: {
                            business_id_date: {
                                business_id: business.id,
                                date: normalizedDate,
                            },
                        },
                        update: {
                            spend,
                            impressions,
                            clicks,
                            reach,
                            frequency,
                            leads,
                            hook_rate: hookRate,
                            hold_rate: holdRate,
                            cpc,
                            cpl,
                        },
                        create: {
                            business_id: business.id,
                            date: normalizedDate,
                            spend,
                            impressions,
                            clicks,
                            reach,
                            frequency,
                            leads,
                            hook_rate: hookRate,
                            hold_rate: holdRate,
                            cpc,
                            cpl,
                        },
                    });

                    console.log(`  ✅ Synced ${dateStr} (Spend: ${spend}, Impressions: ${impressions})`);
                    totalSynced++;

                    // Add a small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 300));

                } catch (err) {
                    console.error(`  ❌ Failed to sync ${dateStr}:`, err);
                    totalFailed++;
                }
            }
        }

        console.log("🎉 Historical Data Backfill Completed!");

        return NextResponse.json({
            success: true,
            message: 'Backfill completed successfully',
            synced: totalSynced,
            failed: totalFailed
        });

    } catch (error) {
        console.error('❌ Critical Error in Backfill:', error);
        return NextResponse.json({
            success: false,
            error: 'Backfill failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
