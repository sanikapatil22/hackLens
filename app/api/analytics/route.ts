import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { query } from '@/lib/server/db';
import { logApi } from '@/lib/server/logger';
import { ensureUserExists } from '@/lib/services/user-service';

type Trend = 'improving' | 'declining' | 'stable';

function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((correct / total) * 100);
}

function getRecentTrend(attempts: Array<{ is_correct: boolean }>): Trend {
  if (attempts.length < 10) {
    return 'stable';
  }

  const lastFive = attempts.slice(0, 5);
  const previousFive = attempts.slice(5, 10);

  const lastFiveCorrect = lastFive.filter((row) => row.is_correct).length;
  const previousFiveCorrect = previousFive.filter((row) => row.is_correct).length;

  const lastFiveAccuracy = calculateAccuracy(lastFiveCorrect, lastFive.length);
  const previousFiveAccuracy = calculateAccuracy(previousFiveCorrect, previousFive.length);

  if (lastFiveAccuracy > previousFiveAccuracy) {
    return 'improving';
  }

  if (lastFiveAccuracy < previousFiveAccuracy) {
    return 'declining';
  }

  return 'stable';
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logApi('/api/analytics', 'error', { error: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const internalUserId = await ensureUserExists(clerkId);

    const totalsResult = await query(
      `
        SELECT total_attempts, correct_attempts
        FROM user_stats
        WHERE user_id = $1
      `,
      [internalUserId]
    );

    const totals = totalsResult.rows[0] as { total_attempts: number; correct_attempts: number } | undefined;
    const totalAttempts = totals?.total_attempts ?? 0;
    const correctAttempts = totals?.correct_attempts ?? 0;
    const accuracy = calculateAccuracy(correctAttempts, totalAttempts);

    const weakAreasResult = await query(
      `
        SELECT
          scenario_type,
          COUNT(*)::int AS attempts,
          COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS correct
        FROM interactions
        WHERE user_id = $1
        GROUP BY scenario_type
      `,
      [internalUserId]
    );

    const weakAreas = (weakAreasResult.rows as Array<{ scenario_type: string; attempts: number; correct: number }>)
      .filter((row) => calculateAccuracy(row.correct, row.attempts) < 60)
      .map((row) => row.scenario_type);

    const recentInteractionsResult = await query(
      `
        SELECT is_correct
        FROM interactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `,
      [internalUserId]
    );

    const recentTrend = getRecentTrend(recentInteractionsResult.rows as Array<{ is_correct: boolean }>);

    logApi('/api/analytics', 'success', {
      userId: internalUserId,
      totalAttempts,
      recentTrend,
    });

    return NextResponse.json({
      success: true,
      data: {
        accuracy,
        totalAttempts,
        correctAttempts,
        weakAreas,
        recentTrend,
      },
    });
  } catch (error) {
    logApi('/api/analytics', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({
      success: true,
      fallback: true,
      source: 'server-error',
    });
  }
}
