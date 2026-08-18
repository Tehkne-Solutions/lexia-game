import React from 'react';
import { motion } from 'framer-motion';

const GRADE_CONFIG = {
  1: {
    emoji: '🌱',
    label: 'Vamos tentar de novo!',
    bg: 'bg-red-50 border-red-200',
    bar: 'bg-red-400',
    text: 'text-red-600',
  },
  2: {
    emoji: '💪',
    label: 'Quase lá!',
    bg: 'bg-amber-50 border-amber-200',
    bar: 'bg-amber-400',
    text: 'text-amber-600',
  },
  3: {
    emoji: '😄',
    label: 'Muito bom!',
    bg: 'bg-green-50 border-green-200',
    bar: 'bg-green-400',
    text: 'text-green-600',
  },
  4: {
    emoji: '🌟',
    label: 'Perfeito!',
    bg: 'bg-purple-50 border-purple-200',
    bar: 'bg-primary',
    text: 'text-primary',
  },
};

export default function AiResultBadge({ grade, score, feedback, recognizedAs, targetLetter }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG[3];
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const matched = recognizedAs?.trim().toUpperCase() === targetLetter?.toUpperCase();

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      className={`relative w-full max-w-[320px] rounded-2xl border-2 p-5 flex flex-col items-center gap-3 shadow-lg overflow-hidden ${cfg.bg}`}
    >
      {/* Sparkle decorations for grade 4 */}
      {grade === 4 && (
        <>
          <motion.span className="absolute top-2 right-3 text-xl pointer-events-none"
            animate={{ scale: [0, 1.2, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.span>
          <motion.span className="absolute bottom-2 left-3 text-lg pointer-events-none"
            animate={{ scale: [0, 1.2, 0], rotate: [0, -180, -360] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>⭐</motion.span>
        </>
      )}

      {/* Grade emoji with gentle bounce */}
      <motion.span
        className="text-5xl"
        animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6 }}
      >
        {cfg.emoji}
      </motion.span>

      {/* Label */}
      <p className={`font-display text-2xl ${cfg.text}`}>{cfg.label}</p>

      {/* Feedback from AI */}
      <p className="font-body font-semibold text-foreground text-center text-sm">{feedback}</p>

      {/* Score bar */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-body text-muted-foreground">Precisão</span>
          <span className={`text-xs font-body font-bold ${cfg.text}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden border border-border">
          <motion.div
            className={`h-full rounded-full ${cfg.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* Recognition note */}
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
    </motion.div>
  );
}