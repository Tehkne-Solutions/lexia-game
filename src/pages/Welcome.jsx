import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Play, BarChart3, Map, User, Sparkles, Zap, BookOpen, Settings as SettingsIcon, Compass } from 'lucide-react';
import MascotAvatar from '@/components/game/MascotAvatar';
import { speak, playClickSound } from '@/lib/sounds';
import { lexiaPlatform, activePlatformProvider } from '@/platform';
import { useAuth } from '@/lib/AuthContext';
import { getJourneyState } from '@/game/journeyEngine';

export default function Welcome() {
  const [showMessage, setShowMessage] = useState(false);
  const { isAuthenticated } = useAuth();
  const canLoadProgress = activePlatformProvider !== 'supabase' || isAuthenticated;

  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
    enabled: canLoadProgress,
  });

  const journey = useMemo(
    () => getJourneyState(canLoadProgress ? allProgress : []),
    [allProgress, canLoadProgress],
  );
  const missionPct = journey.total > 0 ? Math.round((journey.current / journey.total) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(true);
      speak(journey.firstRun
        ? `Olá! Eu sou a Corujinha! Sua primeira missão é descobrir a letra ${journey.target}.`
        : 'Olá! Eu sou a Corujinha! Vamos continuar nossa jornada?');
    }, 800);
    return () => clearTimeout(timer);
  }, [journey.firstRun, journey.target]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

      <motion.div
        className="flex flex-col items-center gap-6 z-10 w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="font-display text-5xl md:text-7xl text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
        >
          <span className="text-primary">Lexia</span>{' '}
          <span className="text-secondary">Game</span>
        </motion.h1>

        <motion.p
          className="font-body font-semibold text-muted-foreground text-center text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Aprenda o Alfabeto com Magia! ✨
        </motion.p>

        <MascotAvatar
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

          <Link to="/play?mode=practice" className="w-full">
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
          className="text-xs text-muted-foreground/60 font-body text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Alfabetização gamificada com repetição espaçada 🧠
        </motion.p>
      </motion.div>
    </div>
  );
}
