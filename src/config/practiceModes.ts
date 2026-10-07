import playerAvatarImg from '@/src/assets/images/player_avatar_1791373097637.jpg';
import monsterQuickImg from '@/src/assets/images/monster_quick_1791373110893.jpg';
import monsterChallengeImg from '@/src/assets/images/monster_challenge_1791373124023.jpg';
import monsterBossImg from '@/src/assets/images/monster_boss_1791373137586.jpg';
import petCompanionDragonImg from '@/src/assets/images/pet_companion_dragon_1791375117430.jpg';
import monsterOwlHatImg from '@/src/assets/images/monster_owl_hat_1791375130624.jpg';

export type PracticeModeId = 'quick' | 'challenge' | 'mock' | 'weak_focus';
export type TGAT2Category = 'Language' | 'Numerical' | 'Spatial' | 'Reasoning';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface PracticeModeConfig {
  id: PracticeModeId;
  analyticsCode: '10' | '20' | '70';
  badgeIcon: string;
  shortLabel: string;
  title: string;
  thaiTitle: string;
  subtitle: string;
  questionCount: number;
  estimatedTime: string;
  intensityLabel: string;
  rewardMultiplier: number;
  expectedCoinsDisplay: string;
  expectedXpDisplay: string;
  completionBonusCoins: number;
  completionBonusXp: number;
  timerType: 'per_question' | 'session';
  questionTimerSeconds: number;
  sessionTimerSeconds: number;
  monster: {
    name: string;
    thaiName: string;
    title: string;
    maxHp: number;
    imageUrl: string;
    irisColor: string;
    accentColor: string;
  };
}

export const PLAYER_DEFAULT_AVATAR = playerAvatarImg;
export const PET_COMPANION_IMG = petCompanionDragonImg;
export const MONSTER_OWL_IMG = monsterOwlHatImg;

export interface DungeonMapRealm {
  id: string;
  subjectLabel: string;
  mapTitle: string;
  subtitle: string;
  categoryFilter?: TGAT2Category;
  monsterImg: string;
  bgGradient: string;
}

export const DUNGEON_MAPS: DungeonMapRealm[] = [
  {
    id: 'all-tgat2',
    subjectLabel: 'TGAT2 92 (รวมทุกหมวด)',
    mapTitle: 'ป่าหิมพานต์แห่งเหตุผล',
    subtitle: 'สุ่มโจทย์ครบทั้ง 4 สมรรถนะหลักของ TGAT2 92',
    monsterImg: monsterOwlHatImg,
    bgGradient: 'from-sky-300 via-emerald-200 to-emerald-400',
  },
  {
    id: 'map-lang',
    subjectLabel: 'TGAT2 · ภาษาไทย (Language)',
    mapTitle: 'ป่าหิมพานต์อักษรเวท',
    subtitle: 'การสื่อความหมาย การใช้ภาษา การอ่าน และการเข้าใจภาษา',
    categoryFilter: 'Language',
    monsterImg: monsterQuickImg,
    bgGradient: 'from-cyan-200 via-teal-200 to-emerald-400',
  },
  {
    id: 'map-num',
    subjectLabel: 'TGAT2 · ตัวเลข (Numerical)',
    mapTitle: 'หอคอยศิลาตัวเลข',
    subtitle: 'อนุกรมมิติ เปรียบเทียบปริมาณ ความเพียงพอของข้อมูล โจทย์ปัญหา',
    categoryFilter: 'Numerical',
    monsterImg: monsterChallengeImg,
    bgGradient: 'from-amber-200 via-orange-200 to-emerald-400',
  },
  {
    id: 'map-spa',
    subjectLabel: 'TGAT2 · มิติสัมพันธ์ (Spatial)',
    mapTitle: 'เขาวงกตลูกบาศก์สามมิติ',
    subtitle: 'พับกล่อง หาภาพต่าง หมุนภาพสามมิติ และประกอบภาพ',
    categoryFilter: 'Spatial',
    monsterImg: monsterOwlHatImg,
    bgGradient: 'from-indigo-200 via-sky-200 to-emerald-400',
  },
  {
    id: 'map-rea',
    subjectLabel: 'TGAT2 · เหตุผล (Reasoning)',
    mapTitle: 'วิหารมังกรตรรกะ',
    subtitle: 'อนุกรมภาพ อุปมาอุปไมยภาพ สรุปความ และวิเคราะห์ข้อความ',
    categoryFilter: 'Reasoning',
    monsterImg: monsterBossImg,
    bgGradient: 'from-purple-200 via-fuchsia-200 to-emerald-400',
  },
];

