import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useAlphabet } from './hooks';
import { useVoice } from './hooks/useVoice';
import { Grade } from './lib/fsrs';
import { AnchorDisplay } from './components/AnchorDisplay';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ParentDashboard } from './components/ParentDashboard';
import { LexiMascot } from './components/LexiMascot';
import { AdventureMap } from './components/AdventureMap';
import { theme } from './theme';
import './App.css';

function App() {
    const { getNextLetter, saveAttempt, currentLevel, isLoading, lettersProgress } = useAlphabet();
    const { speak } = useVoice();
    const currentLetterItem = getNextLetter();
    const [mascotState, setMascotState] = React.useState<'idle' | 'success' | 'thinking'>('idle');
    const [isProcessing, setIsProcessing] = React.useState(false);

    const cardsState = lettersProgress.reduce((acc, p) => ({ ...acc, [p.letter]: p.card }), {});

    const handleValidate = async (drawnPoints: number[][][]) => {
        setIsProcessing(true); // Ativa o loading do botão

        try {
            // 1. Prepara a requisição para a Google HWR API
            const response = await fetch(
                `https://www.google.com.tw/inputtools/request?ime=handwriting&app=autodraw&dbg=1&cs=1&oe=UTF-8`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input_type: 0,
                        requests: [{
                            writing_guide: { width: 400, height: 400 },
                            ink: drawnPoints, // Os pontos que o novo Canvas captura
                            language: 'pt'
                        }]
                    })
                }
            );

            const data = await response.json();
            const candidates = data[1][0][1]; // Lista de letras reconhecidas pela IA

            // 2. Verifica se a letra alvo está entre as 3 primeiras sugestões
            const isCorrect = candidates.slice(0, 3).some(
                (c: string) => c.toLowerCase() === currentLetterItem?.letter.toLowerCase()
            );

            if (isCorrect) {
                // ✅ ACERTOU: Dispara Confete e FSRS
                handleEvaluationResult(3); // Grade 'Easy' no FSRS
            } else {
                // ❌ ERROU: Feedback suave
                alert(`Quase! A IA viu: ${candidates[0]}. Tenta de novo!`);
                handleEvaluationResult(1); // Grade 'Again' no FSRS
            }
        } catch (error) {
            console.error("Erro na validação:", error);
            alert("Ops! Erro na validação. Tenta desenhar de novo!");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEvaluationResult = (grade: number) => {
        const isCorrect = grade >= 3;
        if (isCorrect) {
            setMascotState('success');
            // Feedback de Sucesso + Âncora Semântica
            speak(`Incrível! Você desenhou a letra ${currentLetterItem?.letter}, de ${currentLetterItem?.anchorWord}!`);

            // Confetes e próxima letra (Grade 3 ou 4 no FSRS)
            saveAttempt(currentLetterItem!.letter, grade as Grade);
        } else {
            setMascotState('thinking');
            // Feedback de Incentivo (Sem punição - Malkuth)
            speak(`Quase lá! Vamos tentar a letra ${currentLetterItem?.letter} de novo?`);

            // Repetição imediata (Grade 1 no FSRS)
            saveAttempt(currentLetterItem!.letter, grade as Grade);
        }

        // Reset to idle after 3 seconds
        setTimeout(() => setMascotState('idle'), 3000);
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
            <Container maxWidth="sm" sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                    </Box>

                    {/* Mapa de Aventura (Com scroll horizontal se necessário) */}
                    <Box sx={{ width: '100%', overflowX: 'auto', borderRadius: 4 }}>
                        <AdventureMap
                            currentLevel={currentLevel}
                            unlockedLevels={[1, 2, 3, 4]} // TODO: Calculate based on FSRS stability
                            onLevelSelect={(level) => console.log('Selecionar nível:', level)}
                        />
                    </Box>

                    {/* Dashboard do Responsável */}
                    <Box sx={{ mb: 4 }}>
                        <ParentDashboard cardsState={cardsState} />
                    </Box>

                    {/* Área de Jogo */}
                    <Paper elevation={3} sx={{ p: 2, borderRadius: 8, textAlign: 'center' }}>
                        <AnchorDisplay item={currentLetterItem} />
                        <LexiMascot state={mascotState} />
                        <DrawingCanvas
                            targetLetter={currentLetterItem.letter}
                            onValidate={handleValidate}
                            isProcessing={isProcessing}
                        />
                    </Paper>
                </motion.div>
            </Container>
        </ThemeProvider>
    );
}

export default App;
