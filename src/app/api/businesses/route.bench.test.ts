import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { backfillBusinessData } from '@/services/backfillBusiness';
import { after } from 'next/server';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/services/backfillBusiness', () => ({
  backfillBusinessData: vi.fn(),
}));

// Mock next/server
vi.mock('next/server', async () => {
    const actual = await vi.importActual<typeof import('next/server')>('next/server');
    return {
        ...actual,
        after: vi.fn((fn) => fn()), // Mock after to execute immediately (or just capture it)
        NextResponse: {
            ...actual.NextResponse,
            json: vi.fn((data, init) => ({
                status: init?.status || 200,
                json: async () => data,
            })),
        }
    };
});

describe('POST /api/businesses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return fast and trigger backfill via after', async () => {
    const mockBackfill = vi.mocked(backfillBusinessData);
    // Simulate a slow backfill
    mockBackfill.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        return { success: true, businessName: 'Test', synced: 10, failed: 0 };
    });

    const mockPrismaFindUnique = vi.mocked(prisma.business.findUnique);
    mockPrismaFindUnique.mockResolvedValue(null);

    const mockPrismaCreate = vi.mocked(prisma.business.create);
    mockPrismaCreate.mockResolvedValue({
      id: '123',
      name: 'Test Biz',
      ad_account_id: 'act_123',
      color_code: '#000000',
      access_token: 'token123',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const body = {
      name: 'Test Biz',
      ad_account_id: 'act_123',
      color_code: '#000000',
      access_token: 'token123',
    };

    const req = new Request('http://localhost/api/businesses', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Reset `after` mock implementation to just capture the callback
    const mockAfter = vi.mocked(after);
    let capturedCallback: (() => Promise<void>) | null = null;
    mockAfter.mockImplementation((fn: unknown) => {
        capturedCallback = fn as () => Promise<void>;
    });

    const start = performance.now();
    const res = await POST(req);
    const end = performance.now();
    const duration = end - start;

    expect(res.status).toBe(200);
    console.log(`Duration: ${duration}ms`);
    expect(duration).toBeLessThan(50); // Fast response

    // Verify after was called
    expect(mockAfter).toHaveBeenCalled();

    // Verify the callback passed to after calls backfill
    expect(mockBackfill).not.toHaveBeenCalled(); // Shouldn't be called yet if we didn't run the callback
    if (capturedCallback) {
        // @ts-expect-error - capturing callback strictly
        const result = capturedCallback();
        expect(result).toBeInstanceOf(Promise);
        await result;
        expect(mockBackfill).toHaveBeenCalledWith('123', 30);
    }
  });
});
