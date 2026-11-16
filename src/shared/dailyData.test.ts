import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyShiftForDate,
  getRandomPracticeShift,
  calculateModRank,
  generateShareMarkdown,
  SHIFT_CATALOG,
} from './dailyData.ts';
import type { ShiftResult } from './types.ts';

test('daily shift generates deterministic and valid data with 15 sampled cards', () => {
  const date = '2026-11-14';
  const shift1 = getDailyShiftForDate(date);
  const shift2 = getDailyShiftForDate(date);

  assert.equal(shift1.subreddit, shift2.subreddit);
  assert.equal(shift1.cards.length, 15);
  assert.equal(shift1.rules.length, 3);
  assert.ok(shift1.cards.every((c) => ['approve', 'remove', 'ban'].includes(c.expectedAction)));
  // Deterministic order for same date
  assert.deepEqual(
    shift1.cards.map((c) => c.id),
    shift2.cards.map((c) => c.id)
  );
});

test('shift catalog dataset is huge with 5+ subreddits and 130+ cards', () => {
  assert.ok(SHIFT_CATALOG.length >= 5, 'Must have at least 5 subreddits');
  const totalCards = SHIFT_CATALOG.reduce((sum, s) => sum + s.cards.length, 0);
  assert.ok(totalCards >= 130, `Total dataset must be huge (>= 130 cards), found ${totalCards}`);

  for (const shift of SHIFT_CATALOG) {
    assert.ok(shift.cards.length >= 25, `Shift ${shift.subreddit} pool must be >= 25 cards, found ${shift.cards.length}`);
    assert.equal(shift.rules.length, 3, `Shift ${shift.subreddit} should have 3 rules`);

    const approveCount = shift.cards.filter((c) => c.expectedAction === 'approve').length;
    const removeCount = shift.cards.filter((c) => c.expectedAction === 'remove').length;
    const banCount = shift.cards.filter((c) => c.expectedAction === 'ban').length;

    assert.ok(approveCount >= 5, 'Must have at least 5 approve cards');
    assert.ok(removeCount >= 5, 'Must have at least 5 remove cards');
    assert.ok(banCount >= 3, 'Must have at least 3 ban cards');
  }
});

test('random practice shift generates randomized 15-card queue', () => {
  const practiceShift = getRandomPracticeShift();
  assert.equal(practiceShift.cards.length, 15);
  assert.equal(practiceShift.date, 'Practice');
  assert.ok(practiceShift.cards.some((c) => c.isTricky), 'Should contain tricky scenarios');
  assert.ok(practiceShift.cards.some((c) => c.expectedAction === 'approve'));
  assert.ok(practiceShift.cards.some((c) => c.expectedAction === 'remove'));
  assert.ok(practiceShift.cards.some((c) => c.expectedAction === 'ban'));
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

test('shift catalog contains challenging tricky scenarios with explanations', () => {
  for (const shift of SHIFT_CATALOG) {
    const trickyCards = shift.cards.filter((c) => c.isTricky);
    assert.ok(
      trickyCards.length >= 4,
      `Shift ${shift.subreddit} must have at least 4 tricky scenario cards, found ${trickyCards.length}`
    );
    for (const card of trickyCards) {
      assert.ok(card.trickExplanation && card.trickExplanation.length > 5);
    }
  }
});

