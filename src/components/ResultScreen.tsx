import React, { useEffect } from 'react';
import {
  Award,
  Coins,
  Flame,
  Home,
  RotateCcw,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  PRACTICE_MODES,
  PracticeModeId,
  TGAT2Category,
} from '@/src/config/practiceModes';
import { LastSessionSummary } from '@/src/lib/storage';
import { trackEvent } from '@/src/lib/analytics';

interface ResultScreenProps {
  session: LastSessionSummary;
  onStartFocusedPractice: (category: TGAT2Category, topic: string) => void;
  onStartMode: (mode: PracticeModeId) => void;
  onBackHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  session,
  onStartFocusedPractice,
  onStartMode,
  onBackHome,
}) => {
  const { rewards, topicAnalysis } = session;
  const modeConfig = PRACTICE_MODES[session.mode];
  const monsterDefeated = session.accuracyPercent >= 50;

  useEffect(() => {
    trackEvent('result_viewed', {
      mode: modeConfig.analyticsCode,
      accuracy: session.accuracyPercent,
      completedQuestions: session.completedQuestions,
      weakTopic: session.weakestTopic,
    });
    trackEvent('reward_received', {
      mode: modeConfig.analyticsCode,
      totalCoins: rewards.totalCoins,
      totalXp: rewards.totalXp,
      accuracyBonusCoins: rewards.accuracyBonusCoins,
      completionBonusCoins: rewards.completionBonusCoins,
    });
  }, [modeConfig.analyticsCode, rewards, session]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    if (mins === 0) return `${rem} วินาที`;
    return `${mins} นาที ${rem} วินาที`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#67E8F9] via-[#A7F3D0] to-[#4ADE80] text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* 1. Hero Victory / Session Complete Banner */}
        <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-300 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center text-slate-900 mb-3">
              <Swords className="w-8 h-8 stroke-[2.5]" />
            </div>

            <p className="text-xs font-mono-tabular tracking-widest uppercase text-indigo-700 font-extrabold">
              SESSION COMPLETE! · {modeConfig.title}
            </p>

            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {monsterDefeated
                ? `⚔️ Monster Defeated! ปราบ ${modeConfig.monster.thaiName} สำเร็จ!`
                : `จบการประลองกับ ${modeConfig.monster.thaiName}`}
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              ทำโจทย์ครบ{' '}
              <span className="font-mono-tabular font-extrabold text-slate-900">
                {session.completedQuestions}/{session.questionCount}
              </span>{' '}
              ข้อ · ใช้เวลา {formatDuration(session.durationSeconds)}
            </p>

            {/* Primary Score Metrics */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <div className="p-4 rounded-2xl bg-emerald-100 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                <p className="text-xs font-bold text-slate-700">Correct (ตอบถูก)</p>
                <p className="mt-1 text-xl sm:text-2xl font-mono-tabular font-extrabold text-emerald-800">
                  {session.correctCount} / {session.questionCount}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-100 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                <p className="text-xs font-bold text-slate-700">ตอบผิด / หมดเวลา</p>
                <p className="mt-1 text-xl sm:text-2xl font-mono-tabular font-extrabold text-rose-700">
                  {session.incorrectCount} ข้อ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-100 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                <p className="text-xs font-bold text-slate-700">Accuracy (แม่นยำ)</p>
                <p className="mt-1 text-xl sm:text-2xl font-mono-tabular font-extrabold text-amber-800">
                  {session.accuracyPercent}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-100 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                <p className="text-xs font-bold text-slate-700">Reward Multiplier</p>
                <p className="mt-1 text-xl sm:text-2xl font-mono-tabular font-extrabold text-sky-800">
                  ×{rewards.modeMultiplier}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Reward Breakdown & Tonight's Performance Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reward Calculation Card (5 cols) */}
          <section className="lg:col-span-5 rounded-3xl bg-white border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>Rewards (รางวัลที่ได้)</span>
                </h2>
                <span className="text-xs font-mono-tabular font-extrabold text-indigo-700">
                  โหมด ×{rewards.modeMultiplier}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm font-semibold">
                <div className="flex items-center justify-between text-slate-700">
                  <span>รางวัลพื้นฐาน (×{rewards.modeMultiplier})</span>
                  <span className="font-mono-tabular font-extrabold text-slate-900">
                    +{rewards.baseCoins} Coins · +{rewards.baseXp} XP
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span>โบนัสแม่นยำ ({rewards.accuracyBonusLabel})</span>
                  <span className="font-mono-tabular font-extrabold text-emerald-700">
                    +{rewards.accuracyBonusCoins} Coins · +{rewards.accuracyBonusXp} XP
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span>🔥 โบนัสพิชิตครบ {session.questionCount} ข้อ</span>
                  <span className="font-mono-tabular font-extrabold text-amber-700">
                    +{rewards.completionBonusCoins} Coins · +{rewards.completionBonusXp} XP
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-slate-900 flex items-center justify-between bg-amber-100 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                TOTAL REWARDS
              </span>
              <div className="text-right">
                <p className="text-xl font-mono-tabular font-extrabold text-amber-700">
                  +{rewards.totalCoins} Coins
                </p>
                <p className="text-sm font-mono-tabular font-extrabold text-indigo-700">
                  +{rewards.totalXp} XP
                </p>
              </div>
            </div>
          </section>

          {/* Tonight's Performance & Weakest Areas (7 cols) */}
          <section className="lg:col-span-7 rounded-3xl bg-white border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>Tonight&apos;s Performance</span>
                </h2>
              </div>

              <div className="mt-4 space-y-3.5">
                {topicAnalysis.categoryBreakdowns.map((cat) => {
                  const hasQuestions = cat.total > 0;
                  const barColor =
                    cat.accuracyPercent >= 75
                      ? 'bg-emerald-500'
                      : cat.accuracyPercent >= 50
                      ? 'bg-amber-400'
                      : 'bg-rose-500';

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-slate-900">
                          {cat.category}{' '}
                          <span className="text-slate-500 text-xs">({cat.thaiName})</span>
                        </span>
                        <span className="font-mono-tabular font-extrabold text-slate-900">
                          {hasQuestions
                            ? `${cat.accuracyPercent}% (${cat.correct}/${cat.total})`
                            : 'ไม่ได้สุ่มในรอบนี้'}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${hasQuestions ? cat.accuracyPercent : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Constructive Weakest Areas List (Section 11) */}
              <div className="mt-5 p-4 rounded-2xl bg-amber-50 border-2 border-slate-900">
                <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-rose-600" />
                  <span>จุดที่ควรฝึกเพิ่มวันนี้ (จากหลักฐานในรอบนี้)</span>
                </p>

                <ol className="mt-2 space-y-1 text-xs sm:text-sm font-bold text-slate-800">
                  {topicAnalysis.weakestCategories.map((item, idx) => (
                    <li
                      key={item.category}
                      className="flex items-center justify-between py-1 border-b border-slate-200 last:border-none"
                    >
                      <span>
                        {idx + 1}. {item.category} ({item.thaiName})
                      </span>
                      <span className="font-mono-tabular text-rose-700">
                        {item.accuracyPercent}%
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </div>

        {/* 3. Next Practice Recommendation CTA (Section 12) */}
        <section className="rounded-3xl bg-white border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700">
              <Sparkles className="w-4 h-4" />
              <span>NEXT PRACTICE RECOMMENDATION</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              “{topicAnalysis.recommendationHeadline}”
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {topicAnalysis.recommendationSubtext}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                trackEvent('weak_topic_clicked', {
                  category: topicAnalysis.recommendedCategory,
                  topic: topicAnalysis.recommendedTopic,
                });
                trackEvent('next_practice_clicked', {
                  targetMode: 'weak_focus',
                  category: topicAnalysis.recommendedCategory,
                });
                onStartFocusedPractice(
                  topicAnalysis.recommendedCategory,
                  topicAnalysis.recommendedTopic
                );
              }}
              className="flex-1 md:flex-initial px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] inline-flex items-center justify-center gap-2 transition-transform active:translate-y-0.5 whitespace-nowrap cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>[ ฝึกต่อ 10 ข้อ ]</span>
            </button>

            {session.mode === 'quick' && (
              <button
                onClick={() => {
                  trackEvent('next_practice_clicked', { targetMode: '20' });
                  onStartMode('challenge');
                }}
                className="px-4 py-3 rounded-2xl bg-sky-300 hover:bg-sky-200 text-slate-950 font-extrabold text-sm border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] inline-flex items-center justify-center gap-2 transition-transform active:translate-y-0.5 whitespace-nowrap cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>ลอง 20 ข้อ (×2)</span>
              </button>
            )}

            <button
              onClick={() => {
                trackEvent('next_practice_clicked', { targetMode: session.mode });
                onStartMode(session.mode);
              }}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ซ้ำโหมดเดิม</span>
            </button>

            <button
              onClick={onBackHome}
              className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>หน้าหลัก</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
