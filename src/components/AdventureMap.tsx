import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';

interface AdventureMapProps {
    currentLevel: number;
    unlockedLevels: number[];
    onLevelSelect: (level: number) => void;
}

const levels = [
    { id: 1, name: 'Floresta das Vogais', emoji: '🌳' },
    { id: 2, name: 'Montanha das Consoantes', emoji: '⛰️' },
    { id: 3, name: 'Rio das Curvas', emoji: '🌊' },
    { id: 4, name: 'Castelo das Compostas', emoji: '🏰' },
];

export const AdventureMap: React.FC<AdventureMapProps> = ({
    currentLevel,
    unlockedLevels,
    onLevelSelect,
}) => {
    return (
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, minHeight: 300 }}>
            <Typography variant="h5" sx={{ color: 'white', textAlign: 'center', mb: 2 }}>
                🗺️ Mapa da Ilha das Letras
            </Typography>

            {/* SVG Path */}
            <Box sx={{ position: 'relative', height: 200 }}>
                <svg width="100%" height="200" viewBox="0 0 400 200">
                    <path
                        d="M50 150 Q100 50 150 100 Q200 150 250 100 Q300 50 350 150"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="10,5"
                    />
                    {levels.map((level, index) => {
                        const x = 50 + index * 100;
                        const y = index % 2 === 0 ? 150 : 100;
                        const isUnlocked = unlockedLevels.includes(level.id);
                        const isCurrent = currentLevel === level.id;

                        return (
                            <g key={level.id}>
                                <motion.circle
                                    cx={x}
                                    cy={y}
                                    r="20"
                                    fill={isCurrent ? '#ffd700' : isUnlocked ? '#4caf50' : '#f44336'}
                                    stroke="white"
                                    strokeWidth="3"
                                    whileHover={{ scale: isUnlocked ? 1.1 : 1 }}
                                    onClick={() => isUnlocked && onLevelSelect(level.id)}
                                    style={{ cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
                                />
                                {!isUnlocked && (
                                    <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="16">🔒</text>
                                )}
                                {isCurrent && (
                                    <text x={x} y={y + 5} textAnchor="middle" fill="black" fontSize="16">🐉</text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </Box>

            {/* Level Descriptions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                {levels.map(level => (
                    <Chip
                        key={level.id}
                        label={`${level.emoji} ${level.name}`}
                        variant={unlockedLevels.includes(level.id) ? 'filled' : 'outlined'}
                        color={currentLevel === level.id ? 'primary' : unlockedLevels.includes(level.id) ? 'success' : 'error'}
                        onClick={() => unlockedLevels.includes(level.id) && onLevelSelect(level.id)}
                        sx={{ cursor: unlockedLevels.includes(level.id) ? 'pointer' : 'not-allowed' }}
                    />
                ))}
            </Box>
        </Box>
    );
};