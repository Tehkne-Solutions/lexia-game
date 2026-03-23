import React from 'react';
import { Typography, Card } from '@mui/material';
import { motion } from 'framer-motion';
import { CurriculumItem } from '../data/curriculum';

interface AnchorDisplayProps {
    item: CurriculumItem;
}

export const AnchorDisplay: React.FC<AnchorDisplayProps> = ({ item }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
            >
                <Typography variant="h1" sx={{ fontSize: '4rem', mb: 1 }}>
                    {item.emoji}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    }}
                >
                    {item.letter} de {item.anchorWord}
                </Typography>
            </Card>
        </motion.div>
    );
};