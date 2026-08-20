import React from 'react';
import { Flame, Star, Target, Trophy } from 'lucide-react';
import GamePanel from '@/components/game/GamePanel';

export default function ProfileStats({
  totalStars,
  journeyMastered,
  journeyTotal,
  maxStreak,
  accuracy,
}) {
  const stats = [
    { icon: Star, label: 'Estrelas', value: totalStars, iconClass: 'text-accent fill-accent' },
    { icon: Trophy, label: 'Jornada', value: `${journeyMastered}/${journeyTotal}`, iconClass: 'text-primary' },
    { icon: Flame, label: 'Sequência', value: maxStreak, iconClass: 'text-destructive' },
    { icon: Target, label: 'Precisão', value: `${accuracy}%`, iconClass: 'text-secondary' },
  ];

  return (
    <div className="lexia-profile-stats grid grid-cols-4 gap-2" aria-label="Resumo do perfil">
      {stats.map(({ icon: Icon, label, value, iconClass }) => (
        <GamePanel key={label} tone="paper" className="rounded-2xl p-3 text-center">
          <Icon className={`w-5 h-5 mx-auto mb-1 ${iconClass}`} aria-hidden="true" />
          <p className="font-display text-lg text-foreground">{value}</p>
          <p className="text-xs font-body text-muted-foreground">{label}</p>
        </GamePanel>
      ))}
    </div>
  );
}
