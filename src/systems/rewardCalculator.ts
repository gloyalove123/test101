import {
  PRACTICE_MODES,
  PracticeModeId,
  REWARD_CONFIG,
} from '@/src/config/practiceModes';

export interface RewardCalculationInput {
  mode: PracticeModeId;
  totalQuestions: number;
  completedQuestions: number;
  correctCount: number;
}

export interface RewardBreakdown {
  mode: PracticeModeId;
  modeTitle: string;
  modeMultiplier: number;
  accuracyPercent: number;
  accuracyBonusLabel: string;
  accuracyBonusFraction: number;
  isSessionFullyCompleted: boolean;
  baseCoins: number;
  baseXp: number;
  accuracyBonusCoins: number;
  accuracyBonusXp: number;
  completionBonusCoins: number;
  completionBonusXp: number;
  totalCoins: number;
  totalXp: number;
}

/**
 * Centralized Reward Calculation System (Section 9 & Engineering Rule #22)
 *
 * Formula:
 * (baseRewardFromCorrectAndAnswered × modeMultiplier) × (1 + accuracyBonus) + completionBonus
 *
 * Prevents rewarding blind random guessing by anchoring base reward heavily on correct answers
 * and gating completion bonuses on finishing the session with non-trivial effort.
 */
export function calculateSessionRewards(input: RewardCalculationInput): RewardBreakdown {
  const { mode, totalQuestions, completedQuestions, correctCount } = input;
  const modeConfig = PRACTICE_MODES[mode];
  const safeTotal = Math.max(1, totalQuestions);
  const accuracyPercent = Math.round((correctCount / safeTotal) * 100);
  const isSessionFullyCompleted = completedQuestions >= totalQuestions;

  // Find accuracy tier
  const matchedTier =
    REWARD_CONFIG.accuracyTiers.find((t) => accuracyPercent >= t.minAccuracy) ??
    REWARD_CONFIG.accuracyTiers[REWARD_CONFIG.accuracyTiers.length - 1];

  // Raw base reward before multiplier
  const rawCoins =
    correctCount * REWARD_CONFIG.baseCoinsPerCorrect +
    completedQuestions * REWARD_CONFIG.participationCoinsPerAnswered;
  const rawXp =
    correctCount * REWARD_CONFIG.baseXpPerCorrect +
    completedQuestions * REWARD_CONFIG.participationXpPerAnswered;

  // Apply mode multiplier
  const baseCoins = Math.round(rawCoins * modeConfig.rewardMultiplier);
  const baseXp = Math.round(rawXp * modeConfig.rewardMultiplier);

  // Accuracy bonus
  const accuracyBonusCoins = Math.round(baseCoins * matchedTier.bonusFraction);
  const accuracyBonusXp = Math.round(baseXp * matchedTier.bonusFraction);

  // Completion bonus (scaled if accuracy is very low so blind rapid clicking isn't over-rewarded)
  const antiGuessingFactor = accuracyPercent >= 35 ? 1 : accuracyPercent >= 20 ? 0.5 : 0.25;
  const completionBonusCoins = isSessionFullyCompleted
    ? Math.round(modeConfig.completionBonusCoins * antiGuessingFactor)
    : 0;
  const completionBonusXp = isSessionFullyCompleted
    ? Math.round(modeConfig.completionBonusXp * antiGuessingFactor)
    : 0;

  const totalCoins = baseCoins + accuracyBonusCoins + completionBonusCoins;
  const totalXp = baseXp + accuracyBonusXp + completionBonusXp;

  return {
    mode,
    modeTitle: modeConfig.title,
    modeMultiplier: modeConfig.rewardMultiplier,
    accuracyPercent,
    accuracyBonusLabel: matchedTier.label,
    accuracyBonusFraction: matchedTier.bonusFraction,
    isSessionFullyCompleted,
    baseCoins,
    baseXp,
    accuracyBonusCoins,
    accuracyBonusXp,
    completionBonusCoins,
    completionBonusXp,
    totalCoins,
    totalXp,
  };
}
