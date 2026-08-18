import React from 'react';
import { motion } from 'framer-motion';
import {
  LETTER_STICKERS,
  MILESTONE_STICKERS,
  getEarnedStickers,
  getJourneyStickers,
} from '@/lib/stickers';

function SmallStickerGrid({ stickers, earnedStickers, startDelay = 0 }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {stickers.map((sticker, index) => {
        const earned = earnedStickers.has(sticker.id);
        return (
          <motion.div
            key={sticker.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: startDelay + index * 0.015 }}
            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 p-1
              ${earned ? 'bg-primary/5 border-primary/35 shadow-sm' : 'bg-muted/30 border-border opacity-45'}`}
          >
            <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>{earned ? sticker.emoji : '🔒'}</span>
            <span className="text-[10px] font-body font-semibold text-center leading-tight">
              {earned ? sticker.name : '???'}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function StickerAlbum({ allProgress, stats }) {
  const earnedStickers = getEarnedStickers(allProgress, stats);
  const journeyStickers = getJourneyStickers(stats);
  const totalCollectibles = journeyStickers.length + LETTER_STICKERS.length + MILESTONE_STICKERS.length;
  const journeyUnlocked = journeyStickers.filter((sticker) => sticker.unlocked).length;

  return (
    <div className="space-y-5">
      <section aria-labelledby="journey-relics-title">
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <h3 id="journey-relics-title" className="font-display text-base text-foreground">Relíquias da Jornada</h3>
            <p className="font-body text-xs text-muted-foreground">Uma relíquia por capítulo, mais a Lanterna da Maestria.</p>
          </div>
          <span className="font-body text-xs font-bold text-primary whitespace-nowrap">{journeyUnlocked}/6</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {journeyStickers.map((sticker, index) => (
            <motion.div
              key={sticker.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`min-h-[132px] rounded-2xl border-2 p-3 flex flex-col
                ${sticker.unlocked ? 'bg-primary/5 border-primary/35 shadow-sm' : 'bg-muted/30 border-border'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-3xl ${sticker.unlocked ? '' : 'grayscale opacity-45'}`} aria-hidden="true">
                  {sticker.unlocked ? sticker.emoji : '🔒'}
                </span>
                <span className="font-body text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground text-right">
                  {sticker.chapter}
                </span>
              </div>
              <p className="font-body text-[10px] text-primary font-bold mt-2 line-clamp-1">{sticker.worldTitle}</p>
              <p className="font-display text-sm text-foreground leading-tight mt-0.5">
                {sticker.unlocked ? sticker.shortName : 'Relíquia secreta'}
              </p>
              <p className="font-body text-[10px] text-muted-foreground leading-snug mt-1">
                {sticker.unlocked ? sticker.description : 'Domine este capítulo para revelar sua relíquia.'}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section aria-labelledby="alphabet-stickers-title">
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <h3 id="alphabet-stickers-title" className="font-display text-base text-foreground">Álbum do Alfabeto</h3>
            <p className="font-body text-xs text-muted-foreground">Cada letra dominada revela seu adesivo.</p>
          </div>
          <span className="font-body text-xs font-bold text-muted-foreground whitespace-nowrap">
            {stats.lettersMastered || 0}/26
          </span>
        </div>
        <SmallStickerGrid stickers={LETTER_STICKERS} earnedStickers={earnedStickers} startDelay={0.08} />
      </section>

      <section aria-labelledby="milestone-stickers-title">
        <div className="mb-2">
          <h3 id="milestone-stickers-title" className="font-display text-base text-foreground">Marcos da Aventura</h3>
          <p className="font-body text-xs text-muted-foreground">Conquistas especiais de domínio, estrelas e sequência.</p>
        </div>
        <SmallStickerGrid stickers={MILESTONE_STICKERS} earnedStickers={earnedStickers} startDelay={0.16} />
      </section>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
        <p className="font-body text-xs text-foreground font-bold">
          {earnedStickers.size}/{totalCollectibles} itens colecionados
        </p>
        <p className="font-body text-xs text-muted-foreground mt-0.5">
          Explore todos os capítulos, domine habilidades e conquiste as seis relíquias da jornada.
        </p>
      </div>
    </div>
  );
}
