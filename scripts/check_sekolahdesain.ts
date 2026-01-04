
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString: connectionString! });
const prisma = new PrismaClient({ adapter });

async function checkHistory() {
    try {
        const business = await prisma.business.findFirst({
            where: { name: { contains: 'sekolahdesain', mode: 'insensitive' } }
        });

        if (!business || !business.access_token) {
            console.error('Business not found or no token');
            return;
        }

        console.log(`Checking history for ${business.name} (${business.ad_account_id})`);

        // Check last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            try {
                const insights = await fetchAdAccountInsights(business.ad_account_id, dateStr, business.access_token);
                console.log(`${dateStr}: ${insights ? `✅ Spend: ${insights.spend}` : '❌ No Data'}`);
            } catch (e: any) {
                console.error(`${dateStr}: Error ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHistory();
