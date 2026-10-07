import {
  PracticeModeId,
  REWARD_CONFIG,
  TGAT2Category,
} from '@/src/config/practiceModes';
import { RewardBreakdown } from '@/src/systems/rewardCalculator';
import { SessionTopicAnalysis } from '@/src/systems/topicAnalyzer';

export interface LastSessionSummary {
  sessionId: string;
  completedAt: string;
  mode: PracticeModeId;
  modeTitle: string;
  questionCount: number;
  completedQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercent: number;
  durationSeconds: number;
  weakestCategory: TGAT2Category;
  weakestTopic: string;
  rewards: RewardBreakdown;
  topicAnalysis: SessionTopicAnalysis;
}

export interface PlayerProfileState {
  playerName: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  petName: string;
  petLevel: number;
  petFoodCount: number;
  streakDays: number;
  lastPlayedDate: string | null;
  totalSessionsCompleted: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  soundEnabled: boolean;
  lastSession: LastSessionSummary | null;
  sessionHistory: LastSessionSummary[];
}

const PLAYER_STORAGE_KEY = 'doe_tgat2_player_state_v1';

const DEFAULT_PLAYER_STATE: PlayerProfileState = {
  playerName: 'นักรบ Dek69',
  level: 1,
  xp: 40,
  coins: 120,
  gems: 15,
  petName: 'มังกรน้อยหิมพานต์',
  petLevel: 5,
  petFoodCount: 2,
  streakDays: 1,
  lastPlayedDate: null,
  totalSessionsCompleted: 0,
  totalQuestionsAnswered: 0,
  totalCorrectAnswers: 0,
  soundEnabled: true,
  lastSession: null,
  sessionHistory: [],
};

export function loadPlayerState(): PlayerProfileState {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYER_STATE;
    const parsed = JSON.parse(raw) as Partial<PlayerProfileState>;
    return {
      ...DEFAULT_PLAYER_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_PLAYER_STATE;
  }
}

export function savePlayerState(state: PlayerProfileState): void {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function recordCompletedSession(
  currentState: PlayerProfileState,
  session: LastSessionSummary
): PlayerProfileState {
  const todayStr = new Date().toISOString().slice(0, 10);
  let newStreak = currentState.streakDays;

  if (!currentState.lastPlayedDate) {
    newStreak = 1;
  } else if (currentState.lastPlayedDate !== todayStr) {
    const lastDate = new Date(currentState.lastPlayedDate);
    const todayDate = new Date(todayStr);
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      newStreak = currentState.streakDays + 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  const totalXpAccumulated =
    (currentState.level - 1) * REWARD_CONFIG.xpPerLevel +
    currentState.xp +
    session.rewards.totalXp;

  const newLevel = Math.floor(totalXpAccumulated / REWARD_CONFIG.xpPerLevel) + 1;
  const newXpInLevel = totalXpAccumulated % REWARD_CONFIG.xpPerLevel;

  const nextState: PlayerProfileState = {
    ...currentState,
    level: newLevel,
    xp: newXpInLevel,
    coins: currentState.coins + session.rewards.totalCoins,
    streakDays: newStreak,
    lastPlayedDate: todayStr,
    totalSessionsCompleted: currentState.totalSessionsCompleted + 1,
    totalQuestionsAnswered:
      currentState.totalQuestionsAnswered + session.completedQuestions,
    totalCorrectAnswers: currentState.totalCorrectAnswers + session.correctCount,
    lastSession: session,
    sessionHistory: [session, ...currentState.sessionHistory].slice(0, 25),
  };

  savePlayerState(nextState);
  return nextState;
}
