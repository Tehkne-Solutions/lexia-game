import React, { useRef, useEffect, useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Stack,
    LinearProgress,
    IconButton,
    Tooltip,
    Button,
    ButtonGroup,
} from '@mui/material';

import { motion } from 'framer-motion';
import { useEvaluation } from '../hooks/useEvaluation';
import { StrokePoint } from '../lib/recognition';
import confetti from 'canvas-confetti';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

const celebrateSuccess = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        // Dispara de dois lados para efeito de palco
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Som de Vitória (Web Audio API para evitar delay de carregamento de MP3 externo)
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Lá
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5); // Lá oitavado
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
};

interface DrawingCanvasProps {
    targetLetter: string;
    onLetterDetected: (letter: string) => void;
    onEvaluationResult: (grade: number) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    targetLetter,
    onLetterDetected,
    onEvaluationResult,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [detectedLetter, setDetectedLetter] = useState('');
    const [showGradeButtons, setShowGradeButtons] = useState(false);
    const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
    const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
    const [isAutomatic, setIsAutomatic] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const { evaluateDrawing } = useEvaluation();

    // Animate particles
    useEffect(() => {
        if (particles.length === 0) return;

        const animate = () => {
            setParticles(prev => prev.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - 16, // assuming 60fps
            })).filter(p => p.life > 0));
        };

        const interval = setInterval(animate, 16);
        return () => clearInterval(interval);
    }, [particles]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Desenhar fundo com gradiente
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        // Draw ghost letter
        drawGhostLetter(ctx, canvas, targetLetter);
    }, [targetLetter]);

    // Draw particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and redraw background and ghost letter
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        drawGhostLetter(ctx, canvas, targetLetter);

        // Draw particles
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }, [particles, targetLetter]);

    const drawGhostLetter = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, letter: string) => {
        ctx.save();
        ctx.font = '200px "Fredoka One"';
        ctx.fillStyle = 'rgba(200, 200, 200, 0.15)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const t = Date.now();

        ctx.beginPath();
        ctx.moveTo(x, y);

        // Start new stroke
        setCurrentStroke([{ x, y, t }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const t = Date.now();

        ctx.lineTo(x, y);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4facfe';
        ctx.stroke();

        // Add particles
        const newParticle: Particle = {
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 500,
            maxLife: 500,
        };
        setParticles(prev => [...prev, newParticle]);

        // Add point to current stroke
        setCurrentStroke(prev => [...prev, { x, y, t }]);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        if (currentStroke.length > 0) {
            setStrokes(prev => [...prev, currentStroke]);
            setCurrentStroke([]);
        }
    };

    const handleValidateDrawing = async () => {
        if (strokes.length === 0) return;

        // Use automatic evaluation
        const result = await evaluateDrawing(targetLetter, strokes);

        setIsAutomatic(result.isAutomatic);

        if (result.isAutomatic) {
            // Automatic evaluation successful
            setDetectedLetter(result.recognizedLetter || '');
            setConfidence(result.confidence * 100);

            // Call evaluation result
            onEvaluationResult(result.grade);

            // Celebrate if good grade
            if (result.grade >= 3) {
                celebrateSuccess();
            }

            // Reset for next attempt
            setStrokes([]);
            setCurrentStroke([]);
        } else {
            // Fallback to manual evaluation
            setDetectedLetter(targetLetter); // Simulate detection for manual
            setConfidence(50);
            setShowGradeButtons(true);
            onLetterDetected(targetLetter);
        }
    };

    const handleGrade = (grade: number) => {
        // Call evaluation result
        onEvaluationResult(grade);

        // Celebrate if good grade
        if (grade >= 3) {
            celebrateSuccess();
        }

        // Resetar estado
        setShowGradeButtons(false);
        setDetectedLetter('');
        setConfidence(0);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDetectedLetter('');
        setConfidence(0);
        setShowGradeButtons(false);
        setStrokes([]);
        setCurrentStroke([]);
        setIsAutomatic(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card sx={{ p: 3, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)' }}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
                            Desenhe a letra
                        </Typography>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Typography
                                variant="h2"
                                sx={{
                                    fontSize: '5rem',
                                    fontWeight: 900,
                                    background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                {targetLetter.toUpperCase()}
                            </Typography>
                        </motion.div>
                    </Box>

                    {/* Canvas */}
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: showGradeButtons ? '#fbbf24' : '#6366f1',
                            boxShadow: showGradeButtons
                                ? '0 0 40px rgba(251, 191, 36, 0.3)'
                                : '0 0 30px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={400}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{
                                cursor: 'crosshair',
                                display: 'block',
                                width: '100%',
                                height: 'auto',
                            }}
                        />
                    </Box>

                    {/* Info */}
                    <Stack spacing={2}>
                        {detectedLetter && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>
                                        Letra detectada: <strong>{detectedLetter.toUpperCase()}</strong>
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={confidence}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 4,
                                                background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                                            },
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                                        Confiança: {confidence.toFixed(1)}% {isAutomatic ? '(Automático)' : '(Manual)'}
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}

                        {/* Botões de Avaliação Temporários */}
                        {showGradeButtons && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                                        Como foi o desenho desta letra?
                                    </Typography>
                                    <ButtonGroup variant="contained" size="large" sx={{ mb: 2 }}>
                                        <Button
                                            onClick={() => handleGrade(1)}
                                            sx={{
                                                bgcolor: '#ef4444',
                                                '&:hover': { bgcolor: '#dc2626' },
                                                color: 'white',
                                            }}
                                        >
                                            ❌ Errado
                                        </Button>
                                        <Button
                                            onClick={() => handleGrade(2)}
                                            sx={{
                                                bgcolor: '#f59e0b',
                                                '&:hover': { bgcolor: '#d97706' },
                                                color: 'white',
                                            }}
                                        >
                                            😟 Difícil
                                        </Button>
                                        <Button
                                            onClick={() => handleGrade(3)}
                                            sx={{
                                                bgcolor: '#10b981',
                                                '&:hover': { bgcolor: '#059669' },
                                                color: 'white',
                                            }}
                                        >
                                            👍 Bom
                                        </Button>
                                        <Button
                                            onClick={() => handleGrade(4)}
                                            sx={{
                                                bgcolor: '#6366f1',
                                                '&:hover': { bgcolor: '#4f46e5' },
                                                color: 'white',
                                            }}
                                        >
                                            ✅ Fácil
                                        </Button>
                                    </ButtonGroup>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        Estes botões são temporários. Em breve, a IA avaliará automaticamente!
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}

                        {/* Botão de Validação */}
                        {!showGradeButtons && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleValidateDrawing}
                                    disabled={!detectedLetter}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    🪄 Mágica - Avaliar Desenho
                                </Button>
                            </Box>
                        )}
                    </Stack>

                    {/* Controls */}
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Limpar desenho">
                            <IconButton
                                onClick={handleClear}
                                sx={{
                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' },
                                }}
                            >
                                ✨
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Ouvir pronúncia">
                            <IconButton
                                sx={{
                                    bgcolor: 'rgba(236, 72, 153, 0.1)',
                                    color: '#ec4899',
                                    '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.2)' },
                                }}
                            >
                                🔊
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Card>
        </motion.div>
    );
};