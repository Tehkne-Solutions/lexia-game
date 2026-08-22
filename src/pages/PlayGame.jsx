import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lexiaPlatform } from '@/platform';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Volume2, Zap } from 'lucide-react';

import DrawingCanvas from '@/components/game/DrawingCanvas';
import LetterDisplay from '@/components/game/LetterDisplay';
import MascotAvatar from '@/components/game/MascotAvatar';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';
import LetterSelector from '@/components/game/LetterSelector';
import AiResultBadge from '@/components/game/AiResultBadge';
import AchievementToast from '@/components/game/AchievementToast';
import DailyChallengeCard from '@/components/game/DailyChallengeCard';
import SessionQuestBar from '@/components/game/SessionQuestBar';
import SessionQuestComplete from '@/components/game/SessionQuestComplete';
import GameplayHud from '@/components/game/GameplayHud';
import GameplayResultActions from '@/components/game/GameplayResultActions';
import GameActionButton from '@/components/game/GameActionButton';

import { ALPHABET, getLetterData } from '@/lib/alphabetData';
import { createNewCard, reviewCard, calculateMastery, pickNextLetter } from '@/lib/fsrs';
import { getInitialLearningLetter } from '@/learning/engine';
import { getJourneyState, JOURNEY_STAGES } from '@/game/journeyEngine';
import { advanceSessionQuest, createSessionQuest } from '@/game/sessionQuestEngine';
import { loadLearnerReviewContinuation, navigateLearnerReviewContinuation } from '@/game/learnerReviewRuntime';
import { buildStats, getEarnedAchievements } from '@/lib/achievements';
import {
  getChallengeStarMultiplier,
  getDailyChallenge,
  getNextChallengeTarget,
} from '@/lib/dailyChallenge';
import { getLetterFeedbackSpeech } from '@/lib/ttsHints';
import { getSpokenFeedback, getStreakPhrase } from '@/lib/motivationalPhrases';
import { speak, playCorrectSound, playWrongSound, playClickSound } from '@/lib/sounds';

function isCanonicalLetter(letter) {
  return ALPHABET.some((item) => item.letter === letter);
}

