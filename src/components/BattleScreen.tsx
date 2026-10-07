import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flame,
  Settings,
  ShieldAlert,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { CompactMonsterEyes } from '@/components/ui/mouse-following-eyes';
import {
  PET_COMPANION_IMG,
  PRACTICE_MODES,
  PracticeModeId,
  TGAT2_TAXONOMY,
} from '@/src/config/practiceModes';
import {
  AnswerVerificationResult,
  PublicQuestion,
  verifySubmittedAnswer,
} from '@/src/systems/questionSelector';
import { QuestionAttemptLog } from '@/src/systems/topicAnalyzer';
import { trackEvent } from '@/src/lib/analytics';
import { soundFX } from '@/src/lib/soundEffects';
import { QuestionDiagram } from '@/src/components/QuestionDiagram';

interface BattleScreenProps {
  mode: PracticeModeId;
  questions: PublicQuestion[];
  playerName: string;
  playerLevel: number;
  petName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCompleteSession: (attempts: QuestionAttemptLog[], durationSeconds: number) => void;
  onAbandonSession: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  mode,
  questions,
  playerName,
  playerLevel,
  petName,
  soundEnabled,
  onToggleSound,
  onCompleteSession,
  onAbandonSession,
}) => {
  const modeConfig = PRACTICE_MODES[mode];
  const totalQuestions = questions.length;
  const damagePerCorrect = Math.ceil(
    modeConfig.monster.maxHp / Math.max(1, totalQuestions)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(modeConfig.monster.maxHp);
  const [playerHp, setPlayerHp] = useState(100);
  const [comboCount, setComboCount] = useState(0);
  const [attempts, setAttempts] = useState<QuestionAttemptLog[]>([]);

  // Draft selection before pressing the Sword [⚔️] button (or double-clicking choice)
  const [draftChoice, setDraftChoice] = useState<number | null>(null);
  const [instantSubmitMode, setInstantSubmitMode] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Submission & Feedback State
  const [verification, setVerification] = useState<AnswerVerificationResult | null>(
    null
  );
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [battleEffect, setBattleEffect] = useState<
    'none' | 'monster_hit' | 'player_hit'
  >('none');
  const [floatingDamage, setFloatingDamage] = useState<string | null>(null);

  // Timers
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(
    modeConfig.questionTimerSeconds
  );
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(
    modeConfig.sessionTimerSeconds
  );
  const questionStartRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());

  // Image error resilience
  const [petImgError, setPetImgError] = useState(false);
  const [monsterImgError, setMonsterImgError] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Reset per-question timer when advancing to next question
  useEffect(() => {
    questionStartRef.current = Date.now();
    setDraftChoice(null);
    if (modeConfig.timerType === 'per_question') {
      setQuestionSecondsLeft(modeConfig.questionTimerSeconds);
    }
  }, [currentIndex, modeConfig.questionTimerSeconds, modeConfig.timerType]);

  // Countdown tick
  useEffect(() => {
    if (verification !== null) return;

    const interval = window.setInterval(() => {
      if (modeConfig.timerType === 'per_question') {
        setQuestionSecondsLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(interval);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setSessionSecondsLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(interval);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentIndex, verification, modeConfig.timerType]);

  const triggerHitAnimation = (
    target: 'monster_hit' | 'player_hit',
    damageText: string
  ) => {
    setBattleEffect(target);
    setFloatingDamage(damageText);
    window.setTimeout(() => {
      setBattleEffect('none');
      setFloatingDamage(null);
    }, 700);
  };

  const handleTimeout = () => {
    if (!currentQuestion || verification !== null) return;
    const spent = Math.max(
      1,
      Math.round((Date.now() - questionStartRef.current) / 1000)
    );
    const result = verifySubmittedAnswer(currentQuestion.id, null);

    setVerification(result);
    setIsTimedOut(true);
    setComboCount(0);
    setPlayerHp((hp) => Math.max(10, hp - 12));
    soundFX.playDamageTaken(soundEnabled);
    triggerHitAnimation('player_hit', 'หมดเวลา! -12 HP');

    const logItem: QuestionAttemptLog = {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      topic: currentQuestion.topic,
      isCorrect: false,
      isTimeout: true,
      timeSpentSeconds: spent,
      selectedChoice: null,
      correctAnswer: result.correctAnswer,
    };
    setAttempts((prev) => [...prev, logItem]);

    trackEvent('question_timeout', {
      mode: modeConfig.analyticsCode,
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      topic: currentQuestion.topic,
      questionIndex: currentIndex + 1,
    });
  };

  const executeSubmitAnswer = (choiceIndex: number) => {
    if (!currentQuestion || verification !== null) return;
    const spent = Math.max(
      1,
      Math.round((Date.now() - questionStartRef.current) / 1000)
    );
    const result = verifySubmittedAnswer(currentQuestion.id, choiceIndex);
    setVerification(result);
    setIsTimedOut(false);

    if (result.isCorrect) {
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      setMonsterHp((hp) => Math.max(0, hp - damagePerCorrect));
      soundFX.playAttackHit(soundEnabled);
      triggerHitAnimation(
        'monster_hit',
        nextCombo >= 3
          ? `CRITICAL ×${nextCombo}! -${damagePerCorrect} HP`
          : `ฟันเข้าเป้า! -${damagePerCorrect} HP`
      );
    } else {
      setComboCount(0);
      setPlayerHp((hp) => Math.max(10, hp - 15));
      soundFX.playDamageTaken(soundEnabled);
      triggerHitAnimation('player_hit', 'โดนโจมตีสวน! -15 HP');
    }

    const logItem: QuestionAttemptLog = {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      topic: currentQuestion.topic,
      isCorrect: result.isCorrect,
      isTimeout: false,
      timeSpentSeconds: spent,
      selectedChoice: choiceIndex,
      correctAnswer: result.correctAnswer,
    };
    setAttempts((prev) => [...prev, logItem]);

    trackEvent('question_answered', {
      mode: modeConfig.analyticsCode,
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty,
      isCorrect: result.isCorrect,
      timeSpentSeconds: spent,
      questionIndex: currentIndex + 1,
    });
  };

  const handleChoiceClick = (idx: number) => {
    if (verification !== null) return;
    if (instantSubmitMode || draftChoice === idx) {
      executeSubmitAnswer(idx);
    } else {
      setDraftChoice(idx);
    }
  };

  const handleSwordSubmit = () => {
    if (verification !== null) {
      handleNextQuestion();
      return;
    }
    if (draftChoice !== null) {
      executeSubmitAnswer(draftChoice);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= totalQuestions) {
      const totalDuration = Math.max(
        1,
        Math.round((Date.now() - sessionStartRef.current) / 1000)
      );
      soundFX.playVictoryFanfare(soundEnabled);
      onCompleteSession(attempts, totalDuration);
      return;
    }

    setVerification(null);
    setIsTimedOut(false);
    setDraftChoice(null);
    setCurrentIndex((idx) => idx + 1);
  };

  const formatTimer = (sec: number) => {
    if (modeConfig.timerType === 'per_question') {
      return `${sec}s`;
    }
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const difficultyThai = {
    easy: 'ระดับง่าย',
    medium: 'ระดับกลาง',
    hard: 'ระดับยาก',
  }[currentQuestion.difficulty];

  const monsterHpPercent = Math.round(
    (monsterHp / modeConfig.monster.maxHp) * 100
  );

  const isTimerUrgent =
    modeConfig.timerType === 'per_question'
      ? questionSecondsLeft <= 5
      : sessionSecondsLeft <= 180;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden select-none bg-gradient-to-b from-[#67E8F9] via-[#7DD3FC] to-[#4ADE80]">
      {/* Rolling Green Meadow Hills Backdrop (matching IMG_2906.jpg bottom-left sketch) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-[#86EFAC] via-[#4ADE80] to-[#22C55E] rounded-t-[60px] border-t-[3px] border-slate-900 pointer-events-none"
        style={{
          boxShadow: 'inset 0 12px 0 rgba(255,255,255,0.35)',
        }}
      />

      {/* Top HUD Bar: < Back on Left, Question Counter + Timer + ⚙️ Gear on Right */}
      <header className="relative z-20 max-w-5xl w-full mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onAbandonSession}
            aria-label="กลับหน้าหลัก"
            className="w-11 h-11 rounded-xl bg-white hover:bg-amber-100 text-slate-900 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center transition-transform active:translate-y-0.5 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-white/95 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] text-slate-900 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span>
              {modeConfig.badgeIcon} {modeConfig.title}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-indigo-700">
              ข้อ {currentIndex + 1}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Right Controls: Timer + Settings Gear */}
        <div className="flex items-center gap-2.5 relative">
          <div
            className={`px-3.5 py-1.5 rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] font-mono-tabular text-sm font-extrabold flex items-center gap-1.5 ${
              isTimerUrgent
                ? 'bg-rose-500 text-white animate-bounce'
                : 'bg-amber-300 text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 stroke-[2.5]" />
            <span>
              {formatTimer(
                modeConfig.timerType === 'per_question'
                  ? questionSecondsLeft
                  : sessionSecondsLeft
              )}
            </span>
          </div>

          <button
            onClick={() => setShowSettingsMenu((s) => !s)}
            aria-label="ตั้งค่าการต่อสู้"
            className="w-11 h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center transition-transform active:translate-y-0.5 cursor-pointer"
          >
            <Settings className="w-5 h-5 stroke-[2.5]" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-13 w-64 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] p-4 z-40 text-slate-900 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold border-b-2 border-slate-200 pb-2">
                <span>ตั้งค่าฉากต่อสู้</span>
                <button
                  onClick={() => setShowSettingsMenu(false)}
                  className="text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  ปิด
                </button>
              </div>
              <button
                onClick={onToggleSound}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-xs font-bold flex items-center justify-between cursor-pointer"
              >
                <span>เสียงเอฟเฟกต์</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4" /> เปิดอยู่
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-rose-600" /> ปิดอยู่
                    </>
                  )}
                </span>
              </button>
              <button
                onClick={() => setInstantSubmitMode((v) => !v)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-xs font-bold flex items-center justify-between cursor-pointer"
              >
                <span>การส่งคำตอบ</span>
                <span className="text-indigo-700">
                  {instantSubmitMode ? 'คลิกเดียวโจมตี' : 'เลือก + กดดาบ ⚔️'}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Sketch Layout Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 pb-6 pt-2 flex flex-col justify-between gap-4">
        {/* 1. TOP FLOATING QUESTION BOX [ โจทย์ ] (Exact match to IMG_2906.jpg) */}
        <section
          aria-label="กรอบโจทย์ข้อสอบ"
          className="w-full max-w-3xl mx-auto rounded-2xl bg-white text-slate-900 border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-4 sm:p-6"
        >
          {/* Metadata row inside Question Box */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-semibold pb-2.5 mb-2.5 border-b-2 border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-indigo-700 font-bold">
                {currentQuestion.category} ({TGAT2_TAXONOMY[currentQuestion.category].thaiName})
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-900 font-bold">{currentQuestion.topic}</span>
              <span aria-hidden="true">·</span>
              <span>{difficultyThai}</span>
            </div>
            <span className="font-mono-tabular text-slate-500">
              #{currentQuestion.id}
            </span>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-bold leading-relaxed text-slate-900 whitespace-pre-line">
            {currentQuestion.question}
          </div>

          {/* Spatial / Reasoning Diagram if applicable */}
          {currentQuestion.visualPattern && (
            <div className="mt-3">
              <QuestionDiagram visualPattern={currentQuestion.visualPattern} />
            </div>
          )}
        </section>

        {/* Floating Damage Banner */}
        {floatingDamage && (
          <div className="fixed inset-x-0 top-1/3 z-30 flex justify-center pointer-events-none">
            <div
              className={`px-5 py-2 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] font-mono-tabular font-extrabold text-base sm:text-lg ${
                battleEffect === 'monster_hit'
                  ? 'bg-amber-300 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {floatingDamage}
            </div>
          </div>
        )}

        {/* 2. MIDDLE + BOTTOM BATTLEFIELD: Left = Pet/Player, Right = Monster + Sword [⚔️] + Stacked Choices */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pt-2">
          {/* LEFT ZONE (5 cols): Player's Green Companion Pet + Red HP Bar above head + Ground Oval Shadow */}
          <div className="lg:col-span-5 flex flex-col items-center justify-end relative pb-2">
            {/* Player / Pet HP Bar ("เลือด") floating above character just like sketch */}
            <div className="w-48 sm:w-56 mb-3 bg-white/95 rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] p-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 mb-1">
                <span className="truncate">{petName || playerName}</span>
                <span className="font-mono-tabular text-rose-600">
                  HP {playerHp}/100
                </span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-200"
                  style={{ width: `${playerHp}%` }}
                />
              </div>
              {comboCount > 1 && (
                <div className="mt-1 text-[11px] font-extrabold text-amber-600 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>COMBO ×{comboCount}</span>
                </div>
              )}
            </div>

            {/* Pet Character Sprite */}
            <div
              className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] bg-white animate-float-slow ${
                battleEffect === 'player_hit' ? 'animate-hit-shake ring-4 ring-rose-500' : ''
              }`}
            >
              {!petImgError ? (
                <img
                  src={PET_COMPANION_IMG}
                  alt={petName}
                  referrerPolicy="no-referrer"
                  onError={() => setPetImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-200 text-slate-900 font-bold">
                  Lv.{playerLevel}
                </div>
              )}
            </div>

            {/* Dark Green Ground Oval Shadow under Player Pet (Exact match to sketch) */}
            <div className="w-44 sm:w-52 h-8 -mt-4 rounded-full bg-emerald-900/40 border-2 border-slate-900/40" />
          </div>

          {/* RIGHT ZONE (7 cols): Monster + HP Bar on top, Circular Sword Button [⚔️] + Stacked Choices below */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-end gap-4">
            {/* Enemy Monster with Floating Red HP Bar above head */}
            <div className="w-full flex flex-col items-center lg:items-end lg:pr-8">
              <div className="w-52 sm:w-64 mb-2.5 bg-white/95 rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] p-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 mb-1">
                  <span className="truncate">{modeConfig.monster.thaiName}</span>
                  <span className="font-mono-tabular text-rose-600">
                    {monsterHp}/{modeConfig.monster.maxHp}
                  </span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-200"
                    style={{ width: `${monsterHpPercent}%` }}
                  />
                </div>
              </div>

              <div className="relative flex flex-col items-center">
                <div
                  className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-[3px] border-slate-900 shadow-[5px_5px_0px_#0f172a] bg-white animate-float-slow ${
                    battleEffect === 'monster_hit'
                      ? 'animate-hit-shake ring-4 ring-amber-400'
                      : ''
                  }`}
                >
                  {!monsterImgError ? (
                    <img
                      src={modeConfig.monster.imageUrl}
                      alt={modeConfig.monster.thaiName}
                      referrerPolicy="no-referrer"
                      onError={() => setMonsterImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-200 text-slate-900">
                      <ShieldAlert className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Live Mouse-Following Eyes on Monster */}
                <div className="-mt-3 z-20">
                  <CompactMonsterEyes
                    size="sm"
                    irisColor={modeConfig.monster.irisColor}
                  />
                </div>

                {/* Dark Green Ground Oval Shadow under Monster */}
                <div className="w-36 sm:w-44 h-7 -mt-2 rounded-full bg-emerald-900/40 border-2 border-slate-900/40" />
              </div>
            </div>

            {/* Bottom Interaction Row: Circular Sword Attack Button [⚔️ ส่งคำตอบ] + Stacked Choice Bars */}
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Iconic Circular Sword Button [ ⚔️ ส่งคำตอบ ] from Sketch */}
              <div className="flex flex-col items-center shrink-0">
                <button
                  onClick={handleSwordSubmit}
                  disabled={verification === null && draftChoice === null}
                  title="ส่งคำตอบโจมตีมอนสเตอร์"
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    verification !== null
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-bounce'
                      : draftChoice !== null
                      ? 'bg-rose-500 hover:bg-rose-400 text-white scale-105'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  {verification !== null ? (
                    <>
                      <ArrowRight className="w-7 h-7 stroke-[3]" />
                      <span className="text-[10px] font-extrabold mt-0.5">
                        ข้อต่อไป
                      </span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-7 h-7 stroke-[2.5]" />
                      <span className="text-[10px] font-extrabold mt-0.5">
                        ส่งคำตอบ
                      </span>
                    </>
                  )}
                </button>
                <span className="mt-1 text-[11px] font-extrabold text-slate-900 bg-white/80 px-2 py-0.5 rounded-md border border-slate-900">
                  {verification !== null
                    ? 'กดเพื่อไปต่อ'
                    : draftChoice !== null
                    ? 'กดดาบเพื่อโจมตี!'
                    : 'เลือกคำตอบก่อน'}
                </span>
              </div>

              {/* Stacked Rounded White Choice Bars (คำตอบ 1, คำตอบ 2, คำตอบ 3, คำตอบ 4) */}
              <div className="flex-1 w-full space-y-2.5">
                {currentQuestion.choices.map((choiceText, idx) => {
                  const isSubmitted = verification !== null;
                  const isDraftSelected = !isSubmitted && draftChoice === idx;
                  const isSubmittedChoice =
                    isSubmitted && verification?.selectedChoice === idx;
                  const isCorrectChoice =
                    isSubmitted && verification?.correctAnswer === idx;
                  const isWrongSelected =
                    isSubmitted && isSubmittedChoice && !verification?.isCorrect;

                  let barStyle =
                    'bg-white hover:bg-amber-50 text-slate-900 border-slate-900';

                  if (isDraftSelected) {
                    barStyle =
                      'bg-amber-300 text-slate-950 border-slate-900 -translate-x-1 ring-2 ring-slate-900';
                  } else if (isSubmitted) {
                    if (isCorrectChoice) {
                      barStyle = 'bg-emerald-300 text-slate-950 border-slate-900';
                    } else if (isWrongSelected) {
                      barStyle = 'bg-rose-300 text-slate-950 border-slate-900';
                    } else {
                      barStyle = 'bg-white/70 text-slate-500 border-slate-700';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isSubmitted}
                      onClick={() => handleChoiceClick(idx)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border-[3px] shadow-[4px_4px_0px_#0f172a] transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${barStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm sm:text-base font-bold leading-snug">
                          {choiceText}
                        </span>
                      </div>

                      {isDraftSelected && (
                        <span className="text-xs font-extrabold text-slate-900 shrink-0 whitespace-nowrap bg-white/80 px-2 py-0.5 rounded-lg border border-slate-900">
                          กดซ้ำหรือกด ⚔️
                        </span>
                      )}

                      {isSubmitted && isCorrectChoice && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-950 bg-emerald-400 px-2.5 py-1 rounded-lg border-2 border-slate-900 shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="w-4 h-4" /> ถูกต้อง
                        </span>
                      )}

                      {isSubmitted && isWrongSelected && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-rose-600 px-2.5 py-1 rounded-lg border-2 border-slate-900 shrink-0 whitespace-nowrap">
                          <XCircle className="w-4 h-4" /> พลาด
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Post-Submission Explanation Drawer */}
        {verification && (
          <section className="w-full max-w-4xl mx-auto rounded-2xl bg-white text-slate-900 border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {verification.isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700">
                      <Sparkles className="w-5 h-5" />
                      โจมตีสำเร็จ! ตอบถูกต้อง (-{damagePerCorrect} HP)
                    </span>
                  ) : isTimedOut ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-rose-600">
                      <Clock className="w-5 h-5" />
                      หมดเวลา! คำตอบที่ถูกคือข้อ {verification.correctAnswer + 1}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-rose-600">
                      <ShieldAlert className="w-5 h-5" />
                      ตอบผิด! คำตอบที่ถูกคือข้อ {verification.correctAnswer + 1}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  <strong className="text-slate-900">เฉลย: </strong>
                  {verification.explanation}
                </p>
              </div>

              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm border-[3px] border-slate-900 shadow-[3px_3px_0px_#0f172a] inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <span>
                  {currentIndex + 1 >= totalQuestions
                    ? 'ดูผลสรุป & รับรางวัล!'
                    : 'ลุยข้อต่อไป'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
