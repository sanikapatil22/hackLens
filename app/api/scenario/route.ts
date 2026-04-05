import { NextRequest, NextResponse } from 'next/server';

import { getScenario } from '@/lib/services/scenario-service';
import { logApi } from '@/lib/server/logger';
import { scenarioRequestSchema, scenarioResponseSchema } from '@/lib/validation/scenario-schema';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = scenarioRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid scenario request payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const scenario = await getScenario({
      params: parsed.data.params,
      mode: parsed.data.mode,
      adaptive: parsed.data.adaptive,
    });

    const validatedScenario = scenarioResponseSchema.safeParse(scenario);
    if (!validatedScenario.success) {
      logApi('/api/scenario', 'error', { error: 'Scenario response validation failed' });
      return NextResponse.json({ error: 'Internal error', fallback: true });
    }

    logApi('/api/scenario', 'success', {
      source: validatedScenario.data.meta.source,
      type: validatedScenario.data.type,
      difficulty: validatedScenario.data.difficulty,
    });
    return NextResponse.json({ scenario: validatedScenario.data });
  } catch (error) {
    logApi('/api/scenario', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal error', fallback: true });
  }
}
