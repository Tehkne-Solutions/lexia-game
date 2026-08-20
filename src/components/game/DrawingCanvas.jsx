import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Eraser, Loader2, CheckCircle } from 'lucide-react';
import GamePanel from '@/components/game/GamePanel';
import GameActionButton from '@/components/game/GameActionButton';
import { playDrawSound, playClickSound } from '@/lib/sounds';

export default function DrawingCanvas({ targetLetter, onEvaluate, disabled }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    setHasContent(false);
    setIsEvaluating(false);
    initCanvas();
  }, [targetLetter]);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) { setTimeout(initCanvas, 50); return; }
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    drawGuide(ctx, rect.width, rect.height);
  }

  function drawGuide(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.font = `bold ${Math.min(w, h) * 0.65}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(targetLetter, w / 2, h / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.setLineDash([4, 8]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  const startDraw = useCallback((e) => {
    if (disabled || isEvaluating) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [disabled, isEvaluating]);

  const draw = useCallback((e) => {
    if (!isDrawing || disabled || isEvaluating) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = 'hsl(258, 65%, 45%)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setHasContent(true);
    if (Math.random() < 0.08) playDrawSound();
  }, [isDrawing, disabled, isEvaluating]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
  }, [isDrawing]);

  async function handleVerify() {
    if (!hasContent || isEvaluating) return;
    playClickSound();
    setIsEvaluating(true);
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    await onEvaluate(dataUrl);
    setIsEvaluating(false);
  }

  function clearCanvas() {
    if (isEvaluating) return;
    playClickSound();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawGuide(ctx, rect.width, rect.height);
    setHasContent(false);
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <GamePanel
        tone="paper"
        className="game-drawing-board relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-card flex-shrink-0"
        whileTap={!isEvaluating ? { scale: 0.99 } : {}}
        aria-label={`Área de desenho da letra ${targetLetter}`}
      >
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-primary/40 rounded-tl-md z-10" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-primary/40 rounded-tr-md z-10" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-primary/40 rounded-bl-md z-10" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-primary/40 rounded-br-md z-10" />

        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {isEvaluating && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-2 z-20" role="status" aria-live="polite">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-body font-bold text-primary text-xs">Avaliando... ✨</p>
          </div>
        )}

        {!hasContent && !isEvaluating && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <p className="text-xs font-body text-muted-foreground bg-background border border-border rounded-full px-2.5 py-0.5">
              ✏️ Desenhe aqui!
            </p>
          </div>
        )}
      </GamePanel>

      <div className="game-drawing-actions flex gap-2">
        <GameActionButton
          gameVariant="secondary"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={isEvaluating || !hasContent}
          className="rounded-xl font-body font-bold gap-1.5 flex-1"
        >
          <Eraser className="w-4 h-4" />
          Limpar
        </GameActionButton>
        <GameActionButton
          gameVariant="primary"
          size="sm"
          onClick={handleVerify}
          disabled={isEvaluating || !hasContent || disabled}
          className="rounded-xl font-body font-bold gap-1.5 flex-1"
        >
          {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Verificar
        </GameActionButton>
      </div>
    </div>
  );
}
