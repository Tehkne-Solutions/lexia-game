import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Map as MapIcon, ThumbsDown, ThumbsUp } from 'lucide-react';
import GameActionButton from '@/components/game/GameActionButton';

export default function GameplayResultActions({
  isWorking,
  isPracticeMode,
  isReviewMode,
  onManualOverride,
  onRetry,
  onContinue,
}) {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-2" aria-label="Ações do resultado">
      <div className="lexia-result-feedback-panel">
        <p className="text-xs font-body text-muted-foreground text-center mb-2">
          A corujinha errou? Corrija:
        </p>
        <div className="flex gap-2">
          <GameActionButton
            gameVariant="neutral"
            variant="outline"
            size="sm"
            onClick={() => onManualOverride(false)}
            disabled={isWorking}
            className="lexia-result-correction lexia-result-correction-negative flex-1 rounded-xl gap-1 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
          >
            <ThumbsDown className="w-3 h-3" /> Estava errado
          </GameActionButton>
          <GameActionButton
            gameVariant="neutral"
            variant="outline"
            size="sm"
            onClick={() => onManualOverride(true)}
            disabled={isWorking}
            className="lexia-result-correction lexia-result-correction-positive flex-1 rounded-xl gap-1 text-xs text-secondary border-secondary/40 hover:bg-secondary/10"
          >
            <ThumbsUp className="w-3 h-3" /> Estava certo!
          </GameActionButton>
        </div>
      </div>

      <div className="flex gap-2">
        <GameActionButton
          gameVariant="neutral"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isWorking}
          className="flex-1 font-body font-bold text-xs"
        >
          Tentar novamente
        </GameActionButton>
        <GameActionButton
          gameVariant="secondary"
          size="sm"
          onClick={onContinue}
          disabled={isWorking}
          className="flex-1 font-display text-sm gap-1"
        >
          {isPracticeMode ? 'Próxima' : 'Continuar'} <ChevronRight className="w-3.5 h-3.5" />
        </GameActionButton>
      </div>

      {!isPracticeMode && !isReviewMode && (
        <Link to="/world" className="w-full">
          <GameActionButton
            gameVariant="neutral"
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-xs text-muted-foreground"
          >
            <MapIcon className="w-3.5 h-3.5" /> Ver jornada no mapa
          </GameActionButton>
        </Link>
      )}
    </div>
  );
}
