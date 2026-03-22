import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface LexiMascotProps {
    state: 'idle' | 'success' | 'thinking';
}

export const LexiMascot: React.FC<LexiMascotProps> = ({ state }) => {
    const getAnimation = () => {
        switch (state) {
            case 'idle':
                return {
                    y: [0, -10, 0],
                    transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    },
                };
            case 'success':
                return {
                    rotate: [0, 360],
                    y: [0, -20, 0],
                    transition: {
                        duration: 1,
                        ease: 'easeOut',
                    },
                };
            case 'thinking':
                return {
                    rotate: [-5, 5, -5],
                    transition: {
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    },
                };
            default:
                return {};
        }
    };

    return (
        <Box sx={{ textAlign: 'center', my: 2 }}>
            <motion.div animate={getAnimation()}>
                <Box
                    sx={{
                        fontSize: '4rem',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                    }}
                >
                    🐉
                </Box>
            </motion.div>
            <Box sx={{ mt: 1 }}>
                {state === 'idle' && <span>Lexi está esperando...</span>}
                {state === 'success' && <span>Parabéns! 🎉</span>}
                {state === 'thinking' && <span>Hmm, pensando...</span>}
            </Box>
        </Box>
    );
};