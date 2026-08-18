import React from 'react';
import { motion } from 'framer-motion';
import { LETTER_STICKERS, MILESTONE_STICKERS, getEarnedStickers } from '@/lib/stickers';

export default function StickerAlbum({ allProgress, stats }) {
  const earnedStickers = getEarnedStickers(allProgress, stats);
  const allStickers = [...LETTER_STICKERS, ...MILESTONE_STICKERS];

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {allStickers.map((sticker, i) => {
          const earned = earnedStickers.has(sticker.id);
          return (
            <motion.div
              key={sticker.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 p-1
                ${earned ? 'bg-gradient-to-br from-accent/20 to-primary/20 border-primary/40 shadow-md' : 'bg-muted/30 border-border opacity-40'}`}
            >
              <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>{earned ? sticker.emoji : '🔒'}</span>
              <span className="text-[10px] font-body font-semibold text-center leading-tight">
                {earned ? sticker.name : '???'}
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground font-body text-center mt-3">
        {earnedStickers.size}/{allStickers.length} adesivos colecionados · Domine letras para ganhar mais!
      </p>
    </div>
  );
}