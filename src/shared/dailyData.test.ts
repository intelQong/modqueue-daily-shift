import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyShiftForDate,
  calculateModRank,
  generateShareMarkdown,
  SHIFT_CATALOG,
} from './dailyData.ts';
import type { ShiftResult } from './types.ts';

test('daily shift generates deterministic and valid data', () => {
  const date = '2026-11-14';
  const shift1 = getDailyShiftForDate(date);
  const shift2 = getDailyShiftForDate(date);

  assert.equal(shift1.subreddit, shift2.subreddit);
  assert.equal(shift1.cards.length, 15);
  assert.equal(shift1.rules.length, 3);
  assert.ok(shift1.cards.every((c) => ['approve', 'remove', 'ban'].includes(c.expectedAction)));
});

test('shift catalog subreddits have complete card sets', () => {
  for (const shift of SHIFT_CATALOG) {
    assert.equal(shift.cards.length, 15, `Shift ${shift.subreddit} should have 15 cards`);
    assert.equal(shift.rules.length, 3, `Shift ${shift.subreddit} should have 3 rules`);

    const approveCount = shift.cards.filter((c) => c.expectedAction === 'approve').length;
    const removeCount = shift.cards.filter((c) => c.expectedAction === 'remove').length;
    const banCount = shift.cards.filter((c) => c.expectedAction === 'ban').length;

    assert.ok(approveCount > 0, 'Must have approve cards');
    assert.ok(removeCount > 0, 'Must have remove cards');
    assert.ok(banCount > 0, 'Must have ban cards');
  }
});

test('calculateModRank returns appropriate titles', () => {
  assert.match(calculateModRank(100, 15), /Grand/);
  assert.match(calculateModRank(93, 14), /Senior/);
  assert.match(calculateModRank(80, 12), /Trusted/);
  assert.match(calculateModRank(66, 10), /Apprentice/);
  assert.match(calculateModRank(40, 6), /Probation/);
});

test('generateShareMarkdown outputs valid Reddit formatted spoiler string', () => {
  const mockResult: ShiftResult = {
    date: '2026-11-14',
    subreddit: 'r/AskGhosts',
    score: 1850,
    correctCount: 14,
    totalCount: 15,
    accuracy: 93,
    timeSeconds: 42,
    maxCombo: 6,
    rankTitle: '⭐ Senior Subreddit Janitor',
    streak: 5,
    decisions: [
      { cardId: '1', userAction: 'approve', expectedAction: 'approve', correct: true, timeSpentMs: 1200 },
      { cardId: '2', userAction: 'remove', expectedAction: 'remove', correct: true, timeSpentMs: 1100 },
      { cardId: '3', userAction: 'ban', expectedAction: 'ban', correct: true, timeSpentMs: 900 },
      { cardId: '4', userAction: 'approve', expectedAction: 'remove', correct: false, timeSpentMs: 1500 },
    ],
    shareMarkdown: '',
  };

  const md = generateShareMarkdown(mockResult);
  assert.ok(md.includes('ModQueue: Daily Shift'));
  assert.ok(md.includes('r/AskGhosts'));
  assert.ok(md.includes('93%'));
  assert.ok(md.includes('5 Days'));
  assert.ok(md.includes('🟩🟩🔨🟥'));
});
