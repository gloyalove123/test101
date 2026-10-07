import {
  DifficultyLevel,
  PRACTICE_MODES,
  PracticeModeId,
  TGAT2_CATEGORIES,
  TGAT2_TAXONOMY,
  TGAT2Category,
} from '@/src/config/practiceModes';
import { QUESTION_BANK, QuestionRecord } from '@/src/data/questionBank';

/**
 * Public question object exposed to the Battle UI BEFORE user submission.
 * Notice `correctAnswer` and `explanation` are intentionally omitted
 * per Section 6 ("Never expose internal answer data before the user submits").
 */
export interface PublicQuestion {
  id: string;
  exam: 'TGAT2-92';
  category: TGAT2Category;
  topic: string;
  difficulty: DifficultyLevel;
  question: string;
  choices: string[];
  source: string;
  sourceType: 'original' | 'licensed' | 'demo';
  visualPattern?: QuestionRecord['visualPattern'];
}

export interface AnswerVerificationResult {
  questionId: string;
  isCorrect: boolean;
  selectedChoice: number | null;
  correctAnswer: number;
  explanation: string;
}

// Internal session vault storing the shuffled choice mapping for active questions
const sessionAnswerVault = new Map<
  string,
  {
    correctAnswer: number;
    explanation: string;
  }
>();

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toPublicQuestionWithShuffledChoices(record: QuestionRecord): PublicQuestion {
  const indexedChoices = record.choices.map((text, idx) => ({
    text,
    isCorrect: idx === record.correctAnswer,
  }));
  const shuffled = shuffleArray(indexedChoices);
  const newCorrectIndex = shuffled.findIndex((c) => c.isCorrect);

  sessionAnswerVault.set(record.id, {
    correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    explanation: record.explanation,
  });

  return {
    id: record.id,
    exam: record.exam,
    category: record.category,
    topic: record.topic,
    difficulty: record.difficulty,
    question: record.question,
    choices: shuffled.map((c) => c.text),
    source: record.source,
    sourceType: record.sourceType,
    visualPattern: record.visualPattern,
  };
}

/**
 * Verify a user's submitted choice (or timeout when selectedChoice is null).
 * Returns the correct answer index and explanation ONLY upon submission.
 */
export function verifySubmittedAnswer(
  questionId: string,
  selectedChoice: number | null
): AnswerVerificationResult {
  const secret = sessionAnswerVault.get(questionId);
  if (!secret) {
    const fallback = QUESTION_BANK.find((q) => q.id === questionId);
    const correctAnswer = fallback ? fallback.correctAnswer : 0;
    const explanation = fallback ? fallback.explanation : '';
    return {
      questionId,
      isCorrect: selectedChoice !== null && selectedChoice === correctAnswer,
      selectedChoice,
      correctAnswer,
      explanation,
    };
  }

  return {
    questionId,
    isCorrect: selectedChoice !== null && selectedChoice === secret.correctAnswer,
    selectedChoice,
    correctAnswer: secret.correctAnswer,
    explanation: secret.explanation,
  };
}

/**
 * Selects a balanced mix of easy, medium, and hard questions from a candidate pool
 * while avoiding duplicate IDs and minimizing topic repetition.
 */
