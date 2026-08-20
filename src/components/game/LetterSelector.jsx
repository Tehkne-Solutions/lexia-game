import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALPHABET } from '@/lib/alphabetData';
import GameActionButton from '@/components/game/GameActionButton';
import { X } from 'lucide-react';
import { playClickSound } from '@/lib/sounds';

export default function LetterSelector({ open, onSelect, onClose, progressMap }) {
  if (!open) return null;

  function getMastery(letter) {
    const p = progressMap[letter];
    if (!p) return 0;
    if (p.total_attempts === 0) return 0;
    return Math.round((p.correct_attempts / p.total_attempts) * 100);
  }

  function getStatus(letter) {
    const mastery = getMastery(letter);
    if (mastery >= 80) return 'mastered';
    if (mastery >= 40) return 'learning';
    const p = progressMap[letter];
    if (p && p.total_attempts > 0) return 'started';
    return 'new';
  }

  const statusStyles = {
    mastered: 'bg-secondary/20 border-secondary text-secondary ring-2 ring-secondary/30',
    learning: 'bg-accent/20 border-accent text-accent-foreground ring-2 ring-accent/30',
    started: 'bg-primary/10 border-primary/30 text-primary',
    new: 'bg-muted border-border text-muted-foreground',
  };

  return (
    <AnimatePresence>
      <motion.div
        className="lexia-letter-selector-surface fixed inset-0 z-40 bg-background flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="font-display text-2xl text-foreground">Escolha uma Letra</h2>
          <GameActionButton
            gameVariant="neutral"
            size="icon"
            onClick={onClose}
            aria-label="Fechar seletor de letras"
            className="rounded-xl"
          >
            <X className="w-6 h-6" />
          </GameActionButton>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3 max-w-2xl mx-auto">
            {ALPHABET.map((item, i) => {
              const status = getStatus(item.letter);
              return (
                <motion.button
                  key={item.letter}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => {
                    playClickSound();
                    onSelect(item.letter);
                  }}
                  className={`lexia-letter-tile aspect-square rounded-2xl border-2 flex flex-col items-center justify-center
                    gap-0.5 transition-all hover:scale-105 active:scale-95
                    ${statusStyles[status]}`}
                  aria-label={`${item.letter}, ${status === 'mastered' ? 'dominada' : status === 'learning' ? 'aprendendo' : status === 'started' ? 'iniciada' : 'nova'}`}
                >
                  <span className="font-display text-2xl">{item.letter}</span>
                  <span className="text-lg">{item.emoji}</span>
                  {status === 'mastered' && <span className="text-xs" aria-hidden="true">⭐</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="lexia-letter-selector-legend flex justify-center gap-4 p-4 border-t border-border bg-card">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-xs font-body text-muted-foreground">Dominada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xs font-body text-muted-foreground">Aprendendo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary/40" />
            <span className="text-xs font-body text-muted-foreground">Iniciada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="text-xs font-body text-muted-foreground">Nova</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
