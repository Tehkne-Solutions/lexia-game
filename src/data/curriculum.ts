export interface CurriculumItem {
    letter: string;
    anchorWord: string;
    level: number;
    imageUrl: string;
    emoji: string;
}

export const CURRICULUM: CurriculumItem[] = [
    // Nível 1: Vogais e Retas (Baixa carga cognitiva e motora)
    { letter: 'I', anchorWord: 'Igreja', level: 1, imageUrl: '/icons/igreja.svg', emoji: '⛪' },
    { letter: 'U', anchorWord: 'Uva', level: 1, imageUrl: '/icons/uva.svg', emoji: '🍇' },
    { letter: 'E', anchorWord: 'Escada', level: 1, imageUrl: '/icons/escada.svg', emoji: '🪜' },
    { letter: 'A', anchorWord: 'Abelha', level: 1, imageUrl: '/icons/abelha.svg', emoji: '🐝' },
    { letter: 'O', anchorWord: 'Ovo', level: 1, imageUrl: '/icons/ovo.svg', emoji: '🥚' },
    { letter: 'L', anchorWord: 'Leão', level: 1, imageUrl: '/icons/leao.svg', emoji: '🦁' },
    { letter: 'T', anchorWord: 'Tatu', level: 1, imageUrl: '/icons/tatu.svg', emoji: '🐢' },

    // Nível 2: Curvas Simples e Fechadas
    { letter: 'C', anchorWord: 'Casa', level: 2, imageUrl: '/icons/casa.svg', emoji: '🏠' },
    { letter: 'P', anchorWord: 'Pato', level: 2, imageUrl: '/icons/pato.svg', emoji: '🦆' },
    { letter: 'B', anchorWord: 'Bola', level: 2, imageUrl: '/icons/bola.svg', emoji: '⚽' },
    { letter: 'D', anchorWord: 'Dado', level: 2, imageUrl: '/icons/dado.svg', emoji: '🎲' },

    // Nível 3: Complexidade Motora e Fonemas Variáveis
    { letter: 'S', anchorWord: 'Sapo', level: 3, imageUrl: '/icons/sapo.svg', emoji: '🐸' },
    { letter: 'R', anchorWord: 'Rato', level: 3, imageUrl: '/icons/rato.svg', emoji: '🐭' },
    { letter: 'M', anchorWord: 'Macaco', level: 3, imageUrl: '/icons/macaco.svg', emoji: '🐒' },
    { letter: 'N', anchorWord: 'Navio', level: 3, imageUrl: '/icons/navio.svg', emoji: '🚢' },

    // Nível 4: Desafios Finais e Letras Importadas
    { letter: 'X', anchorWord: 'Xícara', level: 4, imageUrl: '/icons/xicara.svg', emoji: '☕' },
    { letter: 'Z', anchorWord: 'Zebra', level: 4, imageUrl: '/icons/zebra.svg', emoji: '🦓' },
    { letter: 'K', anchorWord: 'Kiwi', level: 4, imageUrl: '/icons/kiwi.svg', emoji: '🥝' },
    { letter: 'W', anchorWord: 'Wafer', level: 4, imageUrl: '/icons/wafer.svg', emoji: '🍪' },
    { letter: 'Y', anchorWord: 'Yoga', level: 4, imageUrl: '/icons/yoga.svg', emoji: '🧘' },
];