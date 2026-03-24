import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, Paper } from '@mui/material';

export const DrawingCanvas = ({ onValidate, targetLetter, isProcessing }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [pointCount, setPointCount] = useState(0);
    const [ink, setInk] = useState<number[][][]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Ajuste de DPI para não ficar embaçado e corrigir o offset
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#00f2fe';

            // Desenha a "Letra Fantasma" ao carregar
            ctx.font = 'bold 160px Fredoka, Poppins, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(79, 172, 254, 0.08)';
            ctx.fillText(targetLetter.toUpperCase(), rect.width / 2 / window.devicePixelRatio, rect.height / 2 / window.devicePixelRatio);
        }
    }, [targetLetter]);

    const getPos = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        // CORREÇÃO DO OFFSET MOBILE/DESKTOP
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const start = (e: any) => {
        setIsDrawing(true);
        const { x, y } = getPos(e);
        setInk(prev => [...prev, [[x], [y], [Date.now()]]]);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.lineTo(x, y);
        ctx?.stroke();

        setPointCount(prev => {
            const next = prev + 1;
            if (next > 10) {
                setHasContent(true);
            }
            return next;
        });

        setInk(prev => {
            const current = [...prev];
            const last = current[current.length - 1];
            last[0].push(x);
            last[1].push(y);
            last[2].push(Date.now());
            return current;
        });
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.font = 'bold 160px Fredoka, Poppins, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(79, 172, 254, 0.08)';
        ctx.fillText(targetLetter.toUpperCase(), rect.width / 2 / window.devicePixelRatio, rect.height / 2 / window.devicePixelRatio);

        setHasContent(false);
        setPointCount(0);
        setInk([]);
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Paper elevation={4} sx={{ width: '100%', maxWidth: '320px', aspectRatio: '1/1', touchAction: 'none', border: '3px solid #4facfe', borderRadius: '20px', overflow: 'hidden' }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={start}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onTouchStart={(e) => { e.preventDefault(); start(e); }}
                    onTouchMove={(e) => { e.preventDefault(); draw(e); }}
                    onTouchEnd={(e) => { e.preventDefault(); setIsDrawing(false); }}
                    className="drawing-canvas"
                />
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: '320px' }}>
                <Button
                    variant="outlined"
                    fullWidth
                    disabled={!hasContent}
                    onClick={clearCanvas}
                    sx={{ borderRadius: '50px', py: 1.5, fontWeight: '600' }}
                >
                    Limpar
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    disabled={!hasContent || isProcessing}
                    onClick={() => onValidate(ink)}
                    sx={{
                        borderRadius: '50px',
                        py: 1.5,
                        fontWeight: '600',
                        background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(79, 172, 254, 0.6)'
                        }
                    }}
                >
                    {isProcessing ? '⏳ Verificando...' : '🪄 MÁGICA!'}
                </Button>
            </Box>
        </Box>
    );
};