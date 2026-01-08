
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Increased to 60s

export async function POST(req: Request) {
    try {
        const { messages, from, to, provider = 'openrouter', modelName, language = 'id', conversationId } = await req.json();

        console.log('--- Chat Analysis Call ---');
        console.log('From:', from, 'To:', to);
        console.log('Provider:', provider, 'Model Name Request:', modelName);

        if (!from || !to) {
            return NextResponse.json({ error: 'Date range is required for context.' }, { status: 400 });
        }

        // 1. Fetch Data (Context)
        const insights = await prisma.dailyInsight.findMany({
            where: {
                date: {
                    gte: new Date(from),
                    lte: new Date(to),
                },
            },
            orderBy: {
                date: 'asc',
            },
        });

        // 2. Aggregate Data
        const totals = insights.reduce(
            (acc, day) => ({
                spend: acc.spend + day.spend,
                impressions: acc.impressions + day.impressions,
                clicks: acc.clicks + day.clicks,
                leads: acc.leads + day.leads,
                conversions: acc.conversions + day.conversions,
            }),
            { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0 }
        );

        const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
        const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;

        // 3. Provider & Model Selection
        let model;

        // Resolve model ID from Environment Variables
        let targetModelId = process.env.AI_MODEL_GEMINI; // Default fallback
        if (modelName === 'gemini') targetModelId = process.env.AI_MODEL_GEMINI;
        else if (modelName === 'claude') targetModelId = process.env.AI_MODEL_CLAUDE;
        else if (modelName === 'gpt') targetModelId = process.env.AI_MODEL_GPT;

        // Fallback defaults
        if (!targetModelId) {
            if (modelName === 'claude') targetModelId = 'anthropic/claude-3-opus';
            else if (modelName === 'gpt') targetModelId = 'openai/gpt-4o';
            else targetModelId = 'google/gemini-2.0-flash-exp';
        }

        if (provider === 'openrouter') {
            if (!process.env.OPENROUTER_API_KEY) throw new Error('OpenRouter API Key missing');
            const openrouter = createOpenAICompatible({
                name: 'openrouter',
                apiKey: process.env.OPENROUTER_API_KEY,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            model = openrouter(targetModelId || 'google/gemini-2.0-flash-exp');
        } else {
            if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('Gemini API Key missing');
            const google = createGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            model = google(targetModelId?.split('/')[1] || 'gemini-1.5-pro-latest');
        }

        // 4. System Prompt Construction
        const languageInstruction = language === 'id'
            ? "PENTING: Jawablah dalam Bahasa Indonesia yang profesional, format yang rapi (gunakan Heading, Bullet points, Bold), dan mudah dipahami."
            : "IMPORTANT: Respond in professional English, use clear formatting (Headings, Bullets, Bold).";

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
        };

        const systemPrompt = `
      You are an expert Data Analyst for an advertising agency.
      ${languageInstruction}
      
      CONTEXT DATA (Period: ${from} to ${to}):
      - Total Spend: ${formatCurrency(totals.spend)}
      - Impressions: ${totals.impressions}
      - Clicks: ${totals.clicks} (CTR: ${totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0}%)
      - Leads: ${totals.leads}
      - Conversions: ${totals.conversions}
      - CPA: ${formatCurrency(cpa)}
      - CPL: ${formatCurrency(cpl)}

      Daily Data Sample (First 5 & Last 5 days):
      ${JSON.stringify(insights.slice(0, 5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}
      ...
      ${JSON.stringify(insights.slice(-5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}

      INSTRUCTIONS:
      - Start with a clear "Executive Summary".
      - Use **Bold** for important numbers.
      - Use Bullet points for lists.
      - If asked follow-up questions, use the Context Data above to answer accurately.
    `;

        // 5. Stream Chat
        // Sanitize messages
        const sanitizedMessages = messages.map((m: any) => {
            let content = '';
            if (typeof m.content === 'string') {
                content = m.content;
            } else if (Array.isArray(m.content)) {
                content = m.content.map((c: any) => c.text || JSON.stringify(c)).join('');
            } else {
                content = JSON.stringify(m.content) || '';
            }
            return {
                role: m.role,
                content: content
            };
        });

        console.log('Sanitized Messages Payload:', JSON.stringify(sanitizedMessages, null, 2));

        // 5. Stream Chat
        const result = await streamText({
            model,
            system: systemPrompt,
            messages: sanitizedMessages, // Pass the full conversation history, sanitized to ensure string content
            onFinish: async ({ text }) => {
                // Save conversation to history
                try {
                    // We only save the response if it seems like an analysis (length > 50 chars)
                    if (text.length > 50) {
                        try {
                            // Find the first user message for prompt
                            const firstUserMessage = sanitizedMessages.find((m: any) => m.role === 'user');
                            // Build full conversation including this response
                            const fullConversation = [
                                ...sanitizedMessages,
                                { role: 'assistant', content: text }
                            ];


                            if (conversationId) {
                                // Upsert: create if not exists, update if exists
                                await prisma.analysisHistory.upsert({
                                    where: { id: conversationId },
                                    update: {
                                        response: text,
                                        messages: fullConversation,
                                    },
                                    create: {
                                        id: conversationId,
                                        prompt: firstUserMessage?.content?.substring(0, 200) || 'No prompt',
                                        response: text,
                                        messages: fullConversation,
                                        provider,
                                        model: targetModelId || 'unknown',
                                        date_from: new Date(from),
                                        date_to: new Date(to),
                                    }
                                });
                            } else {
                                // Create new conversation without ID
                                await prisma.analysisHistory.create({
                                    data: {
                                        prompt: firstUserMessage?.content?.substring(0, 200) || 'No prompt',
                                        response: text,
                                        messages: fullConversation,
                                        provider,
                                        model: targetModelId || 'unknown',
                                        date_from: new Date(from),
                                        date_to: new Date(to),
                                    }
                                });
                            }
                        } catch (innerDbError) {
                            console.error('Failed to save analysis history record:', innerDbError);
                        }
                    }
                } catch (dbError) {
                    console.error('Failed to save history (outer):', dbError);
                }
            },
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json({ error: error.message || 'Analysis failed.' }, { status: 500 });
    }
}
