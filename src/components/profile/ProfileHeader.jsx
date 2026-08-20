import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GameActionButton from '@/components/game/GameActionButton';

/** @param {{ onBackClick?: () => void }} props */
export default function ProfileHeader({ onBackClick }) {
  return (
    <div className="lexia-gameplay-hud border-b border-border p-4 pt-[env(safe-area-inset-top)] sticky top-0 z-10">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <Link to="/">
          <GameActionButton
            gameVariant="neutral"
            variant="ghost"
            size="icon"
            className="lexia-hud-icon rounded-xl"
            onClick={onBackClick}
            aria-label="Voltar ao início"
          >
            <ArrowLeft className="w-5 h-5" />
          </GameActionButton>
        </Link>
        <h1 className="font-display text-2xl text-foreground">Meu Perfil</h1>
      </div>
    </div>
  );
}
