import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const toneClasses = {
  paper: 'lexia-game-panel',
  review: 'lexia-game-panel lexia-game-panel-review',
  reward: 'lexia-game-panel lexia-game-panel-reward',
  success: 'lexia-game-panel lexia-game-panel-success',
};

export default function GamePanel({
  tone = 'paper',
  className,
  children,
  ...props
}) {
  return (
    <motion.div
      className={cn(toneClasses[tone] || toneClasses.paper, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
