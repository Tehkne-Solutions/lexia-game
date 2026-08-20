import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AVATARS } from '@/lib/avatars';

export default function ProfileAvatarPicker({ profile = {}, totalStars = 0, onSelect }) {
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Escolha seu Avatar</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((avatar) => {
            const locked = avatar.unlockStars > totalStars;
            const selected = profile.avatarId === avatar.id || (!profile.avatarId && avatar.id === 'owl');
            return (
              <motion.button
                key={avatar.id}
                whileTap={!locked ? { scale: 0.9 } : {}}
                onClick={() => onSelect(avatar)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all
                  ${selected ? 'border-primary bg-primary/10 ring-1 ring-primary/25' : 'border-border bg-muted/30'}
                  ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
              >
                <span className="text-3xl">{avatar.emoji}</span>
                <span className="text-xs font-body font-semibold text-foreground leading-tight text-center">{avatar.name}</span>
                {locked && <span className="text-xs text-muted-foreground">🔒 {avatar.unlockStars}⭐</span>}
                {selected && <span className="text-xs text-primary">✓</span>}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground font-body text-center mt-3">
          Você tem {totalStars} ⭐ — ganhe mais para desbloquear avatares!
        </p>
      </CardContent>
    </Card>
  );
}
