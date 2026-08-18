import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, Lock } from 'lucide-react';
import { playClickSound } from '@/lib/sounds';

export default function DailyChallengeCard({ challenge, onStart, onClose }) {
  if (!challenge) return null;

  const { letters, progress, completed, starsMultiplier } = challenge;
  const completedCount = letters.filter(l => progress[l]).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.span
            className="text-4xl"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            🏆
          </motion.span>
          <div>
            <p className="font-body text-xs text-amber-600 font-bold uppercase tracking-wide">Missão Especial</p>
            <h2 className="font-display text-2xl text-amber-800">Desafio Diário!</h2>
          </div>
        </div>

        {/* Description */}
        <p className="font-body text-sm text-amber-700 mb-4">
          Pratique as 3 letras abaixo e ganhe <strong>⭐×{starsMultiplier}</strong> estrelas por acerto!
        </p>

        {/* Letters to practice */}
        <div className="flex justify-center gap-4 mb-5">
          {letters.map((letter, i) => {
            const done = progress[letter];
            return (
              <motion.div
                key={letter}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className={`w-16 h-16 rounded-2xl border-3 flex flex-col items-center justify-center relative
                  ${done
                    ? 'bg-green-100 border-green-400'
                    : 'bg-white border-amber-300'
                  }`}
              >
                <span className="font-display text-3xl text-amber-700">{letter}</span>
                {done && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 absolute -top-1.5 -right-1.5" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{ width: `${(completedCount / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-body text-amber-700">{completedCount}/3</span>
        </div>

        {completed ? (
          <div className="text-center">
            <p className="font-display text-xl text-green-600 mb-2">🎉 Desafio Completo!</p>
            <Button onClick={() => { playClickSound(); onClose(); }}
              className="w-full rounded-2xl bg-green-500 hover:bg-green-600 font-display">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { playClickSound(); onClose(); }}
              className="flex-1 rounded-2xl border-amber-300 text-amber-700 hover:bg-amber-50">
              Depois
            </Button>
            <Button onClick={() => { playClickSound(); onStart(letters.find(l => !progress[l])); }}
              className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display gap-2 shadow-md">
              <Zap className="w-4 h-4" />
              Jogar!
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}