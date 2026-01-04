
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const insights = await prisma.dailyInsight.findMany({
        where: {
            leads: { gt: 0 }
        },
        orderBy: {
            date: 'desc'
        },
        take: 10,
        select: {
            date: true,
            leads: true,
            leads_whatsapp: true,
            leads_instagram: true,
            leads_messenger: true
        }
    });

    console.log('Recent Insights with Leads > 0:');
    console.table(insights);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
