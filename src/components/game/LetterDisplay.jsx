import React from 'react';
import { motion } from 'framer-motion';
import { getLetterData } from '@/lib/alphabetData';

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
          className="font-display text-5xl md:text-6xl drop-shadow-lg"
          style={{ color: data.color }}
        >
          {data.letter}
        </span>
      </motion.div>

      {showAnchor && (
        <motion.div
          className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5
            border border-border shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-lg">{data.emoji}</span>
          <span className="font-body font-bold text-foreground text-sm">
            {data.word}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}