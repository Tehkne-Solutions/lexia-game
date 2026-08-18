import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 
            ${achievement.color} border-2 rounded-2xl px-5 py-3 
            flex items-center gap-3 shadow-xl max-w-xs w-full cursor-pointer`}
          onClick={onDismiss}
        >
          <motion.span
            className="text-4xl"
            animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8 }}
          >
            {achievement.emoji}
          </motion.span>
          <div>
            <p className={`font-body font-bold text-sm ${achievement.textColor}`}>
              🏅 Nova Insígnia!
            </p>
            <p className={`font-display text-base ${achievement.textColor}`}>
              {achievement.title}
            </p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}