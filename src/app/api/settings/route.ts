import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch the auto_sync_enabled setting
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'auto_sync_enabled' }
        });

        // Default to true if not set
        const autoSyncEnabled = setting ? setting.value === 'true' : true;

        return NextResponse.json({ auto_sync_enabled: autoSyncEnabled });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { auto_sync_enabled } = body;

        if (typeof auto_sync_enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'auto_sync_enabled must be a boolean' },
                { status: 400 }
            );
        }

        // Upsert the setting
        await prisma.systemSettings.upsert({
            where: { key: 'auto_sync_enabled' },
            update: { value: String(auto_sync_enabled) },
            create: { key: 'auto_sync_enabled', value: String(auto_sync_enabled) }
        });

        return NextResponse.json({ success: true, auto_sync_enabled });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
