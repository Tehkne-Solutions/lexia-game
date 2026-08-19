import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight, CheckCircle } from 'lucide-react';
import { lexiaPlatform } from '@/platform';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MascotAvatar from '@/components/game/MascotAvatar';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';
import SessionQuestBar from '@/components/game/SessionQuestBar';
import SessionQuestComplete from '@/components/game/SessionQuestComplete';
import OnScreenKeyboard from '@/components/game/OnScreenKeyboard';
import CurriculumGameplayHud from '@/components/game/CurriculumGameplayHud';
import GameActionButton from '@/components/game/GameActionButton';
import GamePanel from '@/components/game/GamePanel';
import { BASIC_SYLLABLES, COMPLEX_SYLLABLES, BASIC_WORDS } from '@/lib/syllablesData';
import { JOURNEY_STAGES } from '@/game/journeyEngine';
import { advanceSessionQuest, createSessionQuest } from '@/game/sessionQuestEngine';
import { loadLearnerReviewContinuation, navigateLearnerReviewContinuation } from '@/game/learnerReviewRuntime';
import { pickNextJourneyItemIndex, reviewJourneyProgress } from '@/learning/journeyReviewEngine';
import {
  getChallengeStarMultiplier,
  getDailyChallenge,
  getNextChallengeTarget,
} from '@/lib/dailyChallenge';
import { speak, playCorrectSound, playWrongSound, playClickSound } from '@/lib/sounds';
import { getTypingFeedback, getTypingMascotMessage } from '@/lib/typingFeedback';
import { getSpokenFeedback, getStreakPhrase } from '@/lib/motivationalPhrases';

const urlParams = new URLSearchParams(window.location.search);
const rawMode = urlParams.get('mode');
const MODE = rawMode === 'words' ? 'words' : rawMode === 'complex' ? 'complex' : 'syllables';
const isPracticeMode = rawMode === 'practice' || urlParams.get('practice') === 'true';
const isDailyMode = urlParams.get('daily') === '1';
const isReviewMode = urlParams.get('review') === '1';
const requestedDailyTargetKey = urlParams.get('dailyTarget');
const requestedReviewTargetKey = isReviewMode ? urlParams.get('reviewTarget') : null;

const MODE_CONFIG = Object.freeze({
  syllables: {
    items: BASIC_SYLLABLES,
    targetKey: 'syllable',
    entityPrefix: 'SYL_',
    title: 'Sílabas Simples',
    spokenLabel: 'Sílaba',
    missionLabel: 'As Pontes do Som',
    stage: JOURNEY_STAGES.SYLLABLES,
    worldId: 'syllables_basic',
  },
  complex: {
    items: COMPLEX_SYLLABLES,
    targetKey: 'syllable',
    entityPrefix: 'SYLC_',
    title: 'Sílabas Complexas',
    spokenLabel: 'Sílaba complexa',
    missionLabel: 'O Labirinto dos Encontros',
    stage: JOURNEY_STAGES.COMPLEX_SYLLABLES,
    worldId: 'syllables_complex',
  },
  words: {
    items: BASIC_WORDS,
    targetKey: 'word',
    entityPrefix: 'WORD_',
    title: 'Primeiras Palavras',
    spokenLabel: 'Palavra',
    missionLabel: 'A Biblioteca Desperta',
    stage: JOURNEY_STAGES.WORDS,
    worldId: 'words_basic',
  },
});

const CONFIG = MODE_CONFIG[MODE];
const ITEMS = CONFIG.items;
const TARGET_KEY = CONFIG.targetKey;
const ENTITY_PREFIX = CONFIG.entityPrefix;

function findDailyItemIndex(targetKey) {
  if (!targetKey) return -1;
  return ITEMS.findIndex((item) => `${ENTITY_PREFIX}${item[TARGET_KEY]}` === targetKey);
}

function findReviewItemIndex(targetKey) {
  if (!targetKey) return -1;
  return ITEMS.findIndex((item) => `${ENTITY_PREFIX}${item[TARGET_KEY]}` === targetKey);
}

