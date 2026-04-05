import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/server/db', () => ({
  query: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
}));

import { currentUser } from '@clerk/nextjs/server';
import { query } from '@/lib/server/db';
import { ensureUserExists, getUserStatsDB, logInteractionDB } from '@/lib/services/user-service';

const mockedQuery = vi.mocked(query);
const mockedCurrentUser = vi.mocked(currentUser);

describe('user-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('ensureUserExists creates new user when missing', async () => {
    mockedCurrentUser.mockResolvedValueOnce({
      firstName: 'Ada',
      lastName: 'Lovelace',
      emailAddresses: [{ emailAddress: 'ada@example.com' }],
    } as never);

    mockedQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] } as never);

    const result = await ensureUserExists('clerk_123');

    expect(result).toBe('user-1');
    expect(mockedQuery).toHaveBeenCalledTimes(2);
    expect(mockedQuery.mock.calls[1][0]).toContain('INSERT INTO users');
  });

  test('ensureUserExists returns existing user and updates missing metadata only', async () => {
    mockedCurrentUser.mockResolvedValueOnce({
      firstName: 'Grace',
      lastName: 'Hopper',
      emailAddresses: [{ emailAddress: 'grace@example.com' }],
    } as never);

    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-2', email: null, name: null }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    const result = await ensureUserExists('clerk_456');

    expect(result).toBe('user-2');
    expect(mockedQuery).toHaveBeenCalledTimes(2);
    expect(mockedQuery.mock.calls[1][0]).toContain('UPDATE users');
  });

  test('logInteractionDB inserts interaction and updates stats', async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    await logInteractionDB({
      userId: 'user-1',
      scenarioType: 'phishing',
      difficulty: 'easy',
      isCorrect: true,
      selectedAction: 'Report',
      correctAction: 'Report',
      redFlags: ['Urgent language'],
      timestamp: 1700000000000,
    });

    expect(mockedQuery).toHaveBeenCalledTimes(2);
    expect(mockedQuery.mock.calls[0][0]).toContain('INSERT INTO interactions');
    expect(mockedQuery.mock.calls[1][0]).toContain('INSERT INTO user_stats');
  });

  test('getUserStatsDB computes accuracy and weak areas correctly', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total_attempts: 10, correct_attempts: 4 }] } as never)
      .mockResolvedValueOnce({
        rows: [
          { scenario_type: 'phishing', attempts: 5, correct: 1 },
          { scenario_type: 'smishing', attempts: 5, correct: 4 },
        ],
      } as never)
      .mockResolvedValueOnce({ rows: [{ selected_action: 'Click link' }] } as never);

    const stats = await getUserStatsDB('user-1');

    expect(stats.totalAttempts).toBe(10);
    expect(stats.correctAttempts).toBe(4);
    expect(stats.accuracy).toBe(40);
    expect(stats.weakAreas).toContain('phishing');
    expect(stats.weakAreas).not.toContain('smishing');
    expect(stats.commonMistakes).toContain('Click link');
  });

  test('getUserStatsDB returns defaults for empty DB results', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [{ total_attempts: 0, correct_attempts: 0 }] } as never);

    const stats = await getUserStatsDB('user-empty');

    expect(stats.totalAttempts).toBe(0);
    expect(stats.correctAttempts).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(stats.weakAreas).toEqual([]);
  });
});
