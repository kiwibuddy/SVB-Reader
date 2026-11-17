/**
 * Every query's bound values must match its placeholders. The testament
 * progress queries bound their book list twice, so SQLite refused them
 * (error 25, out of range) and the You tab always showed 0 read.
 */
const mockCalls: { sql: string; params: unknown[] }[] = [];
const mockDb = {
  getFirstAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
    mockCalls.push({ sql, params });
    const placeholders = (sql.match(/\?/g) || []).length;
    if (placeholders !== params.length) throw new Error('Error code 25: column index out of range');
    return { count: 7 };
  }),
};
jest.mock('./database-manager', () => ({ databaseManager: { getDatabase: () => mockDb } }));

import { getNewTestamentProgress, getOldTestamentProgress } from './sqlite';

beforeEach(() => {
  mockCalls.length = 0;
});

test.each([
  ['Old', getOldTestamentProgress],
  ['New', getNewTestamentProgress],
])('%s Testament progress binds one value per placeholder', async (_name, fn) => {
  await expect(fn()).resolves.toEqual({ completed: 7, total: 7 });
  expect(mockCalls).toHaveLength(2);
});
