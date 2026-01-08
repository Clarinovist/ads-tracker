
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic since we might use current time etc.
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

interface HourlyInsight {
    spend: string;
    impressions: string;
    clicks: string;
    actions?: Array<{ action_type: string; value: string }>;
    date_start: string;
    hourly_stats_aggregated_by_advertiser_time_zone: string;
}

export async function POST(req: Request) {
    try {
        const { businessId, days } = await req.json().catch(() => ({}));

        // 1. Get Businesses to sync
        const businesses = await prisma.business.findMany({
            where: {
                is_active: true,
                ...(businessId ? { id: businessId } : {}),
                access_token: { not: null },
            }
        });

        if (businesses.length === 0) {
            return NextResponse.json({ success: false, message: 'No active businesses with tokens found.' });
        }

        let totalRecordsSynced = 0;
        const results = [];

        // 2. Iterate Businesses
        for (const business of businesses) {
            if (!business.access_token) continue;

            try {
                // Determine range
                const daysToSync = days || 1;
                const today = new Date();

                // Loop backwards for 'daysToSync'
                for (let i = 0; i < daysToSync; i++) {
                    const targetDate = new Date(today);
                    targetDate.setDate(today.getDate() - i);
                    const dateStr = targetDate.toISOString().split('T')[0];

                    // Fetch for specific day
                    const range = JSON.stringify({ since: dateStr, until: dateStr });

                    const url = `https://graph.facebook.com/v19.0/${business.ad_account_id}/insights?` +
                        `time_range=${range}&` +
                        `level=account&` +
                        `fields=spend,impressions,clicks,actions&` +
                        `breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&` +
                        `access_token=${business.access_token}&limit=24`;

                    const res = await fetch(url, { cache: 'no-store' });
                    const data = await res.json();

                    if (data.error) {
                        console.error(`Error syncing ${dateStr} for ${business.name}:`, data.error.message);
                        continue;
                    }

                    const records: HourlyInsight[] = data.data || [];
                    if (records.length > 0) {
                        await prisma.$transaction(
                            records.map(record => {
                                const hourStr = record.hourly_stats_aggregated_by_advertiser_time_zone.split(':')[0];
                                const hour = parseInt(hourStr, 10);
                                const spend = parseFloat(record.spend || '0');
                                const impressions = parseInt(record.impressions || '0', 10);
                                const clicks = parseInt(record.clicks || '0', 10);

                                const messagingAction = record.actions?.find(a =>
                                    a.action_type === 'onsite_conversion.messaging_welcome_message_view'
                                );
                                const messagingConversations = parseInt(messagingAction?.value || '0', 10);

                                return prisma.hourlyStat.upsert({
                                    where: {
                                        business_id_date_hour: {
                                            business_id: business.id,
                                            date: new Date(record.date_start),
                                            hour: hour
                                        }
                                    },
                                    create: {
                                        business_id: business.id,
                                        date: new Date(record.date_start),
                                        hour: hour,
                                        spend, impressions, clicks, messaging_conversations: messagingConversations
                                    },
                                    update: {
                                        spend, impressions, clicks, messaging_conversations: messagingConversations
                                    }
                                });
                            })
                        );
                        totalRecordsSynced += records.length;
                    }
                }

                results.push({ business: business.name });

            } catch (err: any) {
                console.error(`Failed to sync hourly for ${business.name}:`, err);
                results.push({ business: business.name, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Hourly sync complete',
            totalRecords: totalRecordsSynced,
            details: results
        });

    } catch (error: any) {
        console.error('Hourly Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Sync failed' }, { status: 500 });
    }
}
