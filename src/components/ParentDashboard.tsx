import { Box, LinearProgress, Typography } from '@mui/material';
import { CURRICULUM } from '../data/curriculum';

export const ParentDashboard = ({ cardsState }: { cardsState: any }) => {
    const calculateProgress = () => {
        const totalLetters = CURRICULUM.length;
        // Consideramos uma letra "aprendida" se a estabilidade for > 0.7
        const learnedLetters = CURRICULUM.filter(l => (cardsState[l.letter]?.stability || 0) > 0.7).length;
        return Math.round((learnedLetters / totalLetters) * 100);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f1f5f9', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#334155', mb: 2 }}>
                📊 Relatório do Pequeno Explorador
            </Typography>
            <LinearProgress
                variant="determinate"
                value={calculateProgress()}
                sx={{
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 12,
                        backgroundColor: '#22c55e'
                    }
                }}
            />
            <Typography variant="body2" sx={{ mt: 1, color: '#64748b', fontWeight: 500 }}>
                {calculateProgress()}% da jornada concluída!
            </Typography>
        </Box>
    );
};