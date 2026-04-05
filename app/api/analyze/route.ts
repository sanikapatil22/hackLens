import { NextRequest, NextResponse } from 'next/server';

import { performLightweightAnalysis } from '@/lib/services/analysis-service';
import { logApi } from '@/lib/server/logger';
import { analysisRequestSchema } from '@/lib/validation/analysis-schema';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = analysisRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const analysis = await performLightweightAnalysis(parsed.data.url);
    logApi('/api/analyze', 'success', { source: 'service' });
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze website';
    const status = message.toLowerCase().includes('invalid') || message.toLowerCase().includes('could not reach') ? 400 : 500;
    logApi('/api/analyze', 'error', { error: message, status });
    if (status === 400) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal error', fallback: true });
  }
}
