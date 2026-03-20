import { createTheme } from '@mui/material/styles';

// Cores sugeridas para aprendizado - combinações vibrantes e educativas
export const theme = createTheme({
    palette: {
        primary: {
            main: '#6366f1', // Indigo vibrante - Concentração
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899', // Rosa - Criatividade
            light: '#f472b6',
            dark: '#be185d',
        },
        success: {
            main: '#10b981', // Verde - Sabedoria
            light: '#6ee7b7',
            dark: '#065f46',
        },
        warning: {
            main: '#f59e0b', // Dourado - Energia
            light: '#fbbf24',
            dark: '#92400e',
        },
        error: {
            main: '#ef4444', // Vermelho - Poder
            light: '#f87171',
            dark: '#7f1d1d',
        },
        info: {
            main: '#06b6d4', // Cyan - Fluidez
            light: '#22d3ee',
            dark: '#164e63',
        },
        background: {
            default: '#0f172a', // Azul muito escuro
            paper: '#1e293b', // Cinza azulado escuro
        },
        text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
        },
    },
    typography: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '3.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2.5rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '2rem',
            fontWeight: 700,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
        },
        button: {
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                    },
                },
                contained: {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: 20,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});

// Cores das 12 Tribos de Israel - Sistema de Badges
export const tribesColors = [
    { name: 'Judá', color: '#fbbf24', symbol: '♌' }, // Ouro - Leão
    { name: 'Rúben', color: '#ef4444', symbol: '♒' }, // Vermelho - Aquário
    { name: 'Gade', color: '#8b5cf6', symbol: '♂' }, // Púrpura - Marte
    { name: 'Efraim', color: '#06b6d4', symbol: '♈' }, // Cyan - Carneiro
    { name: 'Manassés', color: '#10b981', symbol: '♉' }, // Verde - Touro
    { name: 'Benjamim', color: '#3b82f6', symbol: '♊' }, // Azul - Gêmeos
    { name: 'Levi', color: '#f59e0b', symbol: '♋' }, // Laranja - Câncer
    { name: 'Issacar', color: '#6366f1', symbol: '♍' }, // Indigo - Virgem
    { name: 'Zebulom', color: '#ec4899', symbol: '♎' }, // Rosa - Libra
    { name: 'Dã', color: '#14b8a6', symbol: '♏' }, // Turquesa - Escorpião
    { name: 'Naftali', color: '#f97316', symbol: '♐' }, // Laranja queimado - Sagitário
    { name: 'Asher', color: '#a78bfa', symbol: '♑' }, // Lavanda - Capricórnio
];

// Níveis Cabalísticos (Sefiroth)
export const cabbalisticLevels = [
    { level: 0, name: 'Malkuth', title: 'O Reino', color: '#1e293b', symbol: '🌍' },
    { level: 1, name: 'Yesod', title: 'A Fundação', color: '#6366f1', symbol: '🌙' },
    { level: 2, name: 'Hod', title: 'A Glória', color: '#06b6d4', symbol: '💫' },
    { level: 3, name: 'Netzach', title: 'A Vitória', color: '#ec4899', symbol: '✨' },
    { level: 4, name: 'Tiphereth', title: 'A Beleza', color: '#fbbf24', symbol: '☀️' },
    { level: 5, name: 'Gevurah', title: 'A Severidade', color: '#ef4444', symbol: '⚡' },
    { level: 6, name: 'Chesed', title: 'A Misericórdia', color: '#10b981', symbol: '💚' },
    { level: 7, name: 'Binah', title: 'O Entendimento', color: '#8b5cf6', symbol: '👑' },
    { level: 8, name: 'Chokmah', title: 'A Sabedoria', color: '#3b82f6', symbol: '🔮' },
    { level: 9, name: 'Keter', title: 'A Coroa', color: '#f1f5f9', symbol: '✨' },
];
