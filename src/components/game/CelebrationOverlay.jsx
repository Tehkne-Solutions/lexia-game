import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playCelebrationSound } from '@/lib/sounds';
import '@/styles/premium-celebration.css';
import MascotAvatar from './MascotAvatar';
import GamePanel from './GamePanel';
import GameActionButton from './GameActionButton';

const celebrationPalette = ['#24445c', '#2f7d67', '#c6933f', '#d7c8aa', '#7a9a87'];

export default function CelebrationOverlay({ show, stars, message, onDone }) {
  useEffect(() => {
    if (!show) return;
    playCelebrationSound();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: celebrationPalette,
      scalar: 1.1,
    });

    const end = Date.now() + 1500;
    function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: celebrationPalette });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: celebrationPalette });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();

    if (stars > 0) {
      const t = setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.5 },
          colors: celebrationPalette,
          scalar: 0.9,
        });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="lexia-celebration-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <GamePanel
            tone="reward"
            className="relative w-full max-w-sm overflow-hidden px-6 py-8 flex flex-col items-center gap-4 text-center"
            initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
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
              <MascotAvatar expression="celebrating" size="lg" />
            </div>

            <motion.h2
              className="relative z-10 font-display text-4xl md:text-5xl text-primary text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.05, 1] }}
              transition={{ delay: 0.2, scale: { duration: 1.5, repeat: Infinity } }}
            >
              {message || 'Incrível!'}
            </motion.h2>

            {stars > 0 && (
              <motion.div className="relative z-10 flex gap-3" aria-label={`${stars} estrelas conquistadas`}>
                {Array.from({ length: stars }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-5xl"
                    initial={{ scale: 0, rotate: -180, y: 30 }}
                    animate={{ scale: 1, rotate: 0, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.18, type: 'spring', stiffness: 260, damping: 12 }}
                  >
                    <motion.span
                      className="inline-block"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 + i * 0.18 }}
                    >
                      ⭐
                    </motion.span>
                  </motion.span>
                ))}
              </motion.div>
            )}

            <GameActionButton
              gameVariant="primary"
              className="relative z-10 mt-2 px-8 py-3 font-display text-lg"
              onClick={(event) => {
                event.stopPropagation();
                onDone?.();
              }}
            >
              Continuar 🚀
            </GameActionButton>
          </GamePanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
