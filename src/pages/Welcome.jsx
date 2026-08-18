import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Play, BarChart3, Map, User, Sparkles, Zap, BookOpen, Settings as SettingsIcon, Compass, Trophy } from 'lucide-react';
import MascotAvatar from '@/components/game/MascotAvatar';
import DailyChallengeCard from '@/components/game/DailyChallengeCard';
import { speak, playClickSound } from '@/lib/sounds';
import { buildStats } from '@/lib/achievements';
import { getDailyChallenge, getChallengeCompletedCount } from '@/lib/dailyChallenge';
import { lexiaPlatform, activePlatformProvider } from '@/platform';
import { useAuth } from '@/lib/AuthContext';
import { getJourneyState } from '@/game/journeyEngine';
import { getJourneyWorldExperience } from '@/game/worldExperienceEngine';

export default function Welcome() {
  const navigate = useNavigate();
  const [showMessage, setShowMessage] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const { isAuthenticated } = useAuth();
  const canLoadProgress = activePlatformProvider !== 'supabase' || isAuthenticated;

  const { data: allProgress = [], isFetching } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
    enabled: canLoadProgress,
  });

  const visibleProgress = canLoadProgress ? allProgress : [];
  const journey = useMemo(
    () => getJourneyState(visibleProgress),
    [visibleProgress],
  );
  const stats = useMemo(() => buildStats(visibleProgress), [visibleProgress]);
  const activeExperience = useMemo(
    () => getJourneyWorldExperience(journey, stats),
    [journey, stats],
  );
  const missionPct = journey.total > 0 ? Math.round((journey.current / journey.total) * 100) : 0;
  const dailyCompletedCount = getChallengeCompletedCount(dailyChallenge);

  useEffect(() => {
    if (!canLoadProgress || isFetching) return;
    setDailyChallenge(getDailyChallenge(visibleProgress));
  }, [canLoadProgress, isFetching, visibleProgress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(true);
      speak(journey.firstRun
        ? `Olá! Eu sou a Corujinha! Sua primeira missão é descobrir a letra ${journey.target}.`
        : 'Olá! Eu sou a Corujinha! Vamos continuar nossa jornada?');
    }, 800);
    return () => clearTimeout(timer);
  }, [journey.firstRun, journey.target]);

  function startDailyChallenge(_nextTarget, challenge) {
    const targetChallenge = challenge || dailyChallenge;
    if (!targetChallenge?.playPath) return;
    setShowDailyChallenge(false);
    navigate(targetChallenge.playPath);
  }

  return (
    <div className="game-viewport-scroll relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🌟', '⭐', '✨', '🌈', '🦋', '🌸', '📚', '✏️'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl md:text-3xl opacity-20"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${5 + (i * 15) % 85}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <div className="min-h-full flex flex-col items-center justify-center px-4 py-4 sm:p-6 game-safe-top game-safe-bottom relative">
        <motion.div
          className="flex flex-col items-center game-compact-gap gap-4 sm:gap-6 z-10 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="font-display text-4xl sm:text-5xl md:text-7xl text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
          >
            <span className="text-primary">Lexia</span>{' '}
            <span className="text-secondary">Game</span>
          </motion.h1>

          <motion.p
            className="font-body font-semibold text-muted-foreground text-center text-base sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Aprenda a ler com magia! ✨
          </motion.p>

          <MascotAvatar
            className="game-compact-mascot"
            expression={showMessage ? 'excited' : 'happy'}
            size="xl"
            message={showMessage ? (journey.firstRun ? `Sua primeira missão: letra ${journey.target}!` : journey.title) : undefined}
          />

          <motion.div
            className="w-full max-w-xs rounded-2xl border-2 border-primary/20 bg-card/90 p-4 shadow-md"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {activeExperience.chapter} · {activeExperience.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="w-5 h-5 text-primary" />
              <span className="font-body text-xs font-bold uppercase tracking-wide text-primary">Missão atual</span>
            </div>
            <h2 className="font-display text-lg text-foreground">{journey.title}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">{journey.description}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${missionPct}%` }} />
              </div>
              <span className="font-body text-xs font-bold text-muted-foreground">
                {journey.current}/{journey.total}
              </span>
            </div>
          </motion.div>

          {dailyChallenge && (
            <motion.button
              type="button"
              onClick={() => {
                playClickSound();
                setShowDailyChallenge(true);
              }}
              className="w-full max-w-xs rounded-2xl border border-amber-300 bg-amber-50/80 px-3 py-2.5 text-left shadow-sm hover:border-amber-400 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-none">
                  <Trophy className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[10px] uppercase tracking-[0.12em] font-bold text-amber-700">
                    Desafio diário · {dailyChallenge.typeLabel}
                  </p>
                  <p className="font-display text-sm text-foreground truncate">{dailyChallenge.title}</p>
                </div>
                <span className="font-body text-xs font-bold text-amber-800 whitespace-nowrap">
                  {dailyCompletedCount}/3 · ⭐×2
                </span>
              </div>
            </motion.button>
          )}

          <motion.div
            className="flex flex-col gap-3 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <Link to={journey.path} className="w-full">
              <Button
                size="lg"
                onClick={() => playClickSound()}
                className="w-full rounded-2xl font-display text-xl py-7 gap-3
                  bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70
                  shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
              >
                <Play className="w-6 h-6" />
                {journey.cta}
              </Button>
            </Link>

            <Link to="/practice" className="w-full">
              <Button
                variant="outline"
                onClick={() => playClickSound()}
                className="w-full rounded-2xl font-body font-bold text-sm py-4 gap-2 border-2
                  border-secondary/40 text-secondary hover:bg-secondary/10 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Prática Livre (sem pressão)
              </Button>
            </Link>

            <div className="grid grid-cols-3 gap-2 w-full">
              <Link to="/world" className="col-span-1">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => playClickSound()}
                  className="w-full rounded-2xl font-body font-bold text-sm py-5 gap-1 border-2 hover:bg-muted/50 flex-col h-auto"
                >
                  <Map className="w-5 h-5" />
                  Mapa
                </Button>
              </Link>
              <Link to="/profile" className="col-span-1">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => playClickSound()}
                  className="w-full rounded-2xl font-body font-bold text-sm py-5 gap-1 border-2 hover:bg-muted/50 flex-col h-auto"
                >
                  <User className="w-5 h-5" />
                  Perfil
                </Button>
              </Link>
              <Link to="/parent" className="col-span-1">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => playClickSound()}
                  className="w-full rounded-2xl font-body font-bold text-sm py-5 gap-1 border-2 hover:bg-muted/50 flex-col h-auto"
                >
                  <BarChart3 className="w-5 h-5" />
                  Pais
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mt-1">
              <Link to="/speed-challenge" className="col-span-1">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => playClickSound()}
                  className="w-full rounded-2xl font-body font-bold text-xs py-4 gap-1 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex-col h-auto"
                >
                  <Zap className="w-5 h-5 text-amber-500" />
                  Desafio
                </Button>
              </Link>
              <Link to="/story" className="col-span-1">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => playClickSound()}
                  className="w-full rounded-2xl font-body font-bold text-xs py-4 gap-1 hover:bg-primary/5 flex-col h-auto"
                >
                  <BookOpen className="w-5 h-5 text-primary" />
                  História
                </Button>
              </Link>
              <Link to="/settings" className="col-span-1">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => playClickSound()}
                  className="w-full rounded-2xl font-body font-bold text-xs py-4 gap-1 hover:bg-muted/50 flex-col h-auto"
                >
                  <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                  Acessar
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground/60 font-body text-center mt-2 sm:mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Alfabetização gamificada com repetição espaçada 🧠
          </motion.p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDailyChallenge && dailyChallenge && (
          <DailyChallengeCard
            challenge={dailyChallenge}
            onStart={startDailyChallenge}
            onClose={() => setShowDailyChallenge(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
