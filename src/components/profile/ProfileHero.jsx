import React from 'react';
import { motion } from 'framer-motion';

/**
 * @param {{
 *   currentAvatar: any,
 *   dailyDone: boolean,
 *   level: number,
 *   starsToNextLevel: number,
 * }} props
 */
export default function ProfileHero({ currentAvatar, dailyDone, level, starsToNextLevel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="lexia-game-panel lexia-game-panel-reward rounded-2xl p-5 flex items-center gap-4"
    >
      <div className="text-6xl">{currentAvatar.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display text-xl text-foreground">{currentAvatar.name}</p>
          {dailyDone && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="rounded-full border border-accent/45 bg-accent/15 px-2 py-0.5 text-xs font-body font-bold text-accent-foreground flex items-center gap-1"
            >
              🏆 Desafio Diário!
            </motion.span>
          )}
        </div>
        <p className="font-body text-sm text-muted-foreground">Nível {level} · Corujinha Guardiã</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((5 - starsToNextLevel) / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs font-body text-muted-foreground whitespace-nowrap">{starsToNextLevel} ⭐ p/ nível {level + 1}</span>
        </div>
      </div>
    </motion.div>
  );
}
