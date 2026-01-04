
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

async function verify() {
    console.log('🔍 Verifying DB records for today...');
    const today = new Date().toISOString().split('T')[0];

    const insights = await prisma.dailyInsight.findMany({
        where: {
            // Query for records that might have been updated recently or just all for today
            date: { gte: new Date(today) }
        },
        include: { business: true }
    });

    console.log(`Found ${insights.length} insights for today.`);

    insights.forEach(i => {
        console.log(`Business: ${i.business.name}`);
        console.log(`  Total Leads: ${i.leads}`);
        console.log(`  WhatsApp: ${i.leads_whatsapp}`);
        console.log(`  Instagram: ${i.leads_instagram}`);
        console.log(`  Messenger: ${i.leads_messenger}`);
    });

    await prisma.$disconnect();
}

verify();
