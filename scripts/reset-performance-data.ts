import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetData() {
    console.log('🗑️  Starting data reset...');

    try {
        // Delete insights first (referencing other tables)
        console.log('   Deleting Ad Daily Insights...');
        await prisma.adDailyInsight.deleteMany({});

        console.log('   Deleting AdSet Daily Insights...');
        await prisma.adSetDailyInsight.deleteMany({});

        console.log('   Deleting Campaign Daily Insights...');
        await prisma.campaignDailyInsight.deleteMany({});

        console.log('   Deleting Account Daily Insights...');
        await prisma.dailyInsight.deleteMany({});

        // Delete entities
        console.log('   Deleting Ads...');
        await prisma.ad.deleteMany({});

        console.log('   Deleting AdSets...');
        await prisma.adSet.deleteMany({});

        console.log('   Deleting Campaigns...');
        await prisma.campaign.deleteMany({});

        console.log('✅ Data reset completed successfully.');
        console.log('   (Businesses and connections were preserved)');

    } catch (error) {
        console.error('❌ Error resetting data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetData();
