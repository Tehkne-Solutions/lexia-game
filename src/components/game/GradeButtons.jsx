import React from 'react';
import { motion } from 'framer-motion';
import GameActionButton from '@/components/game/GameActionButton';
import { RotateCcw, Frown, Smile, PartyPopper } from 'lucide-react';

const grades = [
  { value: 1, label: 'Repetir', icon: RotateCcw, gameVariant: 'secondary', color: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive/50' },
  { value: 2, label: 'Difícil', icon: Frown, gameVariant: 'secondary', color: 'bg-accent hover:bg-accent/90 text-accent-foreground border-accent/50' },
  { value: 3, label: 'Bom!', icon: Smile, gameVariant: 'secondary', color: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary/50' },
  { value: 4, label: 'Fácil!', icon: PartyPopper, gameVariant: 'primary', color: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
];

export default function GradeButtons({ onGrade, disabled }) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-2 w-full max-w-[320px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <p className="col-span-2 text-center font-body font-semibold text-muted-foreground text-sm mb-1">
        Como foi? 🤔
      </p>
      {grades.map((g, i) => (
        <motion.div
          key={g.value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
        >
          <GameActionButton
            gameVariant={g.gameVariant}
            onClick={() => onGrade(g.value)}
            disabled={disabled}
            className={`w-full rounded-xl font-body font-bold text-sm py-5 gap-2 ${g.color} shadow-sm`}
          >
            <g.icon className="w-4 h-4" />
            {g.label}
          </GameActionButton>
        </motion.div>
      ))}
    </motion.div>
  );
}
