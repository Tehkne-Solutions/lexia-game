import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, Map, Play, Star } from 'lucide-react';

export default function SessionQuestComplete({ quest, onContinue }) {
  if (!quest?.enabled || !quest.completed) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/92 backdrop-blur-sm flex items-center justify-center p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl border-2 border-primary/25 bg-card shadow-2xl p-6 text-center"
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
            <p className="font-display text-xl text-amber-600 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-current" /> {quest.stars}
            </p>
            <p className="text-[11px] text-muted-foreground">estrelas ganhas</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <Link to="/world" className="w-full">
            <Button className="w-full rounded-2xl gap-2 font-display py-5">
              <Map className="w-4 h-4" /> Voltar ao mapa
            </Button>
          </Link>
          <Button variant="outline" className="w-full rounded-2xl gap-2 font-body font-bold" onClick={onContinue}>
            <Play className="w-4 h-4" /> Continuar treinando
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