/**
 * Central Practice Mode Configuration (Engineering Rule #22)
 * All mode parameters, timers, and reward multipliers live here.
 */
export const PRACTICE_MODES: Record<PracticeModeId, PracticeModeConfig> = {
  quick: {
    id: 'quick',
    analyticsCode: '10',
    badgeIcon: '⚡',
    shortLabel: '10 Questions',
    title: 'Quick Practice',
    thaiTitle: 'ฝึกไว 10 ข้อ',
    subtitle: 'เหมาะกับคืนที่มีเวลาน้อย ทบทวนสมองไวๆ ก่อนนอน',
    questionCount: 10,
    estimatedTime: '~8–10 min',
    intensityLabel: 'Intensity: เบาสบาย · เริ่มต้นไว',
    rewardMultiplier: 1,
    expectedCoinsDisplay: '10–30 Coins',
    expectedXpDisplay: '10–50 XP',
    completionBonusCoins: 8,
    completionBonusXp: 12,
    timerType: 'per_question',
    questionTimerSeconds: 20,
    sessionTimerSeconds: 200,
    monster: {
      name: 'Horned Owl Scout',
      thaiName: 'ฮูกแดงหมวกฟางแห่งป่าหิมพานต์',
      title: 'Lv. 5 · Meadow Scout',
      maxHp: 100,
      imageUrl: monsterOwlHatImg,
      irisColor: 'bg-rose-500',
      accentColor: 'emerald',
    },
  },
  challenge: {
    id: 'challenge',
    analyticsCode: '20',
    badgeIcon: '🔥',
    shortLabel: '20 Questions',
    title: 'Challenge Practice',
    thaiTitle: 'ประลองเข้มข้น 20 ข้อ',
    subtitle: 'ฝึกจริงจังขึ้น ลุยโจทย์ผสมครบทุกมิติ รับรางวัล ×2',
    questionCount: 20,
    estimatedTime: '~15–20 min',
    intensityLabel: 'Intensity: เข้มข้น · ท้าทายสมาธิ',
    rewardMultiplier: 2,
    expectedCoinsDisplay: '30–80 Coins',
    expectedXpDisplay: '30–100 XP',
    completionBonusCoins: 20,
    completionBonusXp: 30,
    timerType: 'per_question',
    questionTimerSeconds: 20,
    sessionTimerSeconds: 400,
    monster: {
      name: 'Runic Logic Golem',
      thaiName: 'โกเลมศิลาจารึกตรรกะ',
      title: 'Lv. 12 · Chamber Guardian',
      maxHp: 200,
      imageUrl: monsterChallengeImg,
      irisColor: 'bg-amber-500',
      accentColor: 'amber',
    },
  },
  mock: {
    id: 'mock',
    analyticsCode: '70',
    badgeIcon: '👑',
    shortLabel: '70 Questions',
    title: 'Mock Exam',
    thaiTitle: 'จำลองสนามสอบ 70 ข้อ',
    subtitle: 'ทดสอบความอึดและวิเคราะห์ผลครบ 4 สมรรถนะตามโครงสร้าง TGAT2',
    questionCount: 70,
    estimatedTime: '~50–60 min',
    intensityLabel: 'Intensity: บอสใหญ่ · จำลองสนามสอบจริงจัง',
    rewardMultiplier: 4,
    expectedCoinsDisplay: '150–400 Coins',
    expectedXpDisplay: '150–500 XP',
    completionBonusCoins: 75,
    completionBonusXp: 110,
    timerType: 'session',
    questionTimerSeconds: 50,
    sessionTimerSeconds: 3600, // 60 minutes full exam session timer
    monster: {
      name: 'Chronos, the Eternal Archmage',
      thaiName: 'มังกรจอมเวทกาลเวลาผู้พิทักษ์ TGAT2',
      title: 'Lv. 50 · Grand Exam Boss',
      maxHp: 700,
      imageUrl: monsterBossImg,
      irisColor: 'bg-purple-500',
      accentColor: 'purple',
    },
  },
  weak_focus: {
    id: 'weak_focus',
    analyticsCode: '10',
    badgeIcon: '🎯',
    shortLabel: '10 Questions (Focused)',
    title: 'Focused Weak-Topic Practice',
    thaiTitle: 'ฝึกเจาะจุดที่ควรพัฒนา 10 ข้อ',
    subtitle: 'สุ่มโจทย์เน้นสมรรถนะและหัวข้อที่ควรฝึกเพิ่มจากรอบล่าสุด',
    questionCount: 10,
    estimatedTime: '~8–10 min',
    intensityLabel: 'Intensity: เจาะจุดอ่อน · เสริมความแม่นยำ',
    rewardMultiplier: 1.5,
    expectedCoinsDisplay: '15–45 Coins',
    expectedXpDisplay: '20–75 XP',
    completionBonusCoins: 12,
    completionBonusXp: 18,
    timerType: 'per_question',
    questionTimerSeconds: 20,
    sessionTimerSeconds: 200,
    monster: {
      name: 'Arcane Mirror Slime',
      thaiName: 'สไลม์กระจกสะท้อนจุดอ่อน',
      title: 'Lv. 7 · Focus Specialist',
      maxHp: 100,
      imageUrl: monsterQuickImg,
      irisColor: 'bg-sky-500',
      accentColor: 'sky',
    },
  },
};

