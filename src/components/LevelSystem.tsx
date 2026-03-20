import React from 'react';
import { Box, Card, Typography, Stack, LinearProgress, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { cabbalisticLevels } from '../theme';

interface LevelSystemProps {
    currentLevel: number;
    progress: number; // 0-100
    totalXP: number;
    nextLevelXP: number;
}

export const LevelSystem: React.FC<LevelSystemProps> = ({
    currentLevel,
    progress,
    totalXP,
    nextLevelXP,
}) => {
    const level = cabbalisticLevels[currentLevel] || cabbalisticLevels[0];

    return (
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)' }}>
            <Stack spacing={2}>
                {/* Título */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1, fontSize: '0.875rem' }}>
                        Nível Cabalístico
                    </Typography>
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Typography
                            sx={{
                                fontSize: '3rem',
                                lineHeight: 1,
                                mb: 1,
                            }}
                        >
                            {level.symbol}
                        </Typography>
                    </motion.div>
                    <Typography
                        variant="h4"
                        sx={{
                            background: `linear-gradient(45deg, ${level.color} 30%, #ec4899 90%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 700,
                            mb: 0.5,
                        }}
                    >
                        {level.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                        {level.title}
                    </Typography>
                </Box>

                {/* Progress Bar */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Experiência
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                            {totalXP} / {nextLevelXP} XP
                        </Typography>
                    </Box>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 12,
                                borderRadius: 100,
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 100,
                                    background: `linear-gradient(90deg, ${level.color} 0%, #fbbf24 100%)`,
                                    boxShadow: `0 0 15px ${level.color}`,
                                },
                            }}
                        />
                    </motion.div>
                </Box>

                {/* Level Info */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                        mt: 2,
                    }}
                >
                    <Tooltip title="Seu nível atual na jornada">
                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Nível
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#6366f1', fontWeight: 700 }}>
                                {currentLevel + 1}
                            </Typography>
                        </Box>
                    </Tooltip>
                    <Tooltip title="Próximo nível">
                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(236, 72, 153, 0.1)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Próximo
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#ec4899', fontWeight: 700 }}>
                                {currentLevel + 2}
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>
            </Stack>
        </Card>
    );
};
