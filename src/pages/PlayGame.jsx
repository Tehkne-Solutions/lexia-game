import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { lexiaPlatform } from '@/platform';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Home, Grid3X3, ChevronRight, Volume2, ThumbsDown, ThumbsUp, Zap, Sparkles, Compass, Map as MapIcon } from 'lucide-react';

import DrawingCanvas from '@/components/game/DrawingCanvas';
import LetterDisplay from '@/components/game/LetterDisplay';
import MascotAvatar from '@/components/game/MascotAvatar';
import ProgressBar from '@/components/game/ProgressBar';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';
import LetterSelector from '@/components/game/LetterSelector';
import AiResultBadge from '@/components/game/AiResultBadge';
import AchievementToast from '@/components/game/AchievementToast';
import DailyChallengeCard from '@/components/game/DailyChallengeCard';
import SessionQuestBar from '@/components/game/SessionQuestBar';
import SessionQuestComplete from '@/components/game/SessionQuestComplete';

import { ALPHABET, getLetterData } from '@/lib/alphabetData';
import { createNewCard, reviewCard, calculateMastery, pickNextLetter } from '@/lib/fsrs';
import { getInitialLearningLetter } from '@/learning/engine';
import { getJourneyState, JOURNEY_STAGES } from '@/game/journeyEngine';
import { advanceSessionQuest, createSessionQuest } from '@/game/sessionQuestEngine';
import { buildStats, getEarnedAchievements } from '@/lib/achievements';
import { getDailyChallenge, updateChallengeProgress } from '@/lib/dailyChallenge';
import { getLetterFeedbackSpeech } from '@/lib/ttsHints';
import { getSpokenFeedback, getStreakPhrase } from '@/lib/motivationalPhrases';
import { speak, playCorrectSound, playWrongSound, playClickSound } from '@/lib/sounds';

const urlParams = new URLSearchParams(window.location.search);
const isPracticeMode = urlParams.get('mode') === 'practice';

