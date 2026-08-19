import React from 'react';
import { motion } from 'framer-motion';
import { loadMascotAccessories, getEquippedAccessories } from '@/lib/accessories';

const EXPRESSIONS = {
  happy: { eyes: '✨', mouth: '😊' },
  excited: { eyes: '🌟', mouth: '🤩' },
  thinking: { eyes: '👀', mouth: '🤔' },
  celebrating: { eyes: '🎉', mouth: '🥳' },
  encouraging: { eyes: '💪', mouth: '😃' },
  sleeping: { eyes: '💤', mouth: '😴' },
};

/**
 * @param {{
 *   expression?: string,
 *   size?: string,
 *   message?: React.ReactNode,
 *   className?: string,
 *   accessories?: any
 * }} props
 */
export default function MascotAvatar({ expression = 'happy', size = 'md', message, className = '', accessories }) {
  const sizes = {
    sm: 'w-16 h-16 text-3xl',
    md: 'w-24 h-24 text-5xl',
    lg: 'w-32 h-32 text-6xl',
    xl: 'w-40 h-40 text-7xl',
  };

  const expr = EXPRESSIONS[expression] || EXPRESSIONS.happy;
  const equipped = getEquippedAccessories(accessories || loadMascotAccessories());

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 
          flex items-center justify-center relative border-4 border-primary/30 shadow-lg`}
        animate={
          expression === 'celebrating'
            ? { rotate: [0, -5, 5, -5, 5, 0], scale: [1, 1.1, 1] }
            : expression === 'thinking'
            ? { y: [0, -3, 0] }
            : { y: [0, -6, 0] }
        }
        transition={{
          duration: expression === 'celebrating' ? 0.6 : 2,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
        }}
      >
        <span role="img" aria-label="mascot">🦉</span>

        {equipped.hat && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-20" style={{ fontSize: '1.4em' }}>{equipped.hat.emoji}</span>
        )}
        {equipped.glasses && (
          <span className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20" style={{ fontSize: '0.9em' }}>{equipped.glasses.emoji}</span>
        )}
        {equipped.bow && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20" style={{ fontSize: '0.9em' }}>{equipped.bow.emoji}</span>
        )}
        {equipped.extra && (
          <span className="absolute -top-1 -right-1 z-20" style={{ fontSize: '1em' }}>{equipped.extra.emoji}</span>
        )}

        {(expression === 'celebrating' || expression === 'excited') && (
          <>
            <motion.span
              className="absolute -top-2 -right-2 text-lg"
              animate={{ scale: [0, 1.2, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            >✨</motion.span>
            <motion.span
              className="absolute -bottom-1 -left-2 text-lg"
              animate={{ scale: [0, 1.2, 0], rotate: [0, -180, -360] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            >⭐</motion.span>
            <motion.span
              className="absolute top-0 left-0 text-sm"
              animate={{ scale: [0, 1, 0], y: [0, -15, -30], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >🌟</motion.span>
          </>
        )}
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-card border-2 border-primary/20 rounded-2xl px-4 py-2 max-w-[200px]
            text-center text-sm font-body font-semibold text-foreground shadow-md relative"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l-2 border-t-2 
            border-primary/20 rotate-45" />
          <span className="relative z-10">{message}</span>
        </motion.div>
      )}
    </div>
  );
}
