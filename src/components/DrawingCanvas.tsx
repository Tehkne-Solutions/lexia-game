import React, { useRef, useEffect, useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    Stack,
    LinearProgress,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    RestartAlt,
    VolumeUp,
    Check,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface DrawingCanvasProps {
    targetLetter: string;
    onLetterDetected: (letter: string) => void;
    onSuccess: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    targetLetter,
    onLetterDetected,
    onSuccess,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [detectedLetter, setDetectedLetter] = useState('');

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
    }, []);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        // Simular detecção de letra (você vai integrar com o FSRS depois)
        const detectedChar = targetLetter;
        setDetectedLetter(detectedChar);
        setConfidence(Math.random() * 100);
        onLetterDetected(detectedChar);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDetectedLetter('');
        setConfidence(0);
    };

    const isCorrect = detectedLetter.toUpperCase() === targetLetter.toUpperCase();

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
                            borderColor: isCorrect ? '#10b981' : '#6366f1',
                            boxShadow: isCorrect ? '0 0 40px rgba(16, 185, 129, 0.3)' : '0 0 30px rgba(99, 102, 241, 0.3)',
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
                                                background: isCorrect
                                                    ? 'linear-gradient(90deg, #10b981 0%, #6ee7b7 100%)'
                                                    : 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                                            },
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                                        Confiança: {confidence.toFixed(1)}%
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}

                        {/* Badges/Status */}
                        {isCorrect && (
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 100 }}
                            >
                                <Chip
                                    icon={<Check />}
                                    label="Parabéns! Letra correta!"
                                    color="success"
                                    variant="filled"
                                    sx={{ width: '100%', py: 3, fontSize: '1rem', fontWeight: 600 }}
                                    onClick={onSuccess}
                                />
                            </motion.div>
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
                                <RestartAlt />
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
                                <VolumeUp />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Card>
        </motion.div>
    );
};
