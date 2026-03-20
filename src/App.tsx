import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingCanvas, BadgesDisplay, LevelSystem } from './components';
import { theme, tribesColors, cabbalisticLevels } from './theme';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MenuBookIcon from '@mui/icons-material/MenuBook';

interface GameState {
    currentLevel: number;
    currentTribe: number;
    totalXP: number;
    nextLevelXP: number;
    currentLetter: string;
    letterIndex: number;
    correctAttempts: number;
    unlockedBadges: number;
    showLevelUpDialog: boolean;
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function App() {
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: 0,
        currentTribe: 0,
        totalXP: 0,
        nextLevelXP: 100,
        currentLetter: 'A',
        letterIndex: 0,
        correctAttempts: 0,
        unlockedBadges: 1,
        showLevelUpDialog: false,
    });

    const [showTutorial, setShowTutorial] = useState(true);

    // Selecionar letra aleatória
    const selectRandomLetter = () => {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        setGameState((prev) => ({
            ...prev,
            currentLetter: alphabet[randomIndex],
            letterIndex: randomIndex,
        }));
    };

    // Quando a letra é detectada corretamente
    const handleLetterSuccess = () => {
        setGameState((prev) => {
            const newXP = prev.totalXP + 50;
            const leveledUp = newXP >= prev.nextLevelXP;
            const newLevel = leveledUp ? prev.currentLevel + 1 : prev.currentLevel;
            const newTribe = Math.min(newLevel, 11);
            const newUnlockedBadges = Math.min(prev.unlockedBadges + (leveledUp ? 1 : 0), 12);

            return {
                ...prev,
                totalXP: leveledUp ? newXP - prev.nextLevelXP : newXP,
                nextLevelXP: prev.nextLevelXP + 100,
                currentLevel: newLevel,
                currentTribe: newTribe,
                correctAttempts: prev.correctAttempts + 1,
                unlockedBadges: newUnlockedBadges,
                showLevelUpDialog: leveledUp,
            };
        });

        // Selecionar próxima letra após 1 segundo
        setTimeout(selectRandomLetter, 1000);
    };

    const handleRestart = () => {
        setGameState({
            currentLevel: 0,
            currentTribe: 0,
            totalXP: 0,
            nextLevelXP: 100,
            currentLetter: 'A',
            letterIndex: 0,
            correctAttempts: 0,
            unlockedBadges: 1,
            showLevelUpDialog: false,
        });
        selectRandomLetter();
    };

    useEffect(() => {
        selectRandomLetter();
    }, []);

    const progressToNextLevel = (gameState.totalXP / gameState.nextLevelXP) * 100;
    const currentLevelData = cabbalisticLevels[gameState.currentLevel];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Animated Background Elements */}
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                >
                    <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            width: '500px',
                            height: '500px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                            top: '-200px',
                            left: '10%',
                        }}
                    />
                    <motion.div
                        animate={{ opacity: [0.2, 0.1, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                        style={{
                            position: 'absolute',
                            width: '400px',
                            height: '400px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
                            bottom: '-150px',
                            right: '5%',
                        }}
                    />
                </Box>

                {/* Main Content */}
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                    <AnimatePresence>
                        {showTutorial && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <Box
                                    sx={{
                                        mb: 4,
                                        p: 3,
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                                        border: '2px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: 3,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Stack spacing={1} flex={1}>
                                        <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                                            ✨ Bem-vindo ao Lexia Game!
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                                            Desenhe as letras no canvas e aprenda com a jornada cabalística. Desbloqueie as 12 tribos de Israel
                                            conforme você progride nos níveis!
                                        </Typography>
                                    </Stack>
                                    <Button
                                        variant="contained"
                                        onClick={() => setShowTutorial(false)}
                                        sx={{ ml: 2, whiteSpace: 'nowrap' }}
                                    >
                                        Entendi!
                                    </Button>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity }}>
                                <Typography sx={{ fontSize: '4rem', mb: 1 }}>🎮</Typography>
                            </motion.div>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 900,
                                    mb: 1,
                                    background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 70%, #fbbf24 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Lexia Game
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#cbd5e1' }}>
                                A Jornada Cabalística do Aprendizado
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ mb: 4 }}
                        >
                            <Chip
                                icon={<EmojiEventsIcon />}
                                label={`Tentativas Corretas: ${gameState.correctAttempts}`}
                                color="success"
                                sx={{ py: 3, fontSize: '1rem', fontWeight: 600 }}
                            />
                            <Chip
                                icon={<MenuBookIcon />}
                                label={`Tribos: ${gameState.unlockedBadges}/${tribesColors.length}`}
                                color="info"
                                sx={{ py: 3, fontSize: '1rem', fontWeight: 600 }}
                            />
                            <Box sx={{ flex: 1 }} />
                            <Button
                                variant="outlined"
                                startIcon={<RestartAltIcon />}
                                onClick={handleRestart}
                                sx={{ height: '100%' }}
                            >
                                Reiniciar
                            </Button>
                        </Stack>
                    </motion.div>

                    {/* Main Grid */}
                    <Grid container spacing={3}>
                        {/* Left Column */}
                        <Grid item xs={12} md={8}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <DrawingCanvas
                                    targetLetter={gameState.currentLetter}
                                    onLetterDetected={() => { }}
                                    onSuccess={handleLetterSuccess}
                                />
                            </motion.div>
                        </Grid>

                        {/* Right Column */}
                        <Grid item xs={12} md={4}>
                            <Stack spacing={3}>
                                {/* Level System */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <LevelSystem
                                        currentLevel={gameState.currentLevel}
                                        progress={progressToNextLevel}
                                        totalXP={gameState.totalXP}
                                        nextLevelXP={gameState.nextLevelXP}
                                    />
                                </motion.div>

                                {/* Badges */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <BadgesDisplay
                                        unlockedBadges={gameState.unlockedBadges}
                                        currentTribe={gameState.currentTribe}
                                    />
                                </motion.div>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>

                {/* Level Up Dialog */}
                <Dialog
                    open={gameState.showLevelUpDialog}
                    onClose={() => setGameState((prev) => ({ ...prev, showLevelUpDialog: false }))}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                            border: '2px solid #fbbf24',
                            borderRadius: 3,
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            textAlign: 'center',
                            fontSize: '2rem',
                            fontWeight: 900,
                            background: `linear-gradient(45deg, ${currentLevelData?.color} 30%, #fbbf24 90%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        🎉 PARABÉNS!
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center', py: 3 }}>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            style={{ fontSize: '4rem', marginBottom: '1rem' }}
                        >
                            {currentLevelData?.symbol}
                        </motion.div>
                        <Typography variant="h5" sx={{ color: '#f1f5f9', mb: 1, fontWeight: 700 }}>
                            Você subiu de nível!
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 2 }}>
                            Você atingiu <strong>{currentLevelData?.name}</strong>
                            {' '}({currentLevelData?.title})
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Nível: <strong>{gameState.currentLevel + 1}</strong> - Tribo desbloqueada:
                            {' '}
                            <strong>{tribesColors[gameState.currentTribe].name}</strong>{' '}
                            {tribesColors[gameState.currentTribe].symbol}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => setGameState((prev) => ({ ...prev, showLevelUpDialog: false }))}
                            sx={{ px: 4 }}
                        >
                            Continuar
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}

export default App;