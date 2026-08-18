import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2 } from 'lucide-react';
import {
  getChallengeCompletedCount,
  getNextChallengeTarget,
} from '@/lib/dailyChallenge';
import { playClickSound } from '@/lib/sounds';

export default function DailyChallengeCard({ challenge, onStart, onClose }) {
  if (!challenge) return null;

  const completedCount = getChallengeCompletedCount(challenge);
  const targetCount = challenge.targets?.length || 0;
  const nextTarget = getNextChallengeTarget(challenge);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-card border-2 border-amber-300 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <motion.span
            className="text-4xl"
            animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            aria-hidden="true"
          >
            🏆
          </motion.span>
          <div className="min-w-0">
            <p className="font-body text-[10px] text-amber-700 font-bold uppercase tracking-[0.12em]">
              Missão especial · {challenge.typeLabel}
            </p>
            <h2 className="font-display text-xl text-foreground">{challenge.title}</h2>
          </div>
        </div>

        <p className="font-body text-sm text-muted-foreground mb-3">
          {challenge.description} Cada alvo novo vale <strong className="text-foreground">⭐×{challenge.starsMultiplier}</strong>.
        </p>

        <div className="space-y-2 mb-4">
          {(challenge.targets || []).map((target, index) => {
            const done = Boolean(challenge.progress?.[target.key]);
            return (
              <motion.div
                key={target.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`rounded-2xl border p-3 flex items-center gap-3
                  ${done ? 'bg-green-50 border-green-300' : 'bg-muted/30 border-border'}`}
              >
                <span className="text-2xl flex-none" aria-hidden="true">{target.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base text-foreground leading-tight break-words">{target.display}</p>
                  <p className="font-body text-[11px] text-muted-foreground truncate">{target.hint}</p>
                </div>
                {done && <CheckCircle2 className="w-5 h-5 text-green-600 flex-none" aria-label="Concluído" />}
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{ width: `${targetCount > 0 ? (completedCount / targetCount) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-body text-muted-foreground">{completedCount}/{targetCount}</span>
        </div>

        {challenge.completed ? (
          <div className="text-center">
            <p className="font-display text-xl text-green-600 mb-2">🎉 Desafio completo!</p>
            <Button
              onClick={() => { playClickSound(); onClose(); }}
              className="w-full rounded-2xl bg-green-600 hover:bg-green-700 font-display"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { playClickSound(); onClose(); }}
              className="flex-1 rounded-2xl"
            >
              Depois
            </Button>
            <Button
              onClick={() => { playClickSound(); onStart(nextTarget, challenge); }}
              className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display gap-2 shadow-md"
            >
              <Zap className="w-4 h-4" />
              Jogar!
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
