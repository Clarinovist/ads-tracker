"use client";

import { useEffect, useState } from "react";
import { MetricsCard } from "@/components/MetricsCard";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
    Users,
    TrendingUp,
    DollarSign,
} from "lucide-react";
import { startOfMonth, endOfDay } from "date-fns";
import { Suspense } from "react";
import CampaignsTable, { CampaignRow } from "@/components/CampaignsTable";

function CampaignsContent() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date())
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = dateRange.from?.toISOString();
            const end = dateRange.to?.toISOString();
            const res = await fetch(`/api/campaigns?startDate=${start}&endDate=${end}`);
            const data = await res.json();
            setCampaigns(data);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    // FILTER ACTIVE ONLY
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');

    const totals = activeCampaigns.reduce((acc, camp) => ({
        spend: acc.spend + camp.aggregate.spend,
        leads: acc.leads + camp.aggregate.leads,
        revenue: acc.revenue + camp.aggregate.revenue,
        impressions: acc.impressions + camp.aggregate.impressions,
    }), { spend: 0, leads: 0, revenue: 0, impressions: 0 });

    const avgRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

    // Transform to CampaignRow format
    const campaignRows: CampaignRow[] = activeCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        spend: c.aggregate.spend,
        impressions: c.aggregate.impressions,
        clicks: c.aggregate.clicks || 0,
        leads: c.aggregate.leads,
        leads_whatsapp: c.aggregate.leads_whatsapp || 0,
        leads_instagram: c.aggregate.leads_instagram || 0,
        leads_messenger: c.aggregate.leads_messenger || 0,
    }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Active Campaigns</h2>
                    <p className="text-slate-500">Analyze performance across all active Meta campaigns.</p>
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange as any} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard
                    title="Total Spend"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.spend)}
                    icon={DollarSign}
                />
                <MetricsCard
                    title="Total Leads"
                    value={totals.leads}
                    icon={Users}
                    iconColor="text-purple-500"
                />
                {/* 
                 * NOTE: User asked to remove ROAS from 'table', but KPIs might still benefit from it.
                 * However, to be consistent with 'removing ROAS', I will replace ROAS card with CPM here too
                 * or simply leave Revenue if useful. Let's swap ROAS card for CPM to match the theme.
                 */}
                <MetricsCard
                    title="Total Revenue"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.revenue)}
                    icon={TrendingUp}
                    iconColor="text-emerald-500"
                />
                {/* Replaced ROAS with CPM or just hidden. The user hates ROAS. Let's make it CPM. */}
                <MetricsCard
                    title="Avg CPM"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                        totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
                    )}
                    icon={TrendingUp}
                    iconColor="text-orange-500"
                    description="Cost per 1,000 impressions"
                />
            </div>

            <CampaignsTable campaigns={campaignRows} />
        </div>
    );
}

export default function CampaignsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading campaign reports...</div>}>
            <CampaignsContent />
        </Suspense>
    );
}