export default function PlayGame() {
  const [currentLetter, setCurrentLetter] = useState(() => getInitialLearningLetter(ALPHABET));
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
  const journeySyncRef = useRef(false);
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
  const isGuidedMission = !isPracticeMode && journey.stage === JOURNEY_STAGES.LETTERS;
  const isCurrentMissionTarget = isGuidedMission && journey.target === currentLetter;

  useEffect(() => {
    if (isPracticeMode || journeySyncRef.current || !hasLoadedProgress) return;
    if (journey.stage === JOURNEY_STAGES.LETTERS && journey.target) {
      setCurrentLetter(journey.target);
    }
    journeySyncRef.current = true;
  }, [hasLoadedProgress, journey.stage, journey.target]);

  useEffect(() => {
    if (sessionQuestInitializedRef.current || !hasLoadedProgress) return;
    const initialQuest = createSessionQuest(journey, { enabled: isGuidedMission });
    sessionQuestRef.current = initialQuest;
    setSessionQuest(initialQuest);
    sessionQuestInitializedRef.current = true;
  }, [hasLoadedProgress, isGuidedMission, journey.stage, journey.worldId]);

  useEffect(() => {
    if (allProgress.length >= 0) {
      const challenge = getDailyChallenge(allProgress);
      setDailyChallenge(challenge);
    }
  }, [allProgress.length]);

  useEffect(() => {
    if (allProgress.length > 0 && !prevStatsRef.current) {
      prevStatsRef.current = buildStats(allProgress);
    }
  }, [allProgress]);

  const saveMutation = useMutation({
    mutationFn: async ({ letter, gradeValue, encounterId }) => {
      const existing = progressMap[letter];
      const isCorrect = gradeValue >= 3;
      const challenge = getDailyChallenge(allProgress);
      const isChallengeLetter = challenge?.letters?.includes(letter) && !challenge?.completed;
      const effectiveMultiplier = isChallengeLetter ? (challenge.starsMultiplier || 2) : 1;

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
      const starsEarned = isCorrect ? effectiveMultiplier : 0;
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

      if (isCorrect && isChallengeLetter) {
        const updatedChallenge = updateChallengeProgress(letter, true);
        setDailyChallenge(updatedChallenge);
      }

      return { isCorrect, newStreak, letter, starsEarned, effectiveMultiplier, encounterId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['childProgress'] });
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
        setMascotMessage(`⭐×${result.effectiveMultiplier} Desafio!`);
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

  const goToNextLetter = useCallback(() => {
    playClickSound();
    setShowCelebration(false);
    activeEncounterRef.current = null;
    const nextLetter = pickNextLetter(allProgress, currentLetter, ALPHABET);
    setCurrentLetter(nextLetter);
  }, [currentLetter, allProgress]);

  const retryLetter = useCallback(() => {
    playClickSound();
    activeEncounterRef.current = null;
    setPhase('draw');
    setAiResult(null);
  }, []);

  const handleLetterSelect = useCallback((letter) => {
    activeEncounterRef.current = null;
    setCurrentLetter(letter);
    setShowSelector(false);
  }, []);

  const handleStartChallenge = useCallback((letter) => {
    setShowDailyChallenge(false);
    if (letter) {
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
        {showDailyChallenge && (
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

      <div className="game-safe-top flex items-center justify-between px-3 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={playClickSound}>
            <Home className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex items-center gap-2 flex-1 justify-center">
          {isPracticeMode && (
            <span className="bg-secondary/20 text-secondary border border-secondary/40 rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-body font-bold">
              <Sparkles className="w-3 h-3" /> Prática Livre
            </span>
          )}
          <ProgressBar current={masteredCount} total={26} streak={totalStreak} stars={totalStars} />
        </div>

        <div className="flex gap-1">
          {dailyChallenge && !dailyChallenge.completed && (
            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 relative"
              onClick={() => { playClickSound(); setShowDailyChallenge(true); }}>
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8"
            onClick={() => { playClickSound(); setShowSelector(true); }}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isPracticeMode && (
        <div className="px-3 py-1.5 border-b border-border/60 bg-card/70 flex items-center justify-center gap-2 text-xs font-body flex-shrink-0">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold text-primary">
            {isCurrentMissionTarget ? 'Missão atual' : 'Missão recomendada'}
          </span>
          <span className="text-muted-foreground">{journey.title}</span>
          <Link to="/world" className="ml-1 text-primary font-bold hover:underline">Mapa</Link>
        </div>
      )}

      <SessionQuestBar quest={sessionQuest} />

      <div className="game-scroll-y game-safe-bottom flex-1 flex flex-col items-center justify-center game-compact-gap gap-2 px-4 py-2 max-w-lg mx-auto w-full">
        <MascotAvatar className="game-compact-mascot" expression={mascotExpression} size="sm" message={mascotMessage} />

        <div className="flex items-center gap-3">
          <LetterDisplay letter={currentLetter} showAnchor={true} />
          <Button
            variant="ghost" size="sm"
            className="rounded-full gap-1 text-muted-foreground h-8 px-2"
            onClick={() => { const d = getLetterData(currentLetter); speak(`${currentLetter} de ${d?.word}!`); }}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-xs">Ouvir</span>
          </Button>
        </div>

        {starMultiplier > 1 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="bg-amber-100 border border-amber-400 rounded-full px-3 py-0.5 flex items-center gap-1"
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

              <div className="w-full max-w-[260px]">
                <p className="text-xs font-body text-muted-foreground text-center mb-1.5">
                  A corujinha errou? Corrija:
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => handleManualOverride(false)} disabled={isWorking}
                    className="flex-1 rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50 text-xs">
                    <ThumbsDown className="w-3 h-3" /> Estava errado
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => handleManualOverride(true)} disabled={isWorking}
                    className="flex-1 rounded-xl gap-1 text-green-600 border-green-200 hover:bg-green-50 text-xs">
                    <ThumbsUp className="w-3 h-3" /> Estava certo!
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 w-full max-w-[260px]">
                <Button variant="outline" size="sm" onClick={retryLetter} disabled={isWorking}
                  className="flex-1 rounded-xl font-body font-bold text-xs">
                  Tentar Novamente
                </Button>
                <Button size="sm" onClick={goToNextLetter} disabled={isWorking}
                  className="flex-1 rounded-xl font-display text-sm gap-1 bg-gradient-to-r from-secondary to-secondary/80 shadow-md">
                  {isPracticeMode ? 'Próxima' : 'Continuar'} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {!isPracticeMode && (
                <Link to="/world" className="w-full max-w-[260px]">
                  <Button variant="ghost" size="sm" className="w-full rounded-xl gap-1.5 text-xs text-muted-foreground">
                    <MapIcon className="w-3.5 h-3.5" /> Ver jornada no mapa
                  </Button>
                </Link>
              )}
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
