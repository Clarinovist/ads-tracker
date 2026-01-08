
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("--- Checking Available Hourly Data ---");

    const stats = await prisma.hourlyStat.groupBy({
        by: ['date'],
        _sum: {
            messaging_conversations: true
        },
        orderBy: {
            date: 'desc'
        }
    });

    console.log("Available Dates in DB:");
    stats.forEach(s => {
        console.log(`Date: ${s.date.toISOString()} | Total Conversations: ${s._sum.messaging_conversations}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
