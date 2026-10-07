import {
  TGAT2_CATEGORIES,
  TGAT2_TAXONOMY,
  TGAT2Category,
} from '@/src/config/practiceModes';

export interface QuestionAttemptLog {
  questionId: string;
  category: TGAT2Category;
  topic: string;
  isCorrect: boolean;
  isTimeout: boolean;
  timeSpentSeconds: number;
  selectedChoice: number | null;
  correctAnswer: number;
}

export interface CategoryPerformance {
  category: TGAT2Category;
  thaiName: string;
  total: number;
  correct: number;
  accuracyPercent: number;
}

export interface TopicPerformance {
  category: TGAT2Category;
  topic: string;
  total: number;
  correct: number;
  accuracyPercent: number;
}

export interface SessionTopicAnalysis {
  categoryBreakdowns: CategoryPerformance[];
  topicBreakdowns: TopicPerformance[];
  weakestCategories: CategoryPerformance[];
  weakestTopics: TopicPerformance[];
  recommendedCategory: TGAT2Category;
  recommendedTopic: string;
  recommendationHeadline: string;
  recommendationSubtext: string;
}

/**
 * Centralized Topic & Category Analysis System (Section 11, 12 & Engineering Rule #22)
 * Uses constructive, session-scoped wording ("จุดที่ควรฝึกเพิ่มวันนี้")
 */
export function analyzeSessionTopics(attempts: QuestionAttemptLog[]): SessionTopicAnalysis {
  const categoryBreakdowns: CategoryPerformance[] = TGAT2_CATEGORIES.map((category) => {
    const inCat = attempts.filter((a) => a.category === category);
    const total = inCat.length;
    const correct = inCat.filter((a) => a.isCorrect).length;
    const accuracyPercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      category,
      thaiName: TGAT2_TAXONOMY[category].thaiName,
      total,
      correct,
      accuracyPercent,
    };
  });

  const topicMap = new Map<string, { category: TGAT2Category; total: number; correct: number }>();
  for (const attempt of attempts) {
    const existing = topicMap.get(attempt.topic) ?? {
      category: attempt.category,
      total: 0,
      correct: 0,
    };
    existing.total += 1;
    if (attempt.isCorrect) existing.correct += 1;
    topicMap.set(attempt.topic, existing);
  }

  const topicBreakdowns: TopicPerformance[] = Array.from(topicMap.entries()).map(
    ([topic, stats]) => ({
      category: stats.category,
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracyPercent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })
  );

  // Sort tested categories by lowest accuracy first (and higher question count on tie)
  const testedCategories = categoryBreakdowns.filter((c) => c.total > 0);
  const sortedWeakCategories = [...(testedCategories.length > 0 ? testedCategories : categoryBreakdowns)].sort(
    (a, b) => a.accuracyPercent - b.accuracyPercent || b.total - a.total
  );

  const sortedWeakTopics = [...topicBreakdowns].sort(
    (a, b) => a.accuracyPercent - b.accuracyPercent || b.total - a.total
  );

  const recommendedCategory = sortedWeakCategories[0]?.category ?? 'Reasoning';
  const recommendedTopic =
    sortedWeakTopics[0]?.topic ?? TGAT2_TAXONOMY[recommendedCategory].topics[0];

  const recommendationHeadline = `ครั้งต่อไปลองฝึก ${recommendedCategory} (${recommendedTopic}) เพิ่ม`;
  const recommendationSubtext = `จากข้อมูลรอบนี้ หัวข้อ "${recommendedTopic}" เป็นจุดที่ควรฝึกเพิ่มวันนี้ เพื่ออัปความแม่นยำให้มั่นใจยิ่งขึ้น`;

  return {
    categoryBreakdowns,
    topicBreakdowns,
    weakestCategories: sortedWeakCategories.slice(0, 3),
    weakestTopics: sortedWeakTopics.slice(0, 3),
    recommendedCategory,
    recommendedTopic,
    recommendationHeadline,
    recommendationSubtext,
  };
}
