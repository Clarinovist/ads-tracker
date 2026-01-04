
import { fetchAdAccountInsights } from '../src/lib/meta';
import fs from 'fs';
import path from 'path';

// Manually load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

// Mock fetchInsights to just return the response if needed, 
// but here we use the real function if we can export/import it.
// fetchAdAccountInsights wraps fetchInsights but hardcodes 'account' level.
// We need to call fetchInsights directly with breakdowns, but it's not exported nicely or requires args.
// I will copy-paste a fetch helper or try to import fetchInsights.
import { fetchInsights } from '../src/lib/meta';

async function debug() {
    // SekolahDesain
    const adAccountId = 'act_3242435579209132';
    // We need the token. I'll hardcode the one I can get or fetch from DB.
    // Ideally fetch from DB.

    const { PrismaClient } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PrismaPg({ connectionString: connectionString! });
    const prisma = new PrismaClient({ adapter });

    const business = await prisma.business.findFirst({
        where: { ad_account_id: adAccountId }
    });

    if (!business || !business.access_token) {
        console.error('No token found');
        return;
    }

    const token = business.access_token;
    const date = '2026-01-02';

    console.log(`Fetching breakdown for ${adAccountId} on ${date}`);

    // Test 3: Manual URL with action_breakdowns=action_destination
    console.log('\n--- TEST 3: Action Breakdowns ---');
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?time_range={'since':'${date}','until':'${date}'}&fields=spend,impressions,clicks,actions&access_token=${token}&level=account&action_breakdowns=action_destination`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Results Count:', data.data?.length);
        if (data.data && data.data.length > 0) {
            const r = data.data[0];
            console.log('All Actions:', JSON.stringify(r.actions, null, 2));
            // Check if action_destination exists in actions
            const hasDest = r.actions.some((a: any) => a.action_destination);
            console.log('Has action_destination in actions?', hasDest);
        } else {
            console.log('No data or error:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }

    await prisma.$disconnect();
}

debug();
