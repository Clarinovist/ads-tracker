import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const history = await prisma.analysisHistory.findMany({
            orderBy: {
                created_at: 'desc',
            },
            take: 20,
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.analysisHistory.deleteMany({});
        return NextResponse.json({ message: 'History cleared successfully' });
    } catch (error) {
        console.error('Failed to clear history:', error);
        return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
    }
}
