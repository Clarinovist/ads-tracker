"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";

export interface CampaignRow {
    id: string;
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    leads_whatsapp: number;
    leads_instagram: number;
    leads_messenger: number;
}

interface CampaignsTableProps {
    campaigns: CampaignRow[];
}

type SortKey = 'name' | 'spend' | 'impressions' | 'cpm' | 'clicks' | 'ctr' | 'leads' | 'cpc' | 'cpl';

export default function CampaignsTable({ campaigns }: CampaignsTableProps) {
    // 1. Filter Active Only (Safeguard) + Spend > 0 (Actually Running)
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' && c.spend > 0);

    const [sortKey, setSortKey] = useState<SortKey>('spend');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    if (activeCampaigns.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance (Active)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        No active campaigns found.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to descending for numbers usually
        }
    };

    // Calculate derived metrics for sorting
    const processed = activeCampaigns.map(row => {
        const cpm = row.impressions > 0 ? (row.spend / row.impressions) * 1000 : 0;
        const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
        const cpl = row.leads > 0 ? row.spend / row.leads : 0;
        const cpc = row.clicks > 0 ? row.spend / row.clicks : 0;
        return { ...row, cpm, ctr, cpl, cpc };
    });

    const sorted = [...processed].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // numeric sort
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    const SortIcon = () => <ArrowUpDown className="ml-2 h-4 w-4" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Campaign Performance (Active)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('name')}>
                                    Campaign Name <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('spend')}>
                                    Spend <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('impressions')}>
                                    Impr. <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('cpm')}>
                                    CPM <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('clicks')}>
                                    Clicks <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('ctr')}>
                                    CTR <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('leads')}>
                                    Leads <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('cpc')}>
                                    CPC <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('cpl')}>
                                    CPL <SortIcon />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                        {row.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.spend)}
                                </TableCell>
                                <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.impressions)}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpm)}
                                </TableCell>
                                <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.clicks)}</TableCell>
                                <TableCell className="text-right">{row.ctr.toFixed(2)}%</TableCell>
                                <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.leads)}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpc)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {row.cpl > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpl) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
