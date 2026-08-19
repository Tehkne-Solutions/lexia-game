import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Sparkles } from 'lucide-react';
import GameActionButton from '@/components/game/GameActionButton';

export default function CurriculumGameplayHud({
  title,
  missionLabel,
  isPracticeMode,
  isReviewMode,
  isDailyMode,
  totalStars,
  streak,
  onHome,
}) {
  return (
    <>
      <header className="game-safe-top lexia-gameplay-hud flex items-center justify-between px-3 py-2 flex-shrink-0">
        <Link to={isReviewMode ? '/' : '/world'} aria-label={isReviewMode ? 'Voltar ao início' : 'Voltar ao mapa'}>
          <GameActionButton
            gameVariant="neutral"
            variant="ghost"
            size="icon"
            className="lexia-hud-icon h-9 w-9 rounded-xl"
            onClick={onHome}
          >
            <Home className="w-4 h-4" />
          </GameActionButton>
        </Link>

        <div className="flex items-center justify-center gap-2 min-w-0 flex-1 px-2">
          {isPracticeMode && (
            <span className="lexia-mode-chip lexia-mode-chip-practice">
              <Sparkles className="w-3 h-3" /> Prática
            </span>
          )}
          <span className="font-display text-sm sm:text-base text-foreground truncate">{title}</span>
          <span className="lexia-stat-chip" aria-label={`${totalStars} estrelas`}>
            <span aria-hidden="true">⭐</span>
            <span>{totalStars}</span>
          </span>
          {streak > 0 && (
            <span className="lexia-stat-chip hidden sm:inline-flex" aria-label={`${streak} sequência`}>
              <span aria-hidden="true">🔥</span>
              <span>{streak}</span>
            </span>
          )}
        </div>
        <div className="w-9" aria-hidden="true" />
      </header>

      {!isPracticeMode && !isReviewMode && !isDailyMode && (
        <div className="lexia-gameplay-context flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-body flex-shrink-0">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold text-primary">Capítulo</span>
          <span className="text-muted-foreground truncate">{missionLabel}</span>
        </div>
      )}

      {isDailyMode && (
        <div className="lexia-gameplay-context lexia-gameplay-context-reward flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-body flex-shrink-0">
          <span aria-hidden="true">🏆</span>
          <span className="font-bold">Desafio diário</span>
          <span>alvo novo vale ⭐×2</span>
        </div>
      )}
    </>
  );
}
