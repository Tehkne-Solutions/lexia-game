import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import MascotAvatar from './MascotAvatar';
import GamePanel from './GamePanel';
import GameActionButton from './GameActionButton';
import { playCelebrationSound } from '@/lib/sounds';

const celebrationPalette = ['#24445c', '#2f7d67', '#c6933f', '#d7c8aa', '#7a9a87'];

export default function WorldUnlockCelebration({ show, world, onDone }) {
  useEffect(() => {
    if (!show || !world) return;
    playCelebrationSound();

    // Big center burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: celebrationPalette, scalar: 1.2 });

    // Side cannons for 2 seconds
    const end = Date.now() + 2000;
    function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: celebrationPalette });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: celebrationPalette });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();

    // Star-shaped burst
    const t1 = setTimeout(() => {
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: celebrationPalette, shapes: ['star'], scalar: 1.5 });
    }, 600);

    // Final fireworks
    const t2 = setTimeout(() => {
      confetti({ particleCount: 60, spread: 120, startVelocity: 45, origin: { y: 0.4 }, colors: celebrationPalette });
    }, 1200);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show, world]);

  return (
    <AnimatePresence>
      {show && world && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <GamePanel
            tone="reward"
            className="relative w-full max-w-md overflow-hidden px-6 py-8 flex flex-col items-center gap-4 text-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-[1.75rem] border border-accent/25"
              animate={{ scale: [1, 1.015, 1], opacity: [0.55, 0.9, 0.55] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative z-10">
              <MascotAvatar expression="celebrating" size="xl" />
            </div>

            <motion.h2
              className="relative z-10 font-display text-3xl md:text-4xl text-primary text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.08, 1] }}
              transition={{ delay: 0.2, scale: { duration: 1.5, repeat: Infinity } }}
            >
              Mundo Completado! 🎉
            </motion.h2>

            <GamePanel
              tone="paper"
              className="relative z-10 flex w-full items-center gap-3 px-5 py-3 text-left"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
              >
                {world.emoji}
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl text-foreground">{world.name}</p>
                <p className="font-body text-sm text-muted-foreground">{world.description}</p>
              </div>
              <span className="text-3xl" aria-hidden="true">🏆</span>
            </GamePanel>

            <motion.div
              className="relative z-10 flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              aria-label="3 estrelas conquistadas"
            >
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="text-4xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 260, damping: 12 }}
                >
                  ⭐
                </motion.span>
              ))}
            </motion.div>

            <GameActionButton
              gameVariant="primary"
              className="relative z-10 mt-2 px-8 py-3 font-display text-lg"
              onClick={(event) => {
                event.stopPropagation();
                onDone?.();
              }}
            >
              Continuar Aventura! 🚀
            </GameActionButton>
          </GamePanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
