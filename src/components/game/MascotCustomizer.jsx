import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ACCESSORIES, isAccessoryUnlocked, loadMascotAccessories, saveMascotAccessories } from '@/lib/accessories';
import { playClickSound } from '@/lib/sounds';
import MascotAvatar from './MascotAvatar';
import '@/styles/premium-collectibles.css';

const CATEGORIES = [
  { id: 'hat', label: '🎩 Chapéus' },
  { id: 'glasses', label: '👓 Óculos' },
  { id: 'bow', label: '🎀 Acessórios' },
  { id: 'extra', label: '✨ Especiais' },
];

export default function MascotCustomizer({ totalStars }) {
  const [equipped, setEquipped] = useState(loadMascotAccessories);

  function toggle(accessory) {
    if (!isAccessoryUnlocked(accessory, totalStars)) return;
    playClickSound();
    const updated = { ...equipped };
    if (updated[accessory.category] === accessory.id) {
      delete updated[accessory.category];
    } else {
      updated[accessory.category] = accessory.id;
    }
    setEquipped(updated);
    saveMascotAccessories(updated);
  }

  return (
    <div className="space-y-4">
      {/* Live preview */}
      <div className="flex justify-center py-2">
        <MascotAvatar accessories={equipped} expression="happy" size="lg" />
      </div>

      {CATEGORIES.map(cat => {
        const items = ACCESSORIES.filter(a => a.category === cat.id);
        return (
          <div key={cat.id}>
            <p className="font-body font-bold text-sm text-foreground mb-2">{cat.label}</p>
            <div className="grid grid-cols-4 gap-2">
              {items.map(a => {
                const unlocked = isAccessoryUnlocked(a, totalStars);
                const selected = equipped[a.category] === a.id;
                return (
                  <motion.button
                    key={a.id}
                    whileTap={unlocked ? { scale: 0.9 } : {}}
                    onClick={() => toggle(a)}
                    aria-pressed={selected}
                    aria-disabled={!unlocked}
                    className={`lexia-collectible-tile flex flex-col items-center gap-0.5 p-2 rounded-2xl border-2 transition-all
                      ${selected ? 'lexia-collectible-tile-selected border-primary bg-primary/10' : 'border-border bg-muted/30'}
                      ${!unlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
                  >
                    <span className="text-2xl">{unlocked ? a.emoji : '🔒'}</span>
                    <span className="text-[10px] font-body font-semibold text-center leading-tight">{a.name}</span>
                    {!unlocked && <span className="text-[10px] text-muted-foreground">{a.unlockStars}⭐</span>}
                    {selected && <span className="text-[10px] text-primary">✓</span>}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground font-body text-center">
        Você tem {totalStars} ⭐ — ganhe mais para desbloquear acessórios!
      </p>
    </div>
  );
}