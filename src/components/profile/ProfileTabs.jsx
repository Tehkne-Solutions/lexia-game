import React from 'react';
import GameActionButton from '@/components/game/GameActionButton';
import { playClickSound } from '@/lib/sounds';

const PROFILE_TABS = [
  { id: 'avatar', label: '🐾 Avatar' },
  { id: 'mascot', label: '🎨 Corujinha' },
  { id: 'letters', label: '🔤 Letras' },
  { id: 'stickers', label: '🏆 Adesivos' },
  { id: 'badges', label: '🏅 Insígnias' },
];

export default function ProfileTabs({ activeTab, onChange }) {
  function selectTab(id) {
    playClickSound();
    onChange(id);
  }

  return (
    <div
      className="lexia-profile-tabs flex gap-2 overflow-x-auto sm:overflow-visible pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Seções do perfil"
    >
      {PROFILE_TABS.map(({ id, label }) => {
        const active = activeTab === id;
        return (
          <GameActionButton
            key={id}
            type="button"
            variant="ghost"
            gameVariant={active ? 'primary' : 'neutral'}
            role="tab"
            aria-selected={active}
            aria-pressed={active}
            onClick={() => selectTab(id)}
            className="flex-none min-w-[92px] sm:flex-1 sm:min-w-0 rounded-xl px-3 py-2 font-body font-bold text-sm"
          >
            {label}
          </GameActionButton>
        );
      })}
    </div>
  );
}
