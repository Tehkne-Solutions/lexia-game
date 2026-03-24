import { Container, Box, Typography, Paper, Button, Fade, ThemeProvider, CircularProgress } from '@mui/material';
import { SpeakerHigh, ArrowRight, Lightbulb } from '@phosphor-icons/react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { useAlphabet } from './hooks/useAlphabet';
import { Grade } from './lib/fsrs';
import { speak } from './lib/speech';
import { theme } from './theme';

export const App = () => {
    const { getNextLetter, saveAttempt, isLoading } = useAlphabet();

    const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const currentLetterItem = getNextLetter();

    // EFEITO 1: Narra a instrução ao carregar uma nova letra
    useEffect(() => {
        if (currentLetterItem && feedback.status === 'idle') {
            speak(`Desenhe a letra ${currentLetterItem.letter}, de ${currentLetterItem.anchorWord}`);
        }
    }, [currentLetterItem, feedback.status]);

    const handleValidate = async (ink: number[][][]) => {
        if (!currentLetterItem) return;
        setIsProcessing(true);
        setFeedback({ status: 'idle', message: '' });

        try {
            const response = await fetch(
                `https://www.google.com.tw/inputtools/request?ime=handwriting&app=autodraw&dbg=1&cs=1&oe=UTF-8`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input_type: 0,
                        requests: [{
                            writing_guide: { width: 400, height: 400 },
                            ink: ink,
                            language: 'pt'
                        }]
                    })
                }
            );
            const data = await response.json();
            const candidates = data[1][0][1];
            const isCorrect = candidates.slice(0, 3).some(
                (c: string) => c.toLowerCase() === currentLetterItem.letter.toLowerCase()
            );

            if (isCorrect) {
                setFeedback({ status: 'success', message: 'Incrível! Você acertou!' });
                speak('Incrível! Você acertou!');
                // O progresso será salvo quando o usuário clicar em "Próxima Letra"
            } else {
                setFeedback({ status: 'error', message: `Quase! Tente o '${currentLetterItem.letter}' de novo.` });
                speak(`Quase lá! Vamos tentar desenhar o ${currentLetterItem.letter} novamente.`);
                saveAttempt(currentLetterItem.letter, 1 as Grade); // Salva o erro imediatamente
            }
        } catch (error) {
            console.error("Erro na validação:", error);
            setFeedback({ status: 'error', message: 'Ops! Algo deu errado. Tente de novo.' });
            speak("Ops, algo deu errado. Por favor, tente desenhar novamente.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextLetter = () => {
        if (!currentLetterItem) return;
        // Salva a nota de sucesso (3 = Easy) para a letra que acabamos de completar
        saveAttempt(currentLetterItem.letter, 3 as Grade);
        // Reseta o feedback. Isso fará o useEffect carregar e anunciar a nova letra.
        setFeedback({ status: 'idle', message: '' });
    };

    if (isLoading) {
        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>Carregando o jogo...</Typography>
                </Container>
            </ThemeProvider>
        );
    }

    if (!currentLetterItem && !isLoading) {
        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="sm" sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h4">Parabéns!</Typography>
                    <Typography variant="h6">Você completou todas as atividades!</Typography>
                </Container>
            </ThemeProvider>
        );
    }

    if (!currentLetterItem) {
        // Caso intermediário enquanto a próxima letra é carregada após um acerto
        return null;
    }


    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="sm" sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minHeight: '100vh', background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)' }}>

                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#4facfe', fontFamily: 'Fredoka, sans-serif' }}>
                        Lexia Game
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Aprenda o Alfabeto com Magia! ✨
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'white', p: 2, borderRadius: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Lightbulb size={40} color="#f59e0b" />
                    <Typography variant="h6">
                        Desenhe a letra <b>{currentLetterItem.letter}</b> de <b>{currentLetterItem.anchorWord}</b>!
                    </Typography>
                    <SpeakerHigh size={32} color="#4facfe" cursor="pointer" onClick={() => speak(`Desenhe a letra ${currentLetterItem.letter} de ${currentLetterItem.anchorWord}`)} />
                </Box>

                <Paper elevation={6} sx={{ p: 1, borderRadius: 4, border: '4px solid #4facfe', width: '100%', maxWidth: '420px', aspectRatio: '1 / 1' }}>
                    <DrawingCanvas
                        onValidate={handleValidate}
                        isProcessing={isProcessing}
                        key={currentLetterItem.letter} // Força o re-mount do canvas para limpar
                    />
                </Paper>

                <Fade in={feedback.status !== 'idle'}>
                    <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', width: '100%', maxWidth: 320, background: feedback.status === 'success' ? '#e6fffa' : '#fff5f5', border: `2px solid ${feedback.status === 'success' ? '#38b2ac' : '#e53e3e'}` }}>
                        <Typography variant="h5" sx={{ color: feedback.status === 'success' ? '#2c7a7b' : '#c53030', mb: 1 }}>
                            {feedback.message}
                        </Typography>
                        {feedback.status === 'success' && (
                            <Button variant="contained" endIcon={<ArrowRight />} onClick={handleNextLetter} sx={{ borderRadius: 4, background: '#38b2ac' }}>
                                Próxima Letra
                            </Button>
                        )}
                    </Paper>
                </Fade>

            </Container>
        </ThemeProvider>
    );
};

export default App;
