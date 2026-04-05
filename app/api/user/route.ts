import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logApi } from '@/lib/server/logger';

import {
  ensureUserExists,
  getUserStatsDB,
  logInteractionDB,
} from '@/lib/services/user-service';

function isValidInteractionPayload(value: unknown): value is {
  userId?: string;
  scenarioType: string;
  difficulty: string;
  isCorrect: boolean;
  selectedAction: string;
  correctAction: string;
  redFlags: string[];
  timestamp?: number;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.userId === undefined || typeof candidate.userId === 'string') &&
    typeof candidate.scenarioType === 'string' &&
    typeof candidate.difficulty === 'string' &&
    typeof candidate.isCorrect === 'boolean' &&
    typeof candidate.selectedAction === 'string' &&
    typeof candidate.correctAction === 'string' &&
    Array.isArray(candidate.redFlags) &&
    candidate.redFlags.every((flag) => typeof flag === 'string')
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: clerkId } = await auth();

    if (!isValidInteractionPayload(body)) {
      logApi('/api/user', 'error', { error: 'Invalid interaction payload', method: 'POST' });
      return NextResponse.json(
        { success: false, fallback: false, source: 'server-error', error: 'Invalid interaction payload' },
        { status: 400 }
      );
    }

    const effectiveUserId = clerkId
      ? await ensureUserExists(clerkId)
      : body.userId;

    if (!effectiveUserId) {
      logApi('/api/user', 'error', { error: 'Missing anonymous user ID', method: 'POST' });
      return NextResponse.json(
        { success: false, fallback: false, source: 'server-error', error: 'Missing anonymous user ID' },
        { status: 400 }
      );
    }

    try {
      await logInteractionDB({
        ...body,
        userId: effectiveUserId,
      });
      return NextResponse.json({
        success: true,
        fallback: false,
        source: 'db',
        authMode: clerkId ? 'clerk' : 'anonymous',
      });
    } catch (dbError) {
      logApi('/api/user', 'error', {
        method: 'POST',
        error: dbError instanceof Error ? dbError.message : 'DB write failed',
        fallback: true,
      });
      return NextResponse.json({
        success: true,
        fallback: true,
        source: 'client',
        authMode: clerkId ? 'clerk' : 'anonymous',
      });
    }
  } catch (error) {
    logApi('/api/user', 'error', {
      method: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({
      success: false,
      fallback: true,
      source: 'server-error',
      error: 'Internal error',
    });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logApi('/api/user', 'error', { error: 'Unauthorized', method: 'GET' });
      return NextResponse.json(
        { success: false, fallback: false, source: 'server-error', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const effectiveUserId = await ensureUserExists(clerkId);

    try {
      const stats = await getUserStatsDB(effectiveUserId);
      logApi('/api/user', 'success', { method: 'GET', source: 'db', userId: effectiveUserId });
      return NextResponse.json({
        success: true,
        fallback: false,
        source: 'db',
        authMode: 'clerk',
        stats,
      });
    } catch (dbError) {
      logApi('/api/user', 'error', {
        method: 'GET',
        error: dbError instanceof Error ? dbError.message : 'DB read failed',
        fallback: true,
      });
      return NextResponse.json({
        success: true,
        fallback: true,
        source: 'client',
        authMode: 'clerk',
        stats: null,
      });
    }
  } catch (error) {
    logApi('/api/user', 'error', {
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({
      success: false,
      fallback: true,
      source: 'server-error',
      error: 'Internal error',
    });
  }
}
