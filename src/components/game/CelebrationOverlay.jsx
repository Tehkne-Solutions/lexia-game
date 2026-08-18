import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playCelebrationSound } from '@/lib/sounds';
import MascotAvatar from './MascotAvatar';

export default function CelebrationOverlay({ show, stars, message, onDone }) {
  useEffect(() => {
    if (!show) return;
    playCelebrationSound();

    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'];

    // Burst confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      scalar: 1.1,
    });

    // Side cannons
    const end = Date.now() + 1500;
    function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();

    // Final burst after stars appear
    if (stars > 0) {
      const t = setTimeout(() => {
        confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 }, colors, scalar: 0.9 });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <motion.div
            className="flex flex-col items-center gap-4 p-8"
            initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Glow ring behind mascot */}
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-accent/20 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <MascotAvatar expression="celebrating" size="lg" />

            <motion.h2
              className="font-display text-4xl md:text-5xl text-primary text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.08, 1] }}
              transition={{ delay: 0.2, scale: { duration: 1.5, repeat: Infinity } }}
            >
              {message || 'Incrível!'}
            </motion.h2>

            {/* Stars with staggered pop + sparkle */}
            {stars > 0 && (
              <motion.div className="flex gap-3">
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
                      animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 + i * 0.18 }}
                    >
                      ⭐
                    </motion.span>
                  </motion.span>
                ))}
              </motion.div>
            )}

            <motion.button
              className="mt-2 bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-display text-lg shadow-lg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + stars * 0.18 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continuar 🚀
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}