import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import MascotAvatar from './MascotAvatar';
import { playCelebrationSound } from '@/lib/sounds';

export default function WorldUnlockCelebration({ show, world, onDone }) {
  useEffect(() => {
    if (!show || !world) return;
    playCelebrationSound();

    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'];

    // Big center burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, scalar: 1.2 });

    // Side cannons for 2 seconds
    const end = Date.now() + 2000;
    function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();

    // Star-shaped burst
    const t1 = setTimeout(() => {
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors, shapes: ['star'], scalar: 1.5 });
    }, 600);

    // Final fireworks
    const t2 = setTimeout(() => {
      confetti({ particleCount: 60, spread: 120, startVelocity: 45, origin: { y: 0.4 }, colors });
    }, 1200);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show, world]);

  return (
    <AnimatePresence>
      {show && world && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <motion.div
            className="flex flex-col items-center gap-4 p-8 relative"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute w-48 h-48 rounded-full bg-accent/20 blur-3xl"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <MascotAvatar expression="celebrating" size="xl" />

            <motion.h2
              className="font-display text-3xl md:text-4xl text-primary text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.08, 1] }}
              transition={{ delay: 0.2, scale: { duration: 1.5, repeat: Infinity } }}
            >
              Mundo Completado! 🎉
            </motion.h2>

            {/* World card */}
            <motion.div
              className="flex items-center gap-3 bg-card border-2 border-primary/20 rounded-2xl px-6 py-3 shadow-lg"
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
              <div>
                <p className="font-display text-xl text-foreground">{world.name}</p>
                <p className="font-body text-sm text-muted-foreground">{world.description}</p>
              </div>
              <span className="text-3xl">🏆</span>
            </motion.div>

            {/* Stars */}
            <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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

            <motion.button
              className="mt-2 bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-display text-lg shadow-lg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDone}
            >
              Continuar Aventura! 🚀
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}