export default function PlayGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const isPracticeMode = urlParams.get('mode') === 'practice';
  const isDailyMode = urlParams.get('daily') === '1';
  const isReviewMode = urlParams.get('review') === '1';
  const requestedDailyTargetKey = urlParams.get('dailyTarget');
  const requestedDailyLetter = ALPHABET.some((item) => item.letter === requestedDailyTargetKey)
    ? requestedDailyTargetKey
    : null;
  const requestedReviewTargetKey = isReviewMode ? urlParams.get('reviewTarget') : null;
  const requestedReviewLetter = ALPHABET.some((item) => item.letter === requestedReviewTargetKey)
    ? requestedReviewTargetKey
    : null;
  const [currentLetter, setCurrentLetter] = useState(() => requestedDailyLetter || requestedReviewLetter || getInitialLearningLetter(ALPHABET));
  const [phase, setPhase] = useState('draw');
  const [aiResult, setAiResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ stars: 0, message: '' });
  const [showSelector, setShowSelector] = useState(false);
  const [mascotExpression, setMascotExpression] = useState('encouraging');
  const [mascotMessage, setMascotMessage] = useState('');
  const [newAchievement, setNewAchievement] = useState(null);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [starMultiplier, setStarMultiplier] = useState(1);
  const [sessionQuest, setSessionQuest] = useState(null);
  const [showQuestComplete, setShowQuestComplete] = useState(false);
  const prevStatsRef = useRef(null);
  const journeySyncRef = useRef(Boolean((isDailyMode && requestedDailyLetter) || (isReviewMode && requestedReviewLetter)));
  const sessionQuestInitializedRef = useRef(false);
  const sessionQuestRef = useRef(null);
  const encounterSequenceRef = useRef(0);
  const activeEncounterRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: allProgress = [], isFetched: hasLoadedProgress } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.letter] = p; });

  const totalStars = allProgress.reduce((sum, p) => sum + (p.stars_earned || 0), 0);
  const totalStreak = allProgress.reduce((max, p) => Math.max(max, p.streak || 0), 0);
  const masteredCount = allProgress.filter(p => calculateMastery(p) >= 80).length;
  const journey = getJourneyState(allProgress);
  const isGuidedMission = !isPracticeMode && !isReviewMode && journey.stage === JOURNEY_STAGES.LETTERS;
  const isCurrentMissionTarget = isGuidedMission && journey.target === currentLetter;

  useEffect(() => {
    if (isPracticeMode || journeySyncRef.current || !hasLoadedProgress) return;
    if (isReviewMode) {
      setCurrentLetter(requestedReviewLetter || pickNextLetter(allProgress, currentLetter, ALPHABET));
    } else if (journey.stage === JOURNEY_STAGES.LETTERS && journey.target) {
      setCurrentLetter(journey.target);
    }
    journeySyncRef.current = true;
  }, [hasLoadedProgress, journey.stage, journey.target, allProgress, currentLetter]);

  useEffect(() => {
    if (sessionQuestInitializedRef.current || !hasLoadedProgress) return;
    const initialQuest = createSessionQuest(journey, { enabled: isGuidedMission });
    sessionQuestRef.current = initialQuest;
    setSessionQuest(initialQuest);
    sessionQuestInitializedRef.current = true;
  }, [hasLoadedProgress, isGuidedMission, journey.stage, journey.worldId]);

  useEffect(() => {
    if (!hasLoadedProgress) return;
    setDailyChallenge(getDailyChallenge(allProgress));
  }, [hasLoadedProgress, allProgress]);

  useEffect(() => {
    if (allProgress.length > 0 && !prevStatsRef.current) {
      prevStatsRef.current = buildStats(allProgress);
    }
  }, [allProgress]);

  const saveMutation = useMutation({
    mutationFn: async (/** @type {{ letter: string, gradeValue: number, encounterId: string }} */ variables) => {
      const { letter, gradeValue, encounterId } = variables;
      const existing = progressMap[letter];
      const isCorrect = gradeValue >= 3;
      const challenge = getDailyChallenge(allProgress);
      const effectiveMultiplier = isCorrect
        ? getChallengeStarMultiplier(challenge, letter)
        : 1;

      const card = existing ? {
        stability: existing.stability || 0,
        difficulty: existing.difficulty || 0,
        interval: existing.interval || 0,
        repetitions: existing.repetitions || 0,
        nextReview: existing.next_review || new Date().toISOString(),
        lastGrade: existing.last_grade || 0,
      } : createNewCard();

      const reviewed = reviewCard(card, gradeValue);
      const newStreak = isCorrect ? (existing?.streak || 0) + 1 : 0;
      const starsEarned = isCorrect ? 1 : 0;
      const newStars = (existing?.stars_earned || 0) + starsEarned;

      const data = {
        child_name: 'Jogador',
        letter,
        stability: reviewed.stability,
        difficulty: reviewed.difficulty,
        interval: reviewed.interval,
        repetitions: reviewed.repetitions,
        next_review: reviewed.nextReview,
        total_attempts: (existing?.total_attempts || 0) + 1,
        correct_attempts: (existing?.correct_attempts || 0) + (isCorrect ? 1 : 0),
        streak: newStreak,
        last_grade: gradeValue,
        stars_earned: newStars,
        level: Math.floor(newStars / 5) + 1,
      };

      if (existing) {
        await lexiaPlatform.progress.update(existing.id, data);
      } else {
        await lexiaPlatform.progress.create(data);
      }

      return {
        isCorrect,
        newStreak,
        letter,
        starsEarned: isCorrect ? effectiveMultiplier : 0,
        effectiveMultiplier,
        encounterId,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['childProgress'] });
      setDailyChallenge(getDailyChallenge(allProgress));
      setStarMultiplier(result.effectiveMultiplier);

      let questJustCompleted = false;
      if (!isPracticeMode && result.isCorrect && result.encounterId && sessionQuestRef.current?.enabled) {
        const previousQuest = sessionQuestRef.current;
        const nextQuest = advanceSessionQuest(previousQuest, result);
        if (nextQuest !== previousQuest) {
          sessionQuestRef.current = nextQuest;
          setSessionQuest(nextQuest);
          questJustCompleted = !previousQuest.completed && nextQuest.completed;
          if (questJustCompleted) {
            setShowCelebration(false);
            setShowQuestComplete(true);
            setMascotExpression('excited');
            setMascotMessage('Expedição concluída!');
            setTimeout(() => speak(nextQuest.completionMessage), 500);
          }
        }
      }

      setTimeout(() => {
        const fresh = queryClient.getQueryData(['childProgress']) || allProgress;
        const currentStats = buildStats(fresh);
        const prevStats = prevStatsRef.current || { masteredCount: 0, totalStars: 0, maxStreak: 0, accuracy: 0, totalAttempts: 0 };
        const prevIds = new Set(getEarnedAchievements(prevStats).map(a => a.id));
        const newlyEarned = getEarnedAchievements(currentStats).filter(a => !prevIds.has(a.id));
        if (newlyEarned.length > 0) setNewAchievement(newlyEarned[0]);
        prevStatsRef.current = currentStats;
      }, 600);

      if (!questJustCompleted && result.isCorrect && result.newStreak >= 3 && result.newStreak % 3 === 0) {
        setCelebrationData({ stars: 3, message: `Combo ${result.newStreak}x! 🔥` });
        setShowCelebration(true);
        setTimeout(() => speak(getStreakPhrase()), 1500);
      } else if (!questJustCompleted && result.isCorrect && result.effectiveMultiplier > 1) {
        setMascotMessage(`⭐×${result.effectiveMultiplier} Desafio diário!`);
      }
    },
  });

  const handleEvaluate = useCallback(async (imageDataUrl) => {
    const encounterId = `letter-${currentLetter}-${++encounterSequenceRef.current}`;
    activeEncounterRef.current = encounterId;
    setMascotExpression('thinking');
    setMascotMessage('Deixa eu ver...');

    const timeoutMs = 25000;
    const withTimeout = (promise) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);

    try {
      const blob = await (await fetch(imageDataUrl)).blob();
      const file = new File([blob], 'drawing.png', { type: 'image/png' });
      const { file_url } = await withTimeout(lexiaPlatform.storage.uploadFile(file));

      setMascotMessage('Quase lá...');

      const result = await withTimeout(lexiaPlatform.ai.invoke({
        prompt: `You are evaluating a child's handwriting. The child was asked to write the UPPERCASE letter "${currentLetter}".

IMPORTANT RULES:
- Be FAIR but not over-strict for children. A recognizable attempt should get at least grade 2.
- Grade 4 = clearly well-formed letter, good proportions
- Grade 3 = recognizable as "${currentLetter}", minor imperfections  
- Grade 2 = partial attempt, has the right general shape but needs work
- Grade 1 = does NOT resemble "${currentLetter}" at all, just scribbles, or effectively blank
- If the drawing has ANY resemblance to "${currentLetter}", give at least grade 2.
- Only give grade 1 if there is truly no recognizable attempt at "${currentLetter}".

Look carefully at the image. Return JSON:
- "score": 0-100
- "grade": 1, 2, 3, or 4
- "feedback": short phrase in Brazilian Portuguese (max 8 words, for a child)
- "recognized_as": the letter/shape you see`,
        file_urls: [file_url],
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            grade: { type: 'number' },
            feedback: { type: 'string' },
            recognized_as: { type: 'string' },
          },
        },
      }));

      const grade = Math.max(1, Math.min(4, Math.round(result.grade) || 2));
      const finalResult = { ...result, grade };

      setAiResult(finalResult);
      setPhase('result');
      const isCorrect = grade >= 3;
      const specificHint = getLetterFeedbackSpeech(currentLetter, isCorrect, grade);
      const speech = getSpokenFeedback(isCorrect, specificHint, { motivationalChance: isCorrect ? 0.6 : 0.35 });
      setMascotExpression(isCorrect ? 'excited' : 'encouraging');
      setMascotMessage(result.feedback || (isCorrect ? 'Muito bem! ⭐' : 'Vamos tentar de novo!'));
      if (isCorrect) playCorrectSound(); else playWrongSound();
      setTimeout(() => speak(speech), 400);
      if (!isPracticeMode) saveMutation.mutate({ letter: currentLetter, gradeValue: grade, encounterId });
    } catch (err) {
      console.error('AI evaluation failed:', err);
      const fallback = { grade: 2, score: 50, feedback: 'Boa tentativa! Continue!', recognized_as: currentLetter };
      setAiResult(fallback);
      setPhase('result');
      if (!isPracticeMode) saveMutation.mutate({ letter: currentLetter, gradeValue: 2, encounterId });
    }
  }, [currentLetter, saveMutation]);

  const handleManualOverride = useCallback((isCorrect) => {
    playClickSound();
    const correctedGrade = isCorrect ? 4 : 1;
    const encounterId = activeEncounterRef.current || `manual-${currentLetter}-${++encounterSequenceRef.current}`;
    activeEncounterRef.current = encounterId;
    setAiResult(prev => prev ? {
      ...prev, grade: correctedGrade,
      score: isCorrect ? 95 : 5,
      feedback: isCorrect ? 'Muito bem, você acertou!' : 'Vamos tentar de novo!',
    } : prev);
    const specificHint = getLetterFeedbackSpeech(currentLetter, isCorrect, correctedGrade);
    const speech = getSpokenFeedback(isCorrect, specificHint, { motivationalChance: isCorrect ? 0.6 : 0.35 });
    setMascotExpression(isCorrect ? 'excited' : 'encouraging');
    setMascotMessage(isCorrect ? 'Muito bem! ⭐' : 'Vamos tentar de novo!');
    if (isCorrect) playCorrectSound(); else playWrongSound();
    setTimeout(() => speak(speech), 400);
    if (!isPracticeMode) saveMutation.mutate({ letter: currentLetter, gradeValue: correctedGrade, encounterId });
  }, [currentLetter, saveMutation]);

  useEffect(() => {
    const data = getLetterData(currentLetter);
    if (data) {
      setMascotExpression('happy');
      setMascotMessage(`Desenhe a letra ${currentLetter}!`);
      setTimeout(() => speak(`${currentLetter} de ${data.word}! Desenhe a letra ${currentLetter}!`), 300);
    }
    activeEncounterRef.current = null;
    setPhase('draw');
    setAiResult(null);
    setStarMultiplier(1);
  }, [currentLetter]);

  const continueReviewSession = useCallback(async () => {
    setMascotExpression('thinking');
    setMascotMessage('Atualizando suas revisões...');
    try {
      const { allProgress: freshProgress, continuation } = await loadLearnerReviewContinuation(lexiaPlatform.progress);
      queryClient.setQueryData(['childProgress'], freshProgress);
      navigateLearnerReviewContinuation(continuation);
    } catch (error) {
      console.error('Learner review continuation failed:', error);
      setMascotExpression('encouraging');
      setMascotMessage('Não consegui atualizar a revisão. Tente novamente.');
    }
  }, [queryClient]);

  const goToNextLetter = useCallback(async () => {
    playClickSound();
    setShowCelebration(false);
    activeEncounterRef.current = null;

    if (isDailyMode) {
      const challenge = getDailyChallenge(allProgress);
      const nextTarget = getNextChallengeTarget(challenge);
      const nextDailyLetter = nextTarget?.key;
      if (typeof nextDailyLetter === 'string' && nextDailyLetter.length === 1 && nextDailyLetter !== currentLetter) {
        setCurrentLetter(nextDailyLetter);
        return;
      }
      if (challenge?.completed) {
        setMascotExpression('excited');
        setMascotMessage('Desafio diário completo! 🏆');
      }
    }

    if (isReviewMode && !isDailyMode) {
      await continueReviewSession();
      return;
    }

    const nextLetter = pickNextLetter(allProgress, currentLetter, ALPHABET);
    setCurrentLetter(nextLetter);
  }, [currentLetter, allProgress, continueReviewSession]);

  const retryLetter = useCallback(() => {
    playClickSound();
    activeEncounterRef.current = null;
    setPhase('draw');
    setAiResult(null);
  }, []);

  const handleLetterSelect = useCallback((letter) => {
    if (!isCanonicalLetter(letter)) return;
    activeEncounterRef.current = null;
    setCurrentLetter(letter);
    setShowSelector(false);
  }, []);

  const handleStartChallenge = useCallback((letter) => {
    setShowDailyChallenge(false);
    if (isCanonicalLetter(letter)) {
      activeEncounterRef.current = null;
      setCurrentLetter(letter);
    }
  }, []);

  const handleContinueAfterQuest = useCallback(() => {
    setShowQuestComplete(false);
    goToNextLetter();
  }, [goToNextLetter]);

  const isWorking = saveMutation.isPending;

  return (
    <div className="game-viewport flex flex-col bg-background">
      <AchievementToast achievement={newAchievement} onDismiss={() => setNewAchievement(null)} />

      <AnimatePresence>
        {showDailyChallenge && dailyChallenge?.type === 'letters' && (
          <DailyChallengeCard
            challenge={dailyChallenge}
            onStart={handleStartChallenge}
            onClose={() => setShowDailyChallenge(false)}
          />
        )}
      </AnimatePresence>

      <SessionQuestComplete
        quest={showQuestComplete ? sessionQuest : null}
        onContinue={handleContinueAfterQuest}
      />

      <GameplayHud
        isPracticeMode={isPracticeMode}
        isReviewMode={isReviewMode}
        isDailyMode={isDailyMode}
        dailyChallenge={dailyChallenge}
        masteredCount={masteredCount}
        totalStreak={totalStreak}
        totalStars={totalStars}
        isCurrentMissionTarget={isCurrentMissionTarget}
        journeyTitle={journey.title}
        onOpenDailyChallenge={() => { playClickSound(); setShowDailyChallenge(true); }}
        onOpenSelector={() => { playClickSound(); setShowSelector(true); }}
        onHome={playClickSound}
      />

      <SessionQuestBar quest={sessionQuest} />

      <div className="game-scroll-y game-safe-bottom flex-1 flex flex-col items-center justify-center game-compact-gap gap-2 px-4 py-2 max-w-lg mx-auto w-full">
        <MascotAvatar className="game-compact-mascot" expression={mascotExpression} size="sm" message={mascotMessage} />

        <div className="flex items-center gap-3">
          <LetterDisplay letter={currentLetter} showAnchor={true} />
          <GameActionButton
            gameVariant="neutral"
            variant="ghost"
            size="sm"
            className="rounded-full gap-1 text-muted-foreground h-8 px-2"
            onClick={() => { const d = getLetterData(currentLetter); speak(`${currentLetter} de ${d?.word}!`); }}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-xs">Ouvir</span>
          </GameActionButton>
        </div>

        {starMultiplier > 1 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="lexia-game-panel lexia-game-panel-reward rounded-full px-3 py-0.5 flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-amber-600" />
            <span className="text-xs font-body font-bold text-amber-700">Desafio: ×{starMultiplier} estrelas!</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'draw' && (
            <motion.div
              key="canvas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full flex flex-col items-center"
            >
              <DrawingCanvas
                targetLetter={currentLetter}
                onEvaluate={handleEvaluate}
                disabled={isWorking}
              />
            </motion.div>
          )}

          {phase === 'result' && aiResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-2"
            >
              <AiResultBadge
                grade={aiResult.grade}
                score={aiResult.score}
                feedback={aiResult.feedback}
                recognizedAs={aiResult.recognized_as}
                targetLetter={currentLetter}
              />

              <GameplayResultActions
                isWorking={isWorking}
                isPracticeMode={isPracticeMode}
                isReviewMode={isReviewMode}
                onManualOverride={handleManualOverride}
                onRetry={retryLetter}
                onContinue={goToNextLetter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CelebrationOverlay show={showCelebration} stars={celebrationData.stars}
        message={celebrationData.message} onDone={goToNextLetter} />

      <LetterSelector open={showSelector} onSelect={handleLetterSelect}
        onClose={() => setShowSelector(false)} progressMap={progressMap} />
    </div>
  );
}
