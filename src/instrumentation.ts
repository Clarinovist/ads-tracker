export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only import and run cron in Node.js runtime (server side)
        const { initCron } = await import('@/lib/cron');
        initCron();
    }
}
