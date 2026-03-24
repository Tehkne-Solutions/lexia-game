import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Eraser, Sparkle } from '@phosphor-icons/react';

interface DrawingCanvasProps {
  onValidate: (ink: number[][][]) => void;
  isProcessing: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onValidate, isProcessing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [ink, setInk] = useState<number[][][]>([]);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setInk([]);
    setHasContent(false);
  }, [getCanvasContext]);

  // Efeito para ajustar o tamanho do canvas ao contêiner
  useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      
      // Reconfigura o contexto após redimensionar
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 8; // Linha um pouco mais grossa para crianças
      ctx.strokeStyle = '#052c41'; // Cor escura para bom contraste
      
      // Redesenha o traço atual se houver
      if(ink.length > 0) {
          ctx.beginPath();
          ink.forEach(stroke => {
              ctx.moveTo(stroke[0][0], stroke[1][0]);
              for (let i = 1; i < stroke[0].length; i++) {
                  ctx.lineTo(stroke[0][i], stroke[1][i]);
              }
          });
          ctx.stroke();
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [ink]);

  useEffect(() => {
    // Limpa o canvas quando o componente é re-montado (pela prop 'key' em App.tsx)
    clearCanvas();
  }, [clearCanvas]);
  
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e);
    const ctx = getCanvasContext();
    if (!ctx) return;

    setIsDrawing(true);
    setInk(prev => [...prev, [[x], [y], [Date.now()]]]);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);

    setInk(prev => {
      const current = [...prev];
      const lastStroke = current[current.length - 1];
      lastStroke[0].push(x);
      lastStroke[1].push(y);
      lastStroke[2].push(Date.now());
      return current;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleValidateClick = () => {
      if (hasContent) {
          onValidate(ink);
      }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box ref={containerRef} sx={{ width: '100%', height: '100%', touchAction: 'none', background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
        <Button
          variant="outlined"
          fullWidth
          disabled={!hasContent || isProcessing}
          onClick={clearCanvas}
          startIcon={<Eraser />}
          sx={{ borderRadius: 2, py: 1 }}
        >
          Limpar
        </Button>

        <Button
          variant="contained"
          fullWidth
          disabled={!hasContent || isProcessing}
          onClick={handleValidateClick}
          startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Sparkle />}
          sx={{ borderRadius: 2, py: 1, background: 'linear-gradient(45deg, #4facfe, #00f2fe)', '&:disabled': { background: 'grey.300'} }}
        >
          {isProcessing ? 'Verificando...' : 'Verificar'}
        </Button>
      </Box>
    </Box>
  );
};