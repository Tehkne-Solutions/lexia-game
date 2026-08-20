import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GamePanel from '@/components/game/GamePanel';
import GameActionButton from '@/components/game/GameActionButton';
import { Compass, Map, Play, Star } from 'lucide-react';

export default function SessionQuestComplete({ quest, onContinue }) {
  if (!quest?.enabled || !quest.completed) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/92 flex items-center justify-center p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GamePanel
        tone="reward"
        className="w-full max-w-sm p-6 text-center"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      >
        <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-primary/25 bg-primary/10 flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-primary" />
        </div>

        <p className="text-xs uppercase tracking-[0.18em] font-bold text-primary mb-2">Expedição concluída</p>
        <h2 className="font-display text-2xl text-foreground">{quest.title}</h2>
        <p className="font-body text-sm text-muted-foreground mt-2">{quest.completionMessage}</p>

        <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-3 flex items-center justify-center gap-5">
          <div>
            <p className="font-display text-xl text-foreground">{quest.progress}/{quest.goal}</p>
            <p className="text-[11px] text-muted-foreground">checkpoints</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-display text-xl text-accent flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-current" /> {quest.stars}
            </p>
            <p className="text-[11px] text-muted-foreground">estrelas ganhas</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <Link to="/world" className="w-full">
            <GameActionButton gameVariant="primary" className="w-full gap-2 font-display py-5">
              <Map className="w-4 h-4" /> Voltar ao mapa
            </GameActionButton>
          </Link>
          <GameActionButton
            gameVariant="secondary"
            className="w-full gap-2 font-body font-bold"
            onClick={onContinue}
          >
            <Play className="w-4 h-4" /> Continuar treinando
          </GameActionButton>
        </div>
      </GamePanel>
    </motion.div>
  );
}
