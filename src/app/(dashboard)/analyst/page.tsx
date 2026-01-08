import { Suspense } from 'react';
import AgentView from '@/components/analyst/AgentView';

export const metadata = {
    title: 'AI Command Center | Ads Tracker',
    description: 'Pusat komando AI untuk analisa strategis bisnis',
};

export default function AnalystPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Suspense fallback={<div className="p-4">Loading analyst...</div>}>
                <AgentView />
            </Suspense>
        </div>
    );
}
