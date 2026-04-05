import { query } from "@/lib/server/db";
import type { UserStats } from "@/lib/ai/user-tracking";
import { currentUser } from "@clerk/nextjs/server";
import { log, logService } from "@/lib/server/logger";
import { computeUserProfile } from "@/lib/services/user-intelligence";

export type DBInteractionInput = {
  userId: string;
  scenarioType: string;
  difficulty: string;
  isCorrect: boolean;
  selectedAction: string;
  correctAction: string;
  redFlags: string[];
  timestamp?: number;
};

export interface UserServiceStatus {
  status: "placeholder" | "hybrid";
  storage: "client-local-storage" | "postgres+local-fallback";
  message: string;
}

export async function getUserServiceStatus(): Promise<UserServiceStatus> {
  return {
    status: "hybrid",
    storage: "postgres+local-fallback",
    message:
      "User interaction tracking supports PostgreSQL for identified users with localStorage fallback for anonymous sessions.",
  };
}

export async function ensureUserExists(clerkId: string): Promise<string> {
  try {
    logService("user-service", "ensureUserExists_start", { userId: clerkId });
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
    const fullName = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim();
    const name = fullName.length > 0 ? fullName : null;

    const existing = await query(
      `
        SELECT id, email, name
        FROM users
        WHERE clerk_id = $1
        LIMIT 1
      `,
      [clerkId]
    );

    const existingRow = existing.rows[0] as { id: string; email: string | null; name: string | null } | undefined;
    const existingId = existingRow?.id;
    if (existingId) {
      if ((!existingRow.email && email) || (!existingRow.name && name)) {
        await query(
          `
            UPDATE users
            SET
              email = COALESCE(email, $2),
              name = COALESCE(name, $3)
            WHERE id = $1
          `,
          [existingId, email, name]
        );
      }

      logService("user-service", "ensureUserExists_existing", { userId: clerkId });

      return existingId;
    }

    const inserted = await query(
      `
        INSERT INTO users (clerk_id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (clerk_id)
        DO UPDATE SET
          email = COALESCE(users.email, EXCLUDED.email),
          name = COALESCE(users.name, EXCLUDED.name)
        RETURNING id
      `,
      [clerkId, email, name]
    );

    const id = (inserted.rows[0] as { id: string } | undefined)?.id;
    if (!id) {
      throw new Error('Failed to resolve authenticated user record');
    }

    logService("user-service", "ensureUserExists_created", { userId: clerkId });

    return id;
  } catch (error) {
    log('error', 'service:user-service:ensureUserExists_error', {
      userId: clerkId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

function defaultStats(): UserStats {
  return {
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0,
    byType: {},
    commonMistakes: [],
    weakAreas: [],
  };
}

function calculateAccuracy(correct: number, attempts: number): number {
  if (attempts === 0) {
    return 0;
  }

  return Math.round((correct / attempts) * 100);
}

async function refreshUserIntelligenceProfile(userId: string): Promise<void> {
  const interactionsResult = await query(
    `
      SELECT scenario_type, is_correct, selected_action, correct_action
      FROM interactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 250
    `,
    [userId]
  );

  const interactions = (interactionsResult.rows as Array<{
    scenario_type: string;
    is_correct: boolean;
    selected_action: string | null;
    correct_action: string | null;
  }>).map((row) => ({
    scenarioType: row.scenario_type,
    isCorrect: row.is_correct,
    selectedAction: row.selected_action,
    correctAction: row.correct_action,
  }));

  const profile = computeUserProfile(interactions);

  await query(
    `
      UPDATE user_stats
      SET
        weak_areas = $2::jsonb,
        strengths = $3::jsonb,
        behavior_pattern = $4,
        avg_score = $5,
        updated_at = NOW()
      WHERE user_id = $1
    `,
    [
      userId,
      JSON.stringify(profile.weak_areas),
      JSON.stringify(profile.strengths),
      profile.behavior_pattern,
      profile.avg_score,
    ]
  );
}

export async function logInteractionDB(data: DBInteractionInput): Promise<void> {
  try {
    await query(
      `
        INSERT INTO interactions (
          user_id,
          scenario_type,
          difficulty,
          is_correct,
          selected_action,
          correct_action,
          red_flags,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TO_TIMESTAMP($8 / 1000.0))
      `,
      [
        data.userId,
        data.scenarioType,
        data.difficulty,
        data.isCorrect,
        data.selectedAction,
        data.correctAction,
        data.redFlags,
        data.timestamp ?? Date.now(),
      ]
    );

    await query(
      `
        INSERT INTO user_stats (user_id, total_attempts, correct_attempts, accuracy, updated_at)
        VALUES ($1, 1, CASE WHEN $2 THEN 1 ELSE 0 END, CASE WHEN $2 THEN 1.0 ELSE 0.0 END, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          total_attempts = user_stats.total_attempts + 1,
          correct_attempts = user_stats.correct_attempts + CASE WHEN $2 THEN 1 ELSE 0 END,
          accuracy =
            (user_stats.correct_attempts + CASE WHEN $2 THEN 1 ELSE 0 END)::float
            /
            (user_stats.total_attempts + 1),
          updated_at = NOW()
      `,
      [data.userId, data.isCorrect]
    );

    await refreshUserIntelligenceProfile(data.userId);

    logService("user-service", "interaction_logged", {
      userId: data.userId,
      type: data.scenarioType,
      correct: data.isCorrect,
    });
  } catch (error) {
    log('error', 'service:user-service:logInteractionDB_error', {
      userId: data.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function getUserStatsDB(userId: string): Promise<UserStats> {
  try {
    const statsResult = await query(
      `
        SELECT total_attempts, correct_attempts
        FROM user_stats
        WHERE user_id = $1
      `,
      [userId]
    );

    let totals = statsResult.rows[0] as { total_attempts: number; correct_attempts: number } | undefined;

    if (!totals) {
      const totalsResult = await query(
        `
          SELECT
            COUNT(*)::int AS total_attempts,
            COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS correct_attempts
          FROM interactions
          WHERE user_id = $1
        `,
        [userId]
      );

      totals = totalsResult.rows[0] as { total_attempts: number; correct_attempts: number };

      if (!totals || totals.total_attempts === 0) {
        return defaultStats();
      }

      await query(
        `
          INSERT INTO user_stats (user_id, total_attempts, correct_attempts, accuracy, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            total_attempts = EXCLUDED.total_attempts,
            correct_attempts = EXCLUDED.correct_attempts,
            accuracy = EXCLUDED.accuracy,
            updated_at = NOW()
        `,
        [
          userId,
          totals.total_attempts,
          totals.correct_attempts,
          totals.total_attempts === 0 ? 0 : totals.correct_attempts / totals.total_attempts,
        ]
      );
    }

    const byTypeResult = await query(
      `
        SELECT
          scenario_type,
          COUNT(*)::int AS attempts,
          COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS correct
        FROM interactions
        WHERE user_id = $1
        GROUP BY scenario_type
      `,
      [userId]
    );

    const mistakesResult = await query(
      `
        SELECT selected_action, COUNT(*)::int AS count
        FROM interactions
        WHERE user_id = $1 AND is_correct = FALSE
        GROUP BY selected_action
        ORDER BY count DESC
        LIMIT 3
      `,
      [userId]
    );

    const byType: UserStats["byType"] = {};
    const weakAreas: string[] = [];

    for (const row of byTypeResult.rows as Array<{ scenario_type: string; attempts: number; correct: number }>) {
      const accuracy = calculateAccuracy(row.correct, row.attempts);

      byType[row.scenario_type] = {
        attempts: row.attempts,
        correct: row.correct,
        accuracy,
      };

      if (accuracy < 60) {
        weakAreas.push(row.scenario_type);
      }
    }

    return {
      totalAttempts: totals.total_attempts,
      correctAttempts: totals.correct_attempts,
      accuracy: calculateAccuracy(totals.correct_attempts, totals.total_attempts),
      byType,
      commonMistakes: (mistakesResult.rows as Array<{ selected_action: string }>).map((row) => row.selected_action),
      weakAreas,
    };
  } catch (error) {
    log('error', 'service:user-service:getUserStatsDB_error', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
