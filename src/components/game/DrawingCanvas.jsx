import React, { useRef, useEffect } from 'react';

export function DrawingCanvas({ onDrawEnd, guideLetter, isCleared }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7C3AED';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (guideLetter) {
      ctx.save();
      ctx.font = 'bold 160px "Fredoka", "Comic Sans MS", sans-serif';
      ctx.fillStyle = 'rgba(203, 213, 225, 0.25)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(guideLetter.toUpperCase(), canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }, [guideLetter, isCleared]);

  const startDrawing = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      if (onDrawEnd) onDrawEnd(canvasRef.current);
    }
  };

  return (
    <div className="relative flex justify-center items-center w-full max-w-sm mx-auto my-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="bg-white border-4 border-purple-200 rounded-3xl shadow-xl touch-none cursor-crosshair transition-all hover:border-purple-300"
      />
    </div>
  );
}
