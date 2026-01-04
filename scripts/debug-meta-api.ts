import { fetchAdAccountInsights } from '../src/lib/meta';

/**
 * Debug script to see what Meta API actually returns
 */
async function debugMetaResponse() {
    const adAccountId = 'act_203972264282201'; // Ceritakita-studio
    const date = '2026-01-01'; // Recent date
    const token = process.argv[2] || '';

    if (!token) {
        console.error('Please provide an access token as an argument');
        process.exit(1);
    }

    console.log('Fetching insights for:', adAccountId, 'on', date);

    try {
        const insights = await fetchAdAccountInsights(adAccountId, date, token);

        console.log('\n=== FULL META API RESPONSE ===');
        console.log(JSON.stringify(insights, null, 2));

        if (insights?.actions) {
            console.log('\n=== ACTIONS BREAKDOWN ===');
            insights.actions.forEach((action: any) => {
                console.log(`Type: ${action.action_type}, Value: ${action.value}`);
            });
        } else {
            console.log('\n⚠️ No actions in response');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugMetaResponse();
