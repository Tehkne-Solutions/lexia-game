import React from 'react';
import { motion } from 'framer-motion';
import { getLetterData } from '@/lib/alphabetData';
import GamePanel from '@/components/game/GamePanel';

export default function LetterDisplay({ letter, showAnchor = true }) {
  const data = getLetterData(letter);
  if (!data) return null;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.div
        className="relative"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="font-display text-5xl md:text-6xl"
          style={{ color: data.color }}
        >
          {data.letter}
        </span>
      </motion.div>

      {showAnchor && (
        <GamePanel
          tone="paper"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          aria-label={`${data.letter} de ${data.word}`}
        >
          <span className="text-lg" aria-hidden="true">{data.emoji}</span>
          <span className="font-body font-bold text-foreground text-sm">
            {data.word}
          </span>
        </GamePanel>
      )}
    </motion.div>
  );
}
