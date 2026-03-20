import React from 'react';
import { Box, Card, Typography, Stack, Tooltip, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { tribesColors } from '../theme';

interface BadgesProps {
    unlockedBadges: number;
    currentTribe: number;
}

export const BadgesDisplay: React.FC<BadgesProps> = ({ unlockedBadges, currentTribe }) => {
    return (
        <Card sx={{ p: 2, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9', fontWeight: 700 }}>
                🏅 Tribos Desbloqueadas
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tribesColors.map((tribe, index) => {
                    const isUnlocked = index < unlockedBadges;
                    const isCurrent = index === currentTribe;

                    return (
                        <motion.div
                            key={tribe.name}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={isUnlocked ? { scale: 1.1 } : {}}
                        >
                            <Tooltip title={tribe.name}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        cursor: isUnlocked ? 'pointer' : 'default',
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: tribe.color,
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '1.5rem',
                                            border: isCurrent ? '3px solid #ffffff' : 'none',
                                            opacity: isUnlocked ? 1 : 0.3,
                                            boxShadow: isCurrent
                                                ? `0 0 20px ${tribe.color}`
                                                : `0 4px 6px rgba(0, 0, 0, 0.3)`,
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {tribe.symbol}
                                    </Avatar>
                                    {!isUnlocked && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                            }}
                                        >
                                            🔒
                                        </Box>
                                    )}
                                </Box>
                            </Tooltip>
                        </motion.div>
                    );
                })}
            </Stack>

            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block' }}>
                {unlockedBadges} de {tribesColors.length} tribos desbloqueadas
            </Typography>
        </Card>
    );
};
