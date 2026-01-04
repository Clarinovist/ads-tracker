
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

async function run() {
    console.log('🚀 Loading environment and starting sync...');
    const { syncDailyInsights } = await import('../src/services/dataSync');
    await syncDailyInsights();
}

run();
