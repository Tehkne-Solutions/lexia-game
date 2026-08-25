import React from 'react';
import CurriculumGameplayHud from '../components/game/CurriculumGameplayHud';
import { DrawingCanvas } from '../components/game/DrawingCanvas';
import { GameplayResultActions } from '../components/game/GameplayResultActions';
import { CelebrationOverlay } from '../components/game/CelebrationOverlay';
import { usePlayGameViewModel } from '../hooks/usePlayGameViewModel';

export default function PlayGame() {
  const viewModel = usePlayGameViewModel();

  return (
    <main className="h-dvh w-full overflow-hidden flex flex-col justify-between bg-gradient-to-b from-sky-100 via-purple-50 to-amber-50 select-none p-3">
      <header className="w-full max-w-lg mx-auto flex-none">
        <CurriculumGameplayHud
          currentMission={viewModel.currentMission}
          progress={viewModel.progress}
          stars={viewModel.stars}
        />
      </header>

      <section className="flex-1 flex flex-col items-center justify-center my-auto w-full max-w-md mx-auto">
        <div className="text-center mb-2">
          <span className="text-3xl font-extrabold text-purple-700 tracking-wide">
            {viewModel.targetWordHint}
          </span>
        </div>

        <DrawingCanvas
          guideLetter={viewModel.targetLetter}
          onDrawEnd={viewModel.handleDrawEnd}
          isCleared={viewModel.isCanvasCleared}
        />
      </section>

      <footer className="w-full max-w-md mx-auto flex-none pb-2">
        <GameplayResultActions
          onClear={viewModel.clearCanvas}
          onVerify={viewModel.verifyDrawing}
          isLoading={viewModel.isVerifying}
        />
      </footer>

      <CelebrationOverlay
        isVisible={viewModel.showCelebration}
        accuracy={viewModel.lastAccuracy}
        onContinue={viewModel.handleContinueNext}
      />
    </main>
  );
}
