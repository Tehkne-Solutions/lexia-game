import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useAlphabet } from './hooks';
import { useVoice } from './hooks/useVoice';
import { AnchorDisplay } from './components/AnchorDisplay';
import { DrawingCanvas } from './components/DrawingCanvas';
import { theme } from './theme';

function App() {
    const { getNextLetter, saveAttempt, currentLevel, isLoading } = useAlphabet();
    const { speak } = useVoice();
    const currentLetterItem = getNextLetter();

    const handleEvaluationResult = (grade: number) => {
        const isCorrect = grade >= 3;
        if (isCorrect) {
            // Feedback de Sucesso + Âncora Semântica
            speak(`Incrível! Você desenhou a letra ${currentLetterItem?.letter}, de ${currentLetterItem?.anchorWord}!`);

            // Confetes e próxima letra (Grade 3 ou 4 no FSRS)
            saveAttempt(currentLetterItem!.letter, grade);
        } else {
            // Feedback de Incentivo (Sem punição - Malkuth)
            speak(`Quase lá! Vamos tentar a letra ${currentLetterItem?.letter} de novo?`);

            // Repetição imediata (Grade 1 no FSRS)
            saveAttempt(currentLetterItem!.letter, grade);
        }
    };

    useEffect(() => {
        if (currentLetterItem) {
            speak(`Agora, vamos desenhar a letra ${currentLetterItem.letter} de ${currentLetterItem.anchorWord}`);
        }
    }, [currentLetterItem, speak]);

    if (isLoading) {
        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Typography variant="h4" align="center">Carregando Lexia Game...</Typography>
                </Container>
            </ThemeProvider>
        );
    }

    if (!currentLetterItem) {
        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Typography variant="h4" align="center">Parabéns! Você completou todos os níveis!</Typography>
                </Container>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            🧙‍♂️ Lexia Game
                        </Typography>
                        <Typography variant="h5" color="text.secondary">
                            Alfabetização Gamificada com IA
                        </Typography>
                        <Paper sx={{ mt: 2, p: 2, display: 'inline-block' }}>
                            <Typography variant="h6">
                                Nível Atual: {currentLevel}
                            </Typography>
                        </Paper>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
                        {/* Âncora Visual */}
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <AnchorDisplay item={currentLetterItem} />
                        </Box>

                        {/* Canvas de Desenho */}
                        <Box sx={{ flex: 2 }}>
                            <DrawingCanvas
                                targetLetter={currentLetterItem.letter}
                                onLetterDetected={(letter) => console.log('Letra detectada:', letter)}
                                onEvaluationResult={handleEvaluationResult}
                            />
                        </Box>
                    </Box>
                </motion.div>
            </Container>
        </ThemeProvider>
    );
}

export default App;