/**
 * Central Reward Configuration (Section 9)
 */
export const REWARD_CONFIG = {
  baseCoinsPerCorrect: 1.2,
  baseXpPerCorrect: 2.2,
  participationCoinsPerAnswered: 0.2,
  participationXpPerAnswered: 0.4,
  accuracyTiers: [
    { minAccuracy: 90, bonusFraction: 0.30, label: '90–100% (+30%)' },
    { minAccuracy: 70, bonusFraction: 0.15, label: '70–89% (+15%)' },
    { minAccuracy: 50, bonusFraction: 0.05, label: '50–69% (+5%)' },
    { minAccuracy: 0, bonusFraction: 0.0, label: 'ต่ำกว่า 50% (+0%)' },
  ],
  xpPerLevel: 200,
};

/**
 * Official TGAT2 92 Topic Taxonomy (Section 5)
 */
export const TGAT2_TAXONOMY: Record<
  TGAT2Category,
  {
    id: TGAT2Category;
    thaiName: string;
    englishName: string;
    description: string;
    mockExamQuota: number; // Sums to 70 questions for Mock Exam
    topics: string[];
  }
> = {
  Language: {
    id: 'Language',
    thaiName: 'ความสามารถทางภาษา',
    englishName: 'Language Competency',
    description: 'การสื่อความหมาย การใช้ภาษา การอ่าน และการเข้าใจภาษาไทยเชิงตรรกะ',
    mockExamQuota: 18,
    topics: ['การสื่อความหมาย', 'การใช้ภาษา', 'การอ่าน', 'การเข้าใจภาษา'],
  },
  Numerical: {
    id: 'Numerical',
    thaiName: 'ความสามารถทางตัวเลข',
    englishName: 'Numerical Competency',
    description: 'อนุกรมมิติ การเปรียบเทียบเชิงปริมาณ ความเพียงพอของข้อมูล และโจทย์ปัญหา',
    mockExamQuota: 18,
    topics: ['อนุกรมมิติ', 'การเปรียบเทียบเชิงปริมาณ', 'ความเพียงพอของข้อมูล', 'โจทย์ปัญหา'],
  },
  Spatial: {
    id: 'Spatial',
    thaiName: 'ความสามารถทางมิติสัมพันธ์',
    englishName: 'Spatial Competency',
    description: 'แบบพับกล่อง แบบหาภาพต่าง แบบหมุนภาพสามมิติ และแบบประกอบภาพ',
    mockExamQuota: 17,
    topics: ['แบบพับกล่อง', 'แบบหาภาพต่าง', 'แบบหมุนภาพสามมิติ', 'แบบประกอบภาพ'],
  },
  Reasoning: {
    id: 'Reasoning',
    thaiName: 'ความสามารถทางเหตุผล',
    englishName: 'Reasoning Competency',
    description: 'อนุกรมภาพ อุปมาอุปไมยภาพ สรุปความ และวิเคราะห์ข้อความ',
    mockExamQuota: 17,
    topics: ['อนุกรมภาพ', 'อุปมาอุปไมยภาพ', 'สรุปความ', 'วิเคราะห์ข้อความ'],
  },
};

export const TGAT2_CATEGORIES: TGAT2Category[] = [
  'Language',
  'Numerical',
  'Spatial',
  'Reasoning',
];
