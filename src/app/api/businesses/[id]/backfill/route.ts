import { NextRequest, NextResponse } from 'next/server';
import { backfillBusinessData } from '@/services/backfillBusiness';

/**
 * API endpoint to manually backfill data for a specific business
 * POST /api/businesses/:id/backfill
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { days = 30 } = await request.json().catch(() => ({}));

        const result = await backfillBusinessData(id, days);

        return NextResponse.json({
            ...result,
            message: `Backfilled ${result.synced} days for ${result.businessName}`,
        });
    } catch (error) {
        console.error('❌ Backfill Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Backfill failed',
        }, { status: 500 });
    }
}
