import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GamePanel from './GamePanel';

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <GamePanel
          tone="reward"
          initial={{ opacity: 0, y: -80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 flex items-center gap-3 max-w-xs w-[calc(100%-2rem)] cursor-pointer"
          onClick={onDismiss}
          role="status"
          aria-live="polite"
        >
          <motion.span
            className="text-4xl"
            animate={{ rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8 }}
          >
            {achievement.emoji}
          </motion.span>
          <div className="min-w-0">
            <p className="font-body font-bold text-sm text-primary">🏅 Nova Insígnia!</p>
            <p className="font-display text-base text-foreground">{achievement.title}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>
        </GamePanel>
      )}
    </AnimatePresence>
  );
}
