import React from 'react';
import { motion } from 'framer-motion';
import GamePanel from './GamePanel';

const GRADE_CONFIG = {
  1: {
    emoji: '🌱',
    label: 'Vamos tentar de novo!',
    tone: 'review',
    bar: 'bg-destructive',
    text: 'text-destructive',
  },
  2: {
    emoji: '💪',
    label: 'Quase lá!',
    tone: 'paper',
    bar: 'bg-accent',
    text: 'text-accent-foreground',
  },
  3: {
    emoji: '😄',
    label: 'Muito bom!',
    tone: 'success',
    bar: 'bg-secondary',
    text: 'text-secondary',
  },
  4: {
    emoji: '🌟',
    label: 'Perfeito!',
    tone: 'reward',
    bar: 'bg-primary',
    text: 'text-primary',
  },
};

export default function AiResultBadge({ grade, score, feedback, recognizedAs, targetLetter }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG[3];
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const matched = recognizedAs?.trim().toUpperCase() === targetLetter?.toUpperCase();

  return (
    <GamePanel
      tone={cfg.tone}
      initial={{ scale: 0.5, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      className="relative w-full max-w-[320px] p-5 flex flex-col items-center gap-3 overflow-hidden"
    >
      {grade === 4 && (
        <>
          <motion.span
            className="absolute top-2 right-3 text-xl pointer-events-none"
            animate={{ scale: [0.85, 1.15, 0.85], rotate: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
          <motion.span
            className="absolute bottom-2 left-3 text-lg pointer-events-none"
            animate={{ scale: [0.9, 1.15, 0.9], rotate: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          >
            ⭐
          </motion.span>
        </>
      )}

      <motion.span
        className="text-5xl"
        animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6 }}
      >
        {cfg.emoji}
      </motion.span>

      <p className={`font-display text-2xl ${cfg.text}`}>{cfg.label}</p>
      <p className="font-body font-semibold text-foreground text-center text-sm">{feedback}</p>

      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-body text-muted-foreground">Precisão</span>
          <span className={`text-xs font-body font-bold ${cfg.text}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-background/60 rounded-full overflow-hidden border border-border">
          <motion.div
            className={`h-full rounded-full ${cfg.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {recognizedAs && !matched && grade < 3 && (
        <p className="text-xs font-body text-muted-foreground text-center">
          A corujinha leu como <strong>"{recognizedAs}"</strong> — continue tentando! 🦉
        </p>
      )}
      {matched && (
        <p className="text-xs font-body text-muted-foreground text-center">
          A corujinha reconheceu a letra <strong>{targetLetter}</strong>! ✅
        </p>
      )}
    </GamePanel>
  );
}
