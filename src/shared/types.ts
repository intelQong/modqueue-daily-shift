export type Verdict = 'approve' | 'remove' | 'ban';

export type PostCard = {
  id: string;
  author: string;
  accountAgeDays: number;
  karma: number;
  userFlair?: string;
  flairColor?: string;
  avatarSeed: string;
  title: string;
  body: string;
  tag?: string;
  expectedAction: Verdict;
  violationReason?: string;
  explanation: string;
};

export type AutoModRule = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type DailyShift = {
  date: string; // YYYY-MM-DD
  subreddit: string;
  tagline: string;
  subscribers: string;
  mascot: string;
  themeColor: string;
  rules: AutoModRule[];
  cards: PostCard[];
};

export type DecisionRecord = {
  cardId: string;
  userAction: Verdict;
  expectedAction: Verdict;
  correct: boolean;
  timeSpentMs: number;
};

export type ShiftResult = {
  date: string;
  subreddit: string;
  score: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  timeSeconds: number;
  maxCombo: number;
  rankTitle: string;
  streak: number;
  decisions: DecisionRecord[];
  shareMarkdown: string;
};

export type LeaderboardEntry = {
  username: string;
  score: number;
  accuracy: number;
  timeSeconds: number;
  rank: number;
};

export type InitResponse = {
  date: string;
  username: string;
  streak: number;
  alreadyPlayedToday: boolean;
  todayShift: DailyShift;
  leaderboard: LeaderboardEntry[];
};

export type SubmitShiftRequest = {
  date: string;
  score: number;
  correctCount: number;
  totalCount: number;
  timeSeconds: number;
  maxCombo: number;
  decisions: DecisionRecord[];
};

export type SubmitShiftResponse = {
  success: boolean;
  newStreak: number;
  rank: number;
  totalPlayers: number;
  shareMarkdown: string;
};
