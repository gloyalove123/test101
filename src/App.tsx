import React, { useEffect, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Edit3,
  Flame,
  Flag,
  Gem,
  Globe,
  Home,
  Play,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { CompactMonsterEyes } from '@/components/ui/mouse-following-eyes';
import MetroHero from '@/components/ui/scroll-locked-video-hero';
import {
  DUNGEON_MAPS,
  MONSTER_OWL_IMG,
  PET_COMPANION_IMG,
  PLAYER_DEFAULT_AVATAR,
  PRACTICE_MODES,
  PracticeModeId,
  REWARD_CONFIG,
  TGAT2_CATEGORIES,
  TGAT2_TAXONOMY,
  TGAT2Category,
} from '@/src/config/practiceModes';
import {
  PublicQuestion,
  selectQuestionsForSession,
} from '@/src/systems/questionSelector';
import { calculateSessionRewards } from '@/src/systems/rewardCalculator';
import {
  analyzeSessionTopics,
  QuestionAttemptLog,
} from '@/src/systems/topicAnalyzer';
import {
  LastSessionSummary,
  loadPlayerState,
  PlayerProfileState,
  recordCompletedSession,
  savePlayerState,
} from '@/src/lib/storage';
import { trackEvent } from '@/src/lib/analytics';
import { BattleScreen } from '@/src/components/BattleScreen';
import { ResultScreen } from '@/src/components/ResultScreen';

type AppScreenState = 'HOME' | 'LOADING_BATTLE' | 'BATTLE' | 'RESULT' | 'LORE_HERO';
type DockTabId = 'trail' | 'streak' | 'home' | 'store' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<AppScreenState>('HOME');
  const [activeTab, setActiveTab] = useState<DockTabId>('home');
  const [player, setPlayer] = useState<PlayerProfileState>(() => loadPlayerState());

  // Map & Mode Selection State on Home Screen
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState<PracticeModeId>('quick');

  // Inline Editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(player.playerName);
  const [userBio, setUserBio] = useState('เป้าหมาย: พิชิต TGAT2 92 ให้เกิน 80%!');
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Loading Transition Progress (0 -> 100% from IMG_2906.jpg)
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Store & Feedback Message
  const [storeNotice, setStoreNotice] = useState<string | null>(null);

  // Image error states
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [petImgError, setPetImgError] = useState(false);
  const [mapImgError, setMapImgError] = useState(false);

  // Active Battle Session State
  const [activeMode, setActiveMode] = useState<PracticeModeId>('quick');
  const [activeQuestions, setActiveQuestions] = useState<PublicQuestion[]>([]);
  const [completedSession, setCompletedSession] = useState<LastSessionSummary | null>(
    null
  );

  const currentMap = DUNGEON_MAPS[selectedMapIndex] ?? DUNGEON_MAPS[0];

  useEffect(() => {
    trackEvent('landing_view', {
      level: player.level,
      streakDays: player.streakDays,
      totalSessionsCompleted: player.totalSessionsCompleted,
    });
  }, []);

  // Animate the cute dragon loading bar when entering battle
  useEffect(() => {
    if (screen !== 'LOADING_BATTLE') return;
    setLoadingProgress(18);
    const t1 = window.setTimeout(() => setLoadingProgress(65), 220);
    const t2 = window.setTimeout(() => setLoadingProgress(100), 460);
    const t3 = window.setTimeout(() => {
      setScreen('BATTLE');
    }, 680);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [screen]);

  const handleSaveName = () => {
    const trimmed = nameDraft.trim() || 'นักรบ Dek69';
    const updated = { ...player, playerName: trimmed };
    setPlayer(updated);
    savePlayerState(updated);
    setIsEditingName(false);
  };

  const handleToggleSound = () => {
    const updated = { ...player, soundEnabled: !player.soundEnabled };
    setPlayer(updated);
    savePlayerState(updated);
  };

  const handleFeedPet = () => {
    if (player.coins < 10) {
      setStoreNotice('Coins ไม่พอสำหรับให้อาหารคู่หู (ใช้ 10 Coins) ลองฝึก 10 ข้อเพื่อรับ Coins เพิ่ม!');
      window.setTimeout(() => setStoreNotice(null), 3000);
      return;
    }
    const nextFood = player.petFoodCount >= 3 ? 1 : player.petFoodCount + 1;
    const nextPetLevel =
      player.petFoodCount >= 3 ? player.petLevel + 1 : player.petLevel;
    const updated: PlayerProfileState = {
      ...player,
      coins: player.coins - 10,
      xp: player.xp + 15,
      petFoodCount: nextFood,
      petLevel: nextPetLevel,
    };
    setPlayer(updated);
    savePlayerState(updated);
    setStoreNotice(`ให้อาหาร ${player.petName} สำเร็จ! (+15 XP)`);
    window.setTimeout(() => setStoreNotice(null), 2500);
  };

  const startPracticeSession = (
    mode: PracticeModeId,
    focusCategory?: TGAT2Category,
    focusTopic?: string
  ) => {
    const modeConfig = PRACTICE_MODES[mode];
    const effectiveCategory = focusCategory ?? currentMap.categoryFilter;

    trackEvent('practice_mode_selected', {
      mode: modeConfig.analyticsCode,
      modeId: mode,
      focusCategory: effectiveCategory ?? null,
      focusTopic: focusTopic ?? null,
    });

    const selectedQuestions = selectQuestionsForSession({
      mode,
      focusCategory: effectiveCategory,
      focusTopic,
    });

    trackEvent('practice_started', {
      mode: modeConfig.analyticsCode,
      modeId: mode,
      questionCount: selectedQuestions.length,
    });

    setActiveMode(mode);
    setActiveQuestions(selectedQuestions);
    setScreen('LOADING_BATTLE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteSession = (
    attempts: QuestionAttemptLog[],
    durationSeconds: number
  ) => {
    const modeConfig = PRACTICE_MODES[activeMode];
    const totalQuestions = activeQuestions.length;
    const completedQuestions = attempts.length;
    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const incorrectCount = completedQuestions - correctCount;
    const accuracyPercent =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const rewards = calculateSessionRewards({
      mode: activeMode,
      totalQuestions,
      completedQuestions,
      correctCount,
    });

    const topicAnalysis = analyzeSessionTopics(attempts);

    const summary: LastSessionSummary = {
      sessionId: `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
      mode: activeMode,
      modeTitle: modeConfig.title,
      questionCount: totalQuestions,
      completedQuestions,
      correctCount,
      incorrectCount,
      accuracyPercent,
      durationSeconds,
      weakestCategory: topicAnalysis.recommendedCategory,
      weakestTopic: topicAnalysis.recommendedTopic,
      rewards,
      topicAnalysis,
    };

    trackEvent('practice_completed', {
      mode: modeConfig.analyticsCode,
      modeId: activeMode,
      completionRate: Math.round(
        (completedQuestions / Math.max(1, totalQuestions)) * 100
      ),
      accuracy: accuracyPercent,
      sessionDuration: durationSeconds,
      weakTopic: summary.weakestTopic,
      rewardCoinsEarned: rewards.totalCoins,
      rewardXpEarned: rewards.totalXp,
    });

    const nextPlayerState = recordCompletedSession(player, summary);
    setPlayer(nextPlayerState);
    setCompletedSession(summary);
    setScreen('RESULT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (screen === 'LORE_HERO') {
    return (
      <MetroHero
        title="DUNGEON OF EXAM"
        scrollHint="SCROLL TO UNLOCK THE DUNGEON"
        tagline="เปลี่ยนคืนที่ผัดวันประกันพรุ่ง ให้เป็น 10 ข้อที่ชนะตัวเอง"
        onClose={() => setScreen('HOME')}
      />
    );
  }

  // Cute Dragon Running Loading Screen from IMG_2906.jpg
  if (screen === 'LOADING_BATTLE') {
    return (
      <div
        onClick={() => setScreen('BATTLE')}
        className="min-h-screen bg-[#FEFCE8] flex flex-col items-center justify-center p-6 select-none cursor-pointer"
      >
        <div className="w-full max-w-xl rounded-3xl bg-white border-[4px] border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8 sm:p-12 flex flex-col items-center text-center">
          {/* Spinning dots wheel from sketch */}
          <div className="w-14 h-14 rounded-full border-4 border-dashed border-slate-900 animate-spin mb-6" />

          <p className="text-sm font-extrabold text-indigo-700 uppercase tracking-wider">
            กำลังเข้าสู่ {currentMap.mapTitle} · {PRACTICE_MODES[activeMode].title}
          </p>

          {/* Dragon running along the progress bar */}
          <div className="w-full mt-8 relative">
            <div
              className="transition-all duration-200 flex flex-col items-center"
              style={{
                transform: `translateX(${Math.min(75, Math.max(0, loadingProgress - 15))}%)`,
                width: '80px',
              }}
            >
              <img
                src={PET_COMPANION_IMG}
                alt="มังกรน้อยกำลังวิ่ง"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl border-[3px] border-slate-900 object-cover shadow-md animate-bounce"
              />
            </div>

            <div className="mt-2 flex items-center justify-end text-xs font-mono-tabular font-extrabold text-slate-900 mb-1">
              <span>{loadingProgress}% / 100%</span>
            </div>

            {/* Striped bar matching sketch */}
            <div className="h-6 w-full rounded-full bg-slate-100 border-[3px] border-slate-900 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-200"
                style={{
                  width: `${loadingProgress}%`,
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(15,23,42,0.2) 0, rgba(15,23,42,0.2) 8px, transparent 8px, transparent 16px)',
                }}
              />
            </div>
          </div>

          <p className="mt-4 text-xs font-bold text-slate-500">
            แตะหน้าจอเพื่อเข้าสู่ฉากต่อสู้ทันที
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'BATTLE' && activeQuestions.length > 0) {
    return (
      <BattleScreen
        mode={activeMode}
        questions={activeQuestions}
        playerName={player.playerName}
        playerLevel={player.level}
        petName={player.petName}
        soundEnabled={player.soundEnabled}
        onToggleSound={handleToggleSound}
        onCompleteSession={handleCompleteSession}
        onAbandonSession={() => setScreen('HOME')}
      />
    );
  }

  if (screen === 'RESULT' && completedSession) {
    return (
      <ResultScreen
        session={completedSession}
        onStartFocusedPractice={(category, topic) =>
          startPracticeSession('weak_focus', category, topic)
        }
        onStartMode={(mode) => startPracticeSession(mode)}
        onBackHome={() => setScreen('HOME')}
      />
    );
  }

  const xpProgressPercent = Math.min(
    100,
    Math.round((player.xp / REWARD_CONFIG.xpPerLevel) * 100)
  );

  const mainModes: PracticeModeId[] = ['quick', 'challenge', 'mock'];

  const prevMap = () => {
    setMapImgError(false);
    setSelectedMapIndex((i) => (i - 1 + DUNGEON_MAPS.length) % DUNGEON_MAPS.length);
  };

  const nextMap = () => {
    setMapImgError(false);
    setSelectedMapIndex((i) => (i + 1) % DUNGEON_MAPS.length);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between pb-24">
      {/* Main Sketch Window Container */}
      <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* ===================================================================
            SKETCH TOP STATUS BAR:
            Left: [Avatar] NAME Lv.X + XP Bar
            Right: 🔥 Streak | 🪙 Coins (+) | 💎 Gems (+)
        =================================================================== */}
        <header className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Avatar + Name + Lv + Underline XP Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-[3px] border-slate-900 bg-amber-200 shrink-0 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
            >
              {!avatarImgError ? (
                <img
                  src={PLAYER_DEFAULT_AVATAR}
                  alt={player.playerName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-extrabold text-slate-900">
                  <User className="w-6 h-6" />
                </div>
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      maxLength={20}
                      className="px-2 py-0.5 text-sm font-bold bg-amber-50 border-2 border-slate-900 rounded-lg text-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-2.5 py-0.5 text-xs font-extrabold bg-amber-400 border-2 border-slate-900 rounded-lg cursor-pointer"
                    >
                      ตกลง
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      {player.playerName}
                    </span>
                    <span className="font-mono-tabular text-sm sm:text-base font-extrabold text-indigo-700">
                      Lv.{player.level}
                    </span>
                    <button
                      onClick={() => {
                        setNameDraft(player.playerName);
                        setIsEditingName(true);
                      }}
                      aria-label="แก้ไขชื่อ"
                      className="text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* XP Bar directly below NAME Lv.X just like the sketch */}
              <div className="mt-1 w-36 sm:w-48 h-2.5 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: 🔥 Streak | 🪙 Coins [+] | 💎 Gems [+] */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <button
              onClick={() => setActiveTab('streak')}
              className="px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-slate-900 flex items-center gap-1.5 font-mono-tabular font-extrabold text-sm text-rose-600 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-rose-500 text-rose-600" />
              <span>{player.streakDays}</span>
            </button>

            {/* Coins */}
            <button
              onClick={() => setActiveTab('store')}
              className="px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-slate-900 flex items-center gap-1.5 font-mono-tabular font-extrabold text-sm text-amber-800 cursor-pointer"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{player.coins.toLocaleString()}</span>
              <span className="w-4 h-4 rounded-full bg-amber-400 border border-slate-900 flex items-center justify-center text-slate-950">
                <Plus className="w-3 h-3 stroke-[3]" />
              </span>
            </button>

            {/* Diamonds/Gems */}
            <button
              onClick={() => setActiveTab('store')}
              className="px-3 py-1.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-slate-900 flex items-center gap-1.5 font-mono-tabular font-extrabold text-sm text-sky-800 cursor-pointer"
            >
              <Gem className="w-4 h-4 text-sky-500" />
              <span>{player.gems}</span>
              <span className="w-4 h-4 rounded-full bg-sky-300 border border-slate-900 flex items-center justify-center text-slate-950">
                <Plus className="w-3 h-3 stroke-[3]" />
              </span>
            </button>
          </div>
        </header>

        {storeNotice && (
          <div className="rounded-2xl bg-amber-300 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 flex items-center justify-between">
            <span>✨ {storeNotice}</span>
            <button onClick={() => setStoreNotice(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================================================================
            TAB 1: HOME SCREEN (Exact Split Layout from IMG_2906.jpg & IMG_2905.jpg)
            Left = 🚩 MAP [Subject v] + Illustrated Map Box with < >
            Right = Pet Info (Lv, ability, food, Feed ○○○) + Mode Selector + [start !]
        =================================================================== */}
        {activeTab === 'home' && (
          <>
            <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-5 sm:p-7">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* LEFT COLUMN (7 cols): 🚩 MAP [ Subject v ] + Illustrated Map Carousel */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-3">
                  {/* Top Row: Red Flag MAP + Subject Dropdown */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-base sm:text-lg text-slate-900">
                        <Flag className="w-5 h-5 fill-rose-500 text-slate-900" />
                        <span>MAP</span>
                      </span>

                      <select
                        aria-label="เลือกหมวดวิชาและแผนที่"
                        value={selectedMapIndex}
                        onChange={(e) => {
                          setMapImgError(false);
                          setSelectedMapIndex(Number(e.target.value));
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 border-[2.5px] border-slate-900 font-bold text-xs sm:text-sm text-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer focus:outline-none"
                      >
                        {DUNGEON_MAPS.map((m, idx) => (
                          <option key={m.id} value={idx}>
                            {m.subjectLabel}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setActiveTab('trail')}
                      className="text-xs font-extrabold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>🗺️ ดูเส้นทางมอนสเตอร์</span>
                    </button>
                  </div>

                  {/* Large Map Illustration Box with < and > arrows (Exact match to sketch) */}
                  <div
                    className={`relative flex-1 min-h-[260px] sm:min-h-[300px] rounded-3xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] bg-gradient-to-b ${currentMap.bgGradient} overflow-hidden flex flex-col justify-between p-4`}
                  >
                    {/* Top Map Title Banner ("ป่าหิมพานต์") */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-xl bg-white/95 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-sm sm:text-base font-extrabold text-slate-900">
                        {currentMap.mapTitle}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/85 text-white text-xs font-bold">
                        {PRACTICE_MODES[selectedMode].badgeIcon}{' '}
                        {PRACTICE_MODES[selectedMode].questionCount} ข้อ
                      </span>
                    </div>

                    {/* Left < and Right > Carousel Arrows */}
                    <button
                      onClick={prevMap}
                      aria-label="แผนที่ก่อนหน้า"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-amber-200 border-[2.5px] border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-6 h-6 stroke-[3]" />
                    </button>

                    <button
                      onClick={nextMap}
                      aria-label="แผนที่ถัดไป"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-amber-200 border-[2.5px] border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-6 h-6 stroke-[3]" />
                    </button>

                    {/* Center Forest Scene + Monster Preview */}
                    <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] bg-white animate-float-slow">
                        {!mapImgError ? (
                          <img
                            src={PRACTICE_MODES[selectedMode].monster.imageUrl}
                            alt={PRACTICE_MODES[selectedMode].monster.thaiName}
                            referrerPolicy="no-referrer"
                            onError={() => setMapImgError(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-200 font-extrabold">
                            BOSS
                          </div>
                        )}
                      </div>
                      <div className="w-36 h-5 -mt-2 rounded-full bg-emerald-950/35" />
                    </div>

                    {/* Bottom Map Subtitle */}
                    <div className="relative z-10 bg-white/95 border-2 border-slate-900 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {currentMap.subtitle}
                      </span>
                      <span className="text-xs font-mono-tabular font-extrabold text-indigo-700 shrink-0">
                        บอส: {PRACTICE_MODES[selectedMode].monster.thaiName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (5 cols): Pet Status + Mode Selector + [ start ! ] */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  {/* Top Box: ข้อมูล Pet (Pet Sprite on left + Lv, ability, food, Feed ○○○ on right) */}
                  <div className="rounded-3xl bg-amber-50/70 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4">
                    <div className="flex items-center gap-4">
                      {/* Cute Pet Illustration + MouseFollowingEyes */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] bg-white">
                          {!petImgError ? (
                            <img
                              src={PET_COMPANION_IMG}
                              alt={player.petName}
                              referrerPolicy="no-referrer"
                              onError={() => setPetImgError(true)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-200 font-bold">
                              PET
                            </div>
                          )}
                        </div>
                        <div className="-mt-3 z-10">
                          <CompactMonsterEyes size="sm" irisColor="bg-emerald-500" />
                        </div>
                      </div>

                      {/* Pet Stats Stack (pet name, Lv., ability, food, Feed ○○○) */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            pet name
                          </p>
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                            {player.petName}
                          </h3>
                        </div>

                        {/* Lv. bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-extrabold">
                            <span>Lv.{player.petLevel}</span>
                            <span className="font-mono-tabular text-emerald-700">
                              MAX HP 100
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white border-2 border-slate-900 overflow-hidden">
                            <div className="h-full bg-emerald-400 w-4/5" />
                          </div>
                        </div>

                        {/* ability bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-extrabold">
                            <span>ability</span>
                            <span className="text-indigo-700">
                              Reward ×{PRACTICE_MODES[selectedMode].rewardMultiplier}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white border-2 border-slate-900 overflow-hidden">
                            <div
                              className="h-full bg-sky-400 transition-all duration-300"
                              style={{
                                width:
                                  selectedMode === 'mock'
                                    ? '100%'
                                    : selectedMode === 'challenge'
                                    ? '65%'
                                    : '35%',
                              }}
                            />
                          </div>
                        </div>

                        {/* 🍖 food bar + Feed ○ ○ ○ */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-800">
                              Feed
                            </span>
                            {[1, 2, 3].map((dot) => (
                              <span
                                key={dot}
                                className={`w-4 h-4 rounded-full border-2 border-slate-900 inline-block ${
                                  player.petFoodCount >= dot
                                    ? 'bg-rose-400'
                                    : 'bg-white'
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={handleFeedPet}
                            className="px-2.5 py-1 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 text-[11px] font-extrabold text-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer whitespace-nowrap"
                          >
                            🍖 ให้อาหาร (10 C)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Box: เลือกโหมดฝึก (“วันนี้อยากฝึกแค่ไหน?”) + Dropdown + [ start ! ] */}
                  <div className="rounded-3xl bg-slate-50 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">
                        “วันนี้อยากฝึกแค่ไหน?”
                      </span>
                      <span className="text-xs font-bold text-indigo-700">
                        ม.6 · TGAT2 92
                      </span>
                    </div>

                    {/* 3 Quick-Select Mode Buttons (10 / 20 / 70 ข้อ) */}
                    <div className="grid grid-cols-3 gap-2">
                      {mainModes.map((mKey) => {
                        const m = PRACTICE_MODES[mKey];
                        const isActive = selectedMode === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMode(m.id)}
                            className={`p-2.5 rounded-2xl border-[2.5px] border-slate-900 text-center transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-300 shadow-[3px_3px_0px_#0f172a] -translate-y-0.5'
                                : 'bg-white hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono-tabular">
                              {m.badgeIcon} {m.questionCount} ข้อ
                            </div>
                            <div className="text-[11px] font-bold text-slate-700 truncate">
                              {m.id === 'quick'
                                ? 'Quick'
                                : m.id === 'challenge'
                                ? 'Challenge'
                                : 'Mock Exam'}
                            </div>
                            <div className="mt-1 text-[10px] font-mono-tabular font-extrabold text-indigo-800">
                              {m.estimatedTime} · ×{m.rewardMultiplier}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sketch Dropdown [ เลือกชั้น / โหมด v ] */}
                    <div className="pt-1">
                      <select
                        aria-label="เลือกระดับความเข้มข้นในการฝึก"
                        value={selectedMode}
                        onChange={(e) =>
                          setSelectedMode(e.target.value as PracticeModeId)
                        }
                        className="w-full px-4 py-2 rounded-full bg-white border-[2.5px] border-slate-900 font-extrabold text-xs sm:text-sm text-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer focus:outline-none"
                      >
                        <option value="quick">
                          ⚡ ด่าน 10 ข้อ — Quick Practice (~8–10 นาที · รางวัล ×1)
                        </option>
                        <option value="challenge">
                          🔥 ด่าน 20 ข้อ — Challenge Practice (~15–20 นาที · รางวัล ×2)
                        </option>
                        <option value="mock">
                          👑 ด่าน 70 ข้อ — Mock Exam (~50–60 นาที · รางวัล ×4)
                        </option>
                      </select>
                    </div>

                    {/* Iconic [ start ! ] Button from Sketch */}
                    <button
                      onClick={() => startPracticeSession(selectedMode)}
                      className="w-full py-3.5 px-6 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-lg sm:text-xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center gap-2 transition-transform active:translate-y-0.5 cursor-pointer"
                    >
                      <span>start !</span>
                      <span className="text-sm font-bold bg-white/90 px-2.5 py-0.5 rounded-full border-2 border-slate-900">
                        ลุย {PRACTICE_MODES[selectedMode].questionCount} ข้อ
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ===============================================================
                3 PRACTICE MODE DETAIL CARDS + LAST RESULT (Sections 3 & 13)
            =============================================================== */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {mainModes.map((modeKey) => {
                const mode = PRACTICE_MODES[modeKey];
                const isMock = mode.id === 'mock';
                return (
                  <div
                    key={mode.id}
                    className={`rounded-3xl p-5 border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] flex flex-col justify-between ${
                      isMock ? 'bg-amber-100' : 'bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-extrabold text-indigo-700">
                        <span>
                          {mode.badgeIcon} {mode.shortLabel}
                        </span>
                        <span className="font-mono-tabular px-2 py-0.5 rounded-lg bg-white border-2 border-slate-900 text-slate-900">
                          Reward ×{mode.rewardMultiplier}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                        [ {mode.badgeIcon} {mode.questionCount} ข้อ ] {mode.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {mode.subtitle}
                      </p>

                      <div className="mt-3 pt-3 border-t-2 border-slate-200 space-y-1 text-xs font-bold text-slate-800">
                        <div className="flex justify-between">
                          <span>เวลาโดยประมาณ:</span>
                          <span className="font-mono-tabular">{mode.estimatedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>รางวัลคาดหวัง:</span>
                          <span className="font-mono-tabular text-amber-800">
                            {mode.expectedCoinsDisplay} · {mode.expectedXpDisplay}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => startPracticeSession(mode.id)}
                      className="mt-4 w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>เริ่มฝึก {mode.questionCount} ข้อทันที</span>
                    </button>
                  </div>
                );
              })}
            </section>

            {/* LAST RESULT & WEAK TOPIC QUICK START */}
            <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700">
                  <TrendingUp className="w-4 h-4" />
                  <span>LAST RESULT · ผลการฝึกล่าสุด & จุดที่ควรฝึกเพิ่มวันนี้</span>
                </div>
                {player.lastSession ? (
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">
                    โหมดล่าสุด: {player.lastSession.modeTitle} · แม่นยำ{' '}
                    <span className="text-emerald-700 font-mono-tabular">
                      {player.lastSession.accuracyPercent}%
                    </span>{' '}
                    · จุดที่ควรฝึกเพิ่มวันนี้:{' '}
                    <span className="text-rose-600">
                      {player.lastSession.weakestCategory} ({player.lastSession.weakestTopic})
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-700">
                    ยังไม่มีผลบันทึกรอบล่าสุด — ลองเริ่มที่โหมด 10 ข้อเพื่อค้นหาจุดที่ควรฝึกเพิ่มวันนี้!
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  const targetCat =
                    player.lastSession?.weakestCategory ?? 'Reasoning';
                  const targetTopic =
                    player.lastSession?.weakestTopic ?? 'สรุปความ';
                  trackEvent('weak_topic_clicked', {
                    category: targetCat,
                    topic: targetTopic,
                    source: 'home_card',
                  });
                  startPracticeSession('weak_focus', targetCat, targetTopic);
                }}
                className="px-5 py-3 rounded-2xl bg-amber-300 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] inline-flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Target className="w-4 h-4" />
                <span>[ ฝึกจุดที่ควรพัฒนา 10 ข้อ ]</span>
              </button>
            </section>
          </>
        )}

        {/* ===================================================================
            TAB 2: MONSTER TRAIL MAP (Exact Match to Bottom-Right of IMG_2906.jpg)
            Green forest path with cute monsters along the winding trail,
            "Next Up" indicator, 3 cards at the bottom, and EXIT [X] sign!
        =================================================================== */}
        {activeTab === 'trail' && (
          <section className="rounded-3xl bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#16A34A] border-[4px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 relative overflow-hidden min-h-[520px] flex flex-col justify-between">
            {/* Top Banner: Next Up Boss */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="px-4 py-2 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                  🌲 เส้นทางดันเจี้ยนป่าหิมพานต์ (TGAT2 92 Trail)
                </span>
              </div>

              <div className="px-3.5 py-1.5 rounded-2xl bg-rose-500 text-white border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] text-xs font-extrabold">
                Next Up: มังกรจอมเวท 70 ข้อ!
              </div>
            </div>

            {/* Winding Forest Path with Monster Nodes */}
            <div className="relative z-10 my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
              {TGAT2_CATEGORIES.map((catKey, idx) => {
                const cat = TGAT2_TAXONOMY[catKey];
                const mapInfo = DUNGEON_MAPS[idx + 1] ?? DUNGEON_MAPS[0];
                return (
                  <div
                    key={cat.id}
                    onClick={() => startPracticeSession('weak_focus', cat.id, cat.topics[0])}
                    className="group bg-white/95 hover:bg-amber-100 rounded-3xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono-tabular font-extrabold border border-slate-900 mb-2">
                      ด่านที่ {idx + 1} · {cat.id}
                    </span>
                    <img
                      src={mapInfo.monsterImg}
                      alt={cat.thaiName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl border-2 border-slate-900 object-cover"
                    />
                    <h4 className="mt-2 text-sm font-extrabold text-slate-900">
                      {cat.thaiName}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                      คลิกเพื่อลุยด่าน 10 ข้อ
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row of Trail Screen: 3 Mode Cards + Wooden EXIT [X] Sign */}
            <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 pt-4">
              <div className="flex flex-wrap items-center gap-3 mx-auto">
                {mainModes.map((mKey, i) => {
                  const m = PRACTICE_MODES[mKey];
                  return (
                    <button
                      key={m.id}
                      onClick={() => startPracticeSession(m.id)}
                      className="w-28 sm:w-32 rounded-2xl bg-amber-100 hover:bg-amber-200 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] p-2.5 text-center transition-transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-rose-700 mb-1">
                        <span>×{m.rewardMultiplier}</span>
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center border border-slate-900">
                          {i + 1}
                        </span>
                      </div>
                      <div className="py-2 rounded-xl bg-white border-2 border-slate-900 font-mono-tabular font-extrabold text-sm text-slate-900">
                        {m.badgeIcon} {m.questionCount} ข้อ
                      </div>
                      <div className="mt-1 text-[11px] font-extrabold text-slate-800 truncate">
                        {m.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* EXIT [X] Sign from bottom-right of IMG_2906.jpg */}
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-600 text-white border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>EXIT</span>
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 3: STUDY STREAK & COMPANION CLUB (Matches Friends/Streak in IMG_2905.jpg)
            "ไว้ดูความต่อเนื่องการเรียน"
        =================================================================== */}
        {activeTab === 'streak' && (
          <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Streak Overview */}
              <div className="md:col-span-5 space-y-4 border-b md:border-b-0 md:border-r-2 border-slate-200 pb-4 md:pb-0 md:pr-6">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <span>ความต่อเนื่องการเรียน (Study Streak)</span>
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  สะสมไฟต่อเนื่องทุกวันด้วยการฝึกอย่างน้อย 10 ข้อ!
                </p>

                <div className="p-5 rounded-2xl bg-rose-50 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] text-center">
                  <span className="text-4xl font-mono-tabular font-extrabold text-rose-600">
                    🔥 {player.streakDays} วัน
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-700">
                    ตอบโจทย์สะสมแล้ว {player.totalQuestionsAnswered} ข้อ (ถูก{' '}
                    {player.totalCorrectAnswers} ข้อ)
                  </p>
                </div>

                <button
                  onClick={() => startPracticeSession('quick')}
                  className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] font-extrabold text-sm text-slate-950 cursor-pointer"
                >
                  ⚡ รักษาไฟต่อเนื่องวันนี้ (ฝึก 10 ข้อ)
                </button>
              </div>

              {/* Right Column: Session History Log */}
              <div className="md:col-span-7 space-y-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  บันทึกการประลองล่าสุดของคุณ ({player.sessionHistory.length} รอบ)
                </h3>

                {player.sessionHistory.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-400 text-center text-xs font-bold text-slate-500">
                    ยังไม่มีประวัติการฝึกในเครื่องนี้ กดเริ่มโหมด 10 ข้อเพื่อบันทึกสถิติแรก!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {player.sessionHistory.slice(0, 6).map((item) => (
                      <div
                        key={item.sessionId}
                        className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                            <span>{item.modeTitle}</span>
                            <span className="text-xs font-mono-tabular text-emerald-700">
                              แม่นยำ {item.accuracyPercent}% ({item.correctCount}/
                              {item.questionCount})
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                            🔥 จุดที่ควรฝึกเพิ่ม: {item.weakestCategory} ({item.weakestTopic})
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            startPracticeSession(
                              'weak_focus',
                              item.weakestCategory,
                              item.weakestTopic
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 text-xs font-extrabold text-slate-900 shrink-0 cursor-pointer"
                        >
                          ฝึกซ้ำ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 4: STORE (Exact Match to Store Sketch in IMG_2905.jpg)
            Left = Pet Preview | Right = Daily | Skins | Items 6-Grid using earned Coins
        =================================================================== */}
        {activeTab === 'store' && (
          <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-6 h-6 text-amber-500" />
                <span>Store · ร้านค้าไอเทมคู่หู (ใช้ Coins จากการทำโจทย์)</span>
              </h2>
              <span className="text-xs font-bold text-rose-600">
                Daily | Pet Food | Buffs
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Pet Showcase Box */}
              <div className="md:col-span-5 rounded-3xl bg-amber-50 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6 flex flex-col items-center text-center">
                <img
                  src={PET_COMPANION_IMG}
                  alt={player.petName}
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 rounded-3xl border-[3px] border-slate-900 object-cover shadow-md"
                />
                <h3 className="mt-3 text-lg font-extrabold text-slate-900">
                  {player.petName} (Lv.{player.petLevel})
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  ยิ่งฝึกโจทย์โหมด 20 ข้อ (×2) และ 70 ข้อ (×4) ยิ่งได้รับ Coins มาอัปเลเวลคู่หูไวขึ้น!
                </p>
              </div>

              {/* Right 6-Item Grid matching Store Sketch */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'food-pack',
                    title: '🍖 อาหารสัตว์เลี้ยง',
                    desc: 'เพิ่มความอิ่ม +15 XP',
                    cost: 10,
                    action: handleFeedPet,
                  },
                  {
                    id: 'streak-restore',
                    title: '🔥 กู้คืนความต่อเนื่อง',
                    desc: 'เพิ่ม Streak +1 วัน',
                    cost: 40,
                    action: () => {
                      if (player.coins < 40) {
                        setStoreNotice('ต้องใช้ 40 Coins (ไปลุยโจทย์เพื่อสะสม Coins เพิ่มได้เลย!)');
                        return;
                      }
                      const next = {
                        ...player,
                        coins: player.coins - 40,
                        streakDays: player.streakDays + 1,
                      };
                      setPlayer(next);
                      savePlayerState(next);
                      setStoreNotice('ใช้ไอเทมกู้คืน/เพิ่มไฟความต่อเนื่อง +1 วันสำเร็จ!');
                    },
                  },
                  {
                    id: 'exp-scroll',
                    title: '📜 คัมภีร์ EXP +50',
                    desc: 'อัปเลเวลนักรบไวขึ้น',
                    cost: 30,
                    action: () => {
                      if (player.coins < 30) {
                        setStoreNotice('ต้องใช้ 30 Coins!');
                        return;
                      }
                      const next = {
                        ...player,
                        coins: player.coins - 30,
                        xp: player.xp + 50,
                      };
                      setPlayer(next);
                      savePlayerState(next);
                      setStoreNotice('ได้รับ +50 XP จากคัมภีร์นักปราชญ์!');
                    },
                  },
                  {
                    id: 'pet-lv-up',
                    title: '⭐ อัปเลเวลคู่หู +1',
                    desc: 'เพิ่มเลเวลมังกรน้อย',
                    cost: 60,
                    action: () => {
                      if (player.coins < 60) {
                        setStoreNotice('ต้องใช้ 60 Coins!');
                        return;
                      }
                      const next = {
                        ...player,
                        coins: player.coins - 60,
                        petLevel: player.petLevel + 1,
                      };
                      setPlayer(next);
                      savePlayerState(next);
                      setStoreNotice(`อัปเลเวล ${player.petName} เป็น Lv.${player.petLevel + 1} สำเร็จ!`);
                    },
                  },
                  {
                    id: 'gem-exchange',
                    title: '💎 แลกเพชรปราชญ์',
                    desc: 'รับ +5 Gems สะสม',
                    cost: 50,
                    action: () => {
                      if (player.coins < 50) {
                        setStoreNotice('ต้องใช้ 50 Coins!');
                        return;
                      }
                      const next = {
                        ...player,
                        coins: player.coins - 50,
                        gems: player.gems + 5,
                      };
                      setPlayer(next);
                      savePlayerState(next);
                      setStoreNotice('แลกเพชรปราชญ์ +5 Gems สำเร็จ!');
                    },
                  },
                  {
                    id: 'lore-unlock',
                    title: '🎬 ตำนานดันเจี้ยน',
                    desc: 'ชมฉากเปิดดันเจี้ยน',
                    cost: 0,
                    action: () => setScreen('LORE_HERO'),
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border-[2.5px] border-slate-900 shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between text-center"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 mt-1">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={item.action}
                      className="mt-3 w-full py-1.5 px-2 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 font-mono-tabular font-extrabold text-xs text-slate-900 cursor-pointer"
                    >
                      {item.cost === 0 ? 'เปิดดูฟรี' : `Buy (${item.cost} C)`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 5: PROFILE (Exact Match to Profile Sketch in IMG_2905.jpg)
            Left = Character + Customize | Right = Name ✏️, Age/Class, Description, Achievements
        =================================================================== */}
        {activeTab === 'profile' && (
          <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6">
            <h2 className="text-xl font-extrabold text-slate-900 pb-4 border-b-2 border-slate-200">
              Profile · ข้อมูลนักรบผู้พิชิต TGAT2
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Character Box + Customize Button */}
              <div className="md:col-span-5 flex flex-col items-center text-center p-5 rounded-3xl bg-sky-50 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                <img
                  src={PLAYER_DEFAULT_AVATAR}
                  alt={player.playerName}
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 rounded-3xl border-[3px] border-slate-900 object-cover shadow-md"
                />
                <button
                  onClick={() => {
                    setNameDraft(player.playerName);
                    setIsEditingName(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-2xl bg-white hover:bg-amber-100 border-2 border-slate-900 font-extrabold text-xs text-slate-900 shadow-[2px_2px_0px_#0f172a] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Customize ชื่อนักรบ</span>
                </button>
              </div>

              {/* Right Info Fields: Name, Grade, Description, Achievements */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500">Name</span>
                    <p className="text-base font-extrabold text-slate-900">
                      {player.playerName}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs font-extrabold px-3 py-1 rounded-xl bg-amber-200 border-2 border-slate-900">
                    มัธยมศึกษาปีที่ 6 (TCAS)
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-500">
                      Description (เป้าหมายการสอบ)
                    </span>
                    <button
                      onClick={() => setIsEditingBio((b) => !b)}
                      className="text-xs font-extrabold text-indigo-700 cursor-pointer"
                    >
                      {isEditingBio ? 'บันทึก' : 'แก้ไข ✏️'}
                    </button>
                  </div>
                  {isEditingBio ? (
                    <input
                      type="text"
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-amber-50 border-2 border-slate-900 text-sm font-bold"
                    />
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 text-sm font-bold text-slate-800">
                      {userBio}
                    </div>
                  )}
                </div>

                {/* Achievements Row matching sketch */}
                <div>
                  <span className="text-xs font-extrabold text-slate-700">
                    Achievement เหรียญตราเกียรติยศ
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {[
                      {
                        label: 'ก้าวแรก 10 ข้อ',
                        unlocked: player.totalSessionsCompleted >= 1,
                      },
                      {
                        label: 'นักรบ 50 ข้อ',
                        unlocked: player.totalQuestionsAnswered >= 50,
                      },
                      {
                        label: 'แม่นยำ 80%+',
                        unlocked: (player.lastSession?.accuracyPercent ?? 0) >= 80,
                      },
                      {
                        label: 'ผู้พิชิต 70 ข้อ',
                        unlocked: player.sessionHistory.some((s) => s.mode === 'mock'),
                      },
                    ].map((ach, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-2xl border-2 border-slate-900 flex items-center gap-1.5 text-xs font-extrabold ${
                          ach.unlocked
                            ? 'bg-amber-300 text-slate-950'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>{ach.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* =====================================================================
          BOTTOM 5-ICON FLOATING DOCK BAR (Exact Match to IMG_2906 & IMG_2905)
          [ 🌍 Trail ] [ 👥 Streak ] [ 🏠 Home ] [ 🏪 Store ] [ 👤 Profile ]
      ===================================================================== */}
      <nav
        aria-label="แถบเมนูหลักด้านล่าง"
        className="fixed bottom-3 inset-x-0 z-30 flex justify-center px-4 pointer-events-none"
      >
        <div className="pointer-events-auto rounded-full bg-white border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] px-4 py-2 flex items-center gap-3 sm:gap-6">
          {[
            { id: 'trail' as DockTabId, icon: Globe, label: 'แผนที่ด่าน' },
            { id: 'streak' as DockTabId, icon: Users, label: 'ความต่อเนื่อง' },
            { id: 'home' as DockTabId, icon: Home, label: 'หน้าหลัก' },
            { id: 'store' as DockTabId, icon: ShoppingBag, label: 'ร้านค้า' },
            { id: 'profile' as DockTabId, icon: User, label: 'โปรไฟล์' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-pink-400 text-slate-950 border-[2.5px] border-slate-900 shadow-[2px_2px_0px_#0f172a] -translate-y-1'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