function pickBalancedFromPool(
  pool: QuestionRecord[],
  count: number,
  alreadySelectedIds: Set<string>
): QuestionRecord[] {
  const available = shuffleArray(pool.filter((q) => !alreadySelectedIds.has(q.id)));
  if (available.length <= count) {
    available.forEach((q) => alreadySelectedIds.add(q.id));
    return available;
  }

  // Target difficulty distribution: ~35% easy, ~40% medium, ~25% hard
  const targetEasy = Math.max(1, Math.round(count * 0.35));
  const targetMedium = Math.max(1, Math.round(count * 0.4));
  const targetHard = Math.max(0, count - targetEasy - targetMedium);

  const easyPool = available.filter((q) => q.difficulty === 'easy');
  const mediumPool = available.filter((q) => q.difficulty === 'medium');
  const hardPool = available.filter((q) => q.difficulty === 'hard');

  const picked: QuestionRecord[] = [];
  const topicCounts = new Map<string, number>();

  const takeWithTopicVariety = (candidates: QuestionRecord[], quota: number) => {
    const sorted = [...candidates].sort(
      (a, b) => (topicCounts.get(a.topic) ?? 0) - (topicCounts.get(b.topic) ?? 0)
    );
    for (const q of sorted) {
      if (picked.length >= count || quota <= 0) break;
      if (alreadySelectedIds.has(q.id)) continue;
      picked.push(q);
      alreadySelectedIds.add(q.id);
      topicCounts.set(q.topic, (topicCounts.get(q.topic) ?? 0) + 1);
      quota--;
    }
  };

  takeWithTopicVariety(easyPool, targetEasy);
  takeWithTopicVariety(mediumPool, targetMedium);
  takeWithTopicVariety(hardPool, targetHard);

  // Fill any remaining slots if a difficulty bucket had fewer items
  if (picked.length < count) {
    takeWithTopicVariety(available, count - picked.length);
  }

  return shuffleArray(picked);
}

/**
 * Central Question Selection System (Section 4 & Engineering Rule #22)
 */
export function selectQuestionsForSession(options: {
  mode: PracticeModeId;
  focusCategory?: TGAT2Category;
  focusTopic?: string;
}): PublicQuestion[] {
  const { mode, focusCategory, focusTopic } = options;
  const modeConfig = PRACTICE_MODES[mode];
  const totalNeeded = modeConfig.questionCount;
  const selectedIds = new Set<string>();
  let chosenRecords: QuestionRecord[] = [];

  if (mode === 'mock') {
    // 70-question Mock Exam: distribute across the 4 official TGAT2 competency areas
    // (18 Language + 18 Numerical + 17 Spatial + 17 Reasoning = 70 questions)
    for (const category of TGAT2_CATEGORIES) {
      const quota = TGAT2_TAXONOMY[category].mockExamQuota;
      const categoryPool = QUESTION_BANK.filter((q) => q.category === category);
      const categoryPicked = pickBalancedFromPool(categoryPool, quota, selectedIds);
      chosenRecords.push(...categoryPicked);
    }

    // Safety top-up if needed
    if (chosenRecords.length < totalNeeded) {
      const remaining = pickBalancedFromPool(
        QUESTION_BANK,
        totalNeeded - chosenRecords.length,
        selectedIds
      );
      chosenRecords.push(...remaining);
    }
  } else if (mode === 'weak_focus' && (focusCategory || focusTopic)) {
    // Focused 10-question session: ~7 questions from weakest category/topic + ~3 related questions
    const primaryPool = QUESTION_BANK.filter((q) =>
      focusTopic
        ? q.topic === focusTopic || q.category === focusCategory
        : q.category === focusCategory
    );
    const primaryTarget = Math.min(7, totalNeeded);
    const primaryPicked = pickBalancedFromPool(primaryPool, primaryTarget, selectedIds);
    chosenRecords.push(...primaryPicked);

    const remainingNeeded = totalNeeded - chosenRecords.length;
    if (remainingNeeded > 0) {
      const relatedPicked = pickBalancedFromPool(QUESTION_BANK, remainingNeeded, selectedIds);
      chosenRecords.push(...relatedPicked);
    }
    chosenRecords = shuffleArray(chosenRecords);
  } else {
    // Quick (10) and Challenge (20): balanced across categories, topics, and difficulties
    const perCategoryBase = Math.floor(totalNeeded / TGAT2_CATEGORIES.length);
    let remainder = totalNeeded % TGAT2_CATEGORIES.length;
    const shuffledCategories = shuffleArray(TGAT2_CATEGORIES);

    for (const category of shuffledCategories) {
      const countForCat = perCategoryBase + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      const catPool = QUESTION_BANK.filter((q) => q.category === category);
      const catPicked = pickBalancedFromPool(catPool, countForCat, selectedIds);
      chosenRecords.push(...catPicked);
    }

    chosenRecords = shuffleArray(chosenRecords);
  }

  return chosenRecords.slice(0, totalNeeded).map(toPublicQuestionWithShuffledChoices);
}
