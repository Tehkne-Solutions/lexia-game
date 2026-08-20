import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Grid3X3, Home, Sparkles, Zap } from 'lucide-react';
import GameActionButton from '@/components/game/GameActionButton';
import ProgressBar from '@/components/game/ProgressBar';

export default function GameplayHud({
  isPracticeMode,
  isReviewMode,
  isDailyMode,
  dailyChallenge,
  masteredCount,
  totalStreak,
  totalStars,
  isCurrentMissionTarget,
  journeyTitle,
  onOpenDailyChallenge,
  onOpenSelector,
  onHome,
}) {
  return (
    <>
      <header className="game-safe-top lexia-gameplay-hud flex items-center justify-between px-3 py-2 flex-shrink-0">
        <Link to="/" aria-label="Voltar para o início">
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

        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {isPracticeMode && (
            <span className="lexia-mode-chip lexia-mode-chip-practice">
              <Sparkles className="w-3 h-3" /> Prática Livre
            </span>
          )}
          <ProgressBar current={masteredCount} total={26} streak={totalStreak} stars={totalStars} />
        </div>

        <div className="flex gap-1">
          {!isReviewMode && dailyChallenge?.type === 'letters' && !dailyChallenge.completed && (
            <GameActionButton
              gameVariant="neutral"
              variant="ghost"
              size="icon"
              className="lexia-hud-icon h-9 w-9 rounded-xl relative"
              onClick={onOpenDailyChallenge}
              aria-label="Abrir desafio diário"
            >
              <Zap className="w-4 h-4 text-accent" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </GameActionButton>
          )}
          {!isReviewMode && (
            <GameActionButton
              gameVariant="neutral"
              variant="ghost"
              size="icon"
              className="lexia-hud-icon h-9 w-9 rounded-xl"
              onClick={onOpenSelector}
              aria-label="Escolher letra"
            >
              <Grid3X3 className="w-4 h-4" />
            </GameActionButton>
          )}
        </div>
      </header>

      {!isPracticeMode && !isReviewMode && !isDailyMode && (
        <div className="lexia-gameplay-context flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-body flex-shrink-0">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold text-primary">
            {isCurrentMissionTarget ? 'Missão atual' : 'Missão recomendada'}
          </span>
          <span className="text-muted-foreground truncate">{journeyTitle}</span>
          <Link to="/world" className="ml-1 text-primary font-bold hover:underline">Mapa</Link>
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