const requestedDailyItemIndex = isDailyMode ? findDailyItemIndex(requestedDailyTargetKey) : -1;
const requestedReviewItemIndex = isReviewMode ? findReviewItemIndex(requestedReviewTargetKey) : -1;

function getInitialIndex() {
  if (requestedDailyItemIndex >= 0) return requestedDailyItemIndex;
  if (requestedReviewItemIndex >= 0) return requestedReviewItemIndex;
  return 0;
}

export default function PlaySyllables() {
  const [index, setIndex] = useState(getInitialIndex);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('type');
  const [mascotExpression, setMascotExpression] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [lastStarMultiplier, setLastStarMultiplier] = useState(1);
  const initialQuest = createSessionQuest(
    { stage: CONFIG.stage, worldId: CONFIG.worldId },
    { enabled: !isPracticeMode },
  );
  const [sessionQuest, setSessionQuest] = useState(initialQuest);
  const [showQuestComplete, setShowQuestComplete] = useState(false);
  const sessionQuestRef = useRef(initialQuest);
  const encounterSequenceRef = useRef(0);
  const inputRef = useRef(null);
  const reviewSelectionInitializedRef = useRef(isDailyMode || requestedReviewItemIndex >= 0);
  const queryClient = useQueryClient();

  const current = ITEMS[index];
  const target = current[TARGET_KEY];

  const { data: allProgress = [], isFetched } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  useEffect(() => {
    const stars = allProgress.reduce((s, p) => s + (p.stars_earned || 0), 0);
    setTotalStars(stars);
  }, [allProgress]);

  useEffect(() => {
    if (!isFetched || reviewSelectionInitializedRef.current) return;
    const recommendedIndex = pickNextJourneyItemIndex({
      items: ITEMS,
      allProgress,
      entityPrefix: ENTITY_PREFIX,
      targetKey: TARGET_KEY,
      currentIndex: -1,
    });
    setIndex(recommendedIndex);
    reviewSelectionInitializedRef.current = true;
  }, [isFetched, allProgress]);

  const saveMutation = useMutation({
    mutationFn: async (/** @type {{ isCorrect: boolean, encounterId: string }} */ variables) => {
      const { isCorrect, encounterId } = variables;
      const entityKey = ENTITY_PREFIX + target;
      const existing = allProgress.find(p => p.letter === entityKey);
      const challenge = getDailyChallenge(allProgress);
      const effectiveMultiplier = isCorrect
        ? getChallengeStarMultiplier(challenge, entityKey)
        : 1;
      const reviewed = reviewJourneyProgress(existing, isCorrect);
      const data = {
        child_name: 'Jogador',
        letter: entityKey,
        total_attempts: (existing?.total_attempts || 0) + 1,
        correct_attempts: (existing?.correct_attempts || 0) + (isCorrect ? 1 : 0),
        streak: isCorrect ? (existing?.streak || 0) + 1 : 0,
        stars_earned: (existing?.stars_earned || 0) + (isCorrect ? 1 : 0),
        stability: reviewed.stability,
        difficulty: reviewed.difficulty,
        interval: reviewed.interval,
        repetitions: reviewed.repetitions,
        next_review: reviewed.next_review,
        last_grade: reviewed.last_grade,
        level: 1,
      };
      if (existing) {
        await lexiaPlatform.progress.update(existing.id, data);
      } else {
        await lexiaPlatform.progress.create(data);
      }
      return {
        isCorrect,
        starsEarned: isCorrect ? effectiveMultiplier : 0,
        effectiveMultiplier,
        entityKey,
        encounterId,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['childProgress'] });
      setLastStarMultiplier(result.effectiveMultiplier || 1);
      if (result.isCorrect && result.effectiveMultiplier > 1) {
        setTotalStars((stars) => stars + (result.effectiveMultiplier - 1));
        setMascotMessage(`⭐×${result.effectiveMultiplier} Desafio diário!`);
      }
      if (!result.isCorrect || !sessionQuestRef.current?.enabled) return;
      const previousQuest = sessionQuestRef.current;
      const nextQuest = advanceSessionQuest(previousQuest, result);
      if (nextQuest === previousQuest) return;
      sessionQuestRef.current = nextQuest;
      setSessionQuest(nextQuest);
      if (!previousQuest.completed && nextQuest.completed) {
        setShowCelebration(false);
        setShowQuestComplete(true);
        setMascotExpression('excited');
        setMascotMessage('Expedição concluída!');
        setTimeout(() => speak(nextQuest.completionMessage), 450);
      }
    },
  });

  useEffect(() => {
    setTyped('');
    setPhase('type');
    setLastStarMultiplier(1);
    setMascotExpression('happy');
    setMascotMessage(`Digite: ${target}`);
    const context = MODE === 'words' ? current.hint : current.word;
    setTimeout(() => speak(`${CONFIG.spokenLabel}: ${target}. ${context}!`), 300);
    inputRef.current?.focus();
  }, [index]);

  const checkAnswer = useCallback(() => {
    const answer = typed.trim().toUpperCase();
    const correct = answer === target;
    const encounterId = `${ENTITY_PREFIX}${target}-${++encounterSequenceRef.current}`;
    if (correct) {
      playCorrectSound();
      setPhase('correct');
      setMascotExpression('excited');
      setMascotMessage(getTypingMascotMessage(typed, target, true));
      const newStreak = streak + 1;
      setStreak(newStreak);
      setTotalStars(s => s + 1);
      if (!isPracticeMode) saveMutation.mutate({ isCorrect: true, encounterId });
      if (newStreak > 0 && newStreak % 5 === 0 && !sessionQuestRef.current?.completed) {
        setShowCelebration(true);
      }
      const specificHint = getTypingFeedback(typed, target, true);
      const successSpeech = getSpokenFeedback(true, specificHint, { motivationalChance: 0.6 });
      setTimeout(() => speak(successSpeech), 400);
      if (newStreak > 0 && newStreak % 5 === 0 && !sessionQuestRef.current?.completed) {
        setTimeout(() => speak(getStreakPhrase()), 1600);
      }
    } else {
      playWrongSound();
      setPhase('wrong');
      setMascotExpression('encouraging');
      setMascotMessage(getTypingMascotMessage(typed, target, false));
      setStreak(0);
      if (!isPracticeMode) saveMutation.mutate({ isCorrect: false, encounterId });
      const specificHint = getTypingFeedback(typed, target, false);
      const hintSpeech = getSpokenFeedback(false, specificHint, { motivationalChance: 0.35 });
      setTimeout(() => speak(hintSpeech), 500);
    }
  }, [typed, target, streak, saveMutation]);

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

  const nextItem = useCallback(async () => {
    playClickSound();
    setShowCelebration(false);

    if (isDailyMode) {
      const challenge = getDailyChallenge(allProgress);
      const nextTarget = getNextChallengeTarget(challenge);
      const nextDailyIndex = findDailyItemIndex(nextTarget?.key);
      if (nextDailyIndex >= 0 && nextDailyIndex !== index) {
        setIndex(nextDailyIndex);
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

    const next = pickNextJourneyItemIndex({
      items: ITEMS,
      allProgress,
      entityPrefix: ENTITY_PREFIX,
      targetKey: TARGET_KEY,
      currentIndex: index,
    });
    setIndex(next);
  }, [index, allProgress, continueReviewSession]);

  const handleContinueAfterQuest = useCallback(() => {
    setShowQuestComplete(false);
    nextItem();
  }, [nextItem]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && phase === 'type' && typed.length > 0) {
      checkAnswer();
    }
  };

  const panelTone = isReviewMode ? 'review' : isDailyMode ? 'reward' : 'paper';

  return (
    <div className="game-viewport flex flex-col bg-background">
      <SessionQuestComplete
        quest={showQuestComplete ? sessionQuest : null}
        onContinue={handleContinueAfterQuest}
      />

      <CurriculumGameplayHud
        title={CONFIG.title}
        missionLabel={CONFIG.missionLabel}
        isPracticeMode={isPracticeMode}
        isReviewMode={isReviewMode}
        isDailyMode={isDailyMode}
        totalStars={totalStars}
        streak={streak}
        onHome={playClickSound}
      />

      <SessionQuestBar quest={sessionQuest} />

      <div className="game-scroll-y game-safe-bottom flex-1 flex flex-col items-center justify-center gap-3 px-4 py-3 max-w-md mx-auto w-full">
        <MascotAvatar className="game-compact-mascot" expression={mascotExpression} size="sm" message={mascotMessage} />

        <GamePanel
          key={index}
          tone={panelTone}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-3"
        >
          <span className="text-6xl sm:text-7xl" aria-hidden="true">
            {current.emoji}
          </span>

          <p className="font-body text-muted-foreground text-sm text-center">
            {MODE === 'words' ? current.hint : `${target} de ${current.word}`}
          </p>

          <GameActionButton
            gameVariant="neutral"
            variant="ghost"
            size="sm"
            className="rounded-full gap-1 text-muted-foreground"
            onClick={() => speak(`${CONFIG.spokenLabel}: ${target}. ${MODE === 'words' ? current.hint : current.word}!`)}
          >
            <Volume2 className="w-4 h-4" />
            Ouvir
          </GameActionButton>

          <AnimatePresence mode="wait">
            {phase === 'type' && (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex gap-1.5 sm:gap-2 justify-center">
                  {target.split('').map((_, i) => (
                    <div
                      key={i}
                      className={`w-10 h-11 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center font-display text-xl sm:text-2xl transition-all
                        ${typed[i] ? 'border-primary bg-primary/10 text-primary' : 'border-dashed border-muted-foreground/40 bg-muted/30 text-transparent'}`}
                    >
                      {(typed[i] || '').toUpperCase()}
                    </div>
                  ))}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase().slice(0, target.length))}
                  onKeyDown={handleKeyDown}
                  maxLength={target.length}
                  className="opacity-0 absolute pointer-events-none"
                  autoComplete="off"
                  autoCapitalize="characters"
                />

                <OnScreenKeyboard
                  onKey={(k) => setTyped(p => (p + k).slice(0, target.length))}
                  onDelete={() => setTyped(p => p.slice(0, -1))}
                />

                <GameActionButton
                  gameVariant="primary"
                  size="lg"
                  onClick={checkAnswer}
                  disabled={typed.length === 0}
                  className="w-full font-display text-lg gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Verificar
                </GameActionButton>
              </div>
            )}

            {phase === 'correct' && (
              <div className="flex flex-col items-center gap-3">
                <GamePanel tone="success" className="rounded-2xl px-6 py-3 text-center">
                  <p className="font-display text-3xl text-secondary">{target}</p>
                  <p className="font-body text-sm text-secondary">✅ Correto! +{lastStarMultiplier} ⭐</p>
                </GamePanel>
                <GameActionButton
                  gameVariant="primary"
                  onClick={nextItem}
                  disabled={saveMutation.isPending}
                  className="gap-2 font-display"
                >
                  {isReviewMode ? 'Próxima revisão' : 'Próximo'} <ChevronRight className="w-4 h-4" />
                </GameActionButton>
              </div>
            )}

            {phase === 'wrong' && (
              <div className="flex flex-col items-center gap-3">
                <div className="lexia-result-feedback-panel text-center">
                  <p className="font-body text-sm text-muted-foreground">Você digitou: <strong>{typed}</strong></p>
                  <p className="font-display text-2xl text-destructive">Correto: {target}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <GameActionButton
                    gameVariant="secondary"
                    variant="outline"
                    onClick={() => { setTyped(''); setPhase('type'); inputRef.current?.focus(); }}
                    className="gap-1"
                  >
                    Tentar Novamente
                  </GameActionButton>
                  <GameActionButton
                    gameVariant="primary"
                    onClick={nextItem}
                    disabled={saveMutation.isPending}
                    className="gap-2 font-display"
                  >
                    {isReviewMode ? 'Próxima revisão' : 'Próximo'} <ChevronRight className="w-4 h-4" />
                  </GameActionButton>
                </div>
              </div>
            )}
          </AnimatePresence>
        </GamePanel>
      </div>

      <CelebrationOverlay show={showCelebration} stars={3} message={`Combo ${streak}x! 🔥`} onDone={nextItem} />
    </div>
  );
}
