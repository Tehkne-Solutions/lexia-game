export interface CurriculumItem {
    letter: string;
    anchorWord: string;
    emoji: string;
    level: number;
}

export const CURRICULUM: CurriculumItem[] = [
    // Nível 1: Vogais e Retas (Sucesso imediato)
    { letter: 'I', anchorWord: 'Igreja', emoji: '⛪', level: 1 },
    { letter: 'U', anchorWord: 'Uva', emoji: '🍇', level: 1 },
    { letter: 'E', anchorWord: 'Escada', emoji: '🪜', level: 1 },
    { letter: 'A', anchorWord: 'Abelha', emoji: '🐝', level: 1 },
    { letter: 'O', anchorWord: 'Ovo', emoji: '🥚', level: 1 },

    // Nível 2: Curvas Simples (Desafio motor leve)
    { letter: 'C', anchorWord: 'Casa', emoji: '🏠', level: 2 },
    { letter: 'P', anchorWord: 'Pato', emoji: '🦆', level: 2 },
    { letter: 'B', anchorWord: 'Bola', emoji: '⚽', level: 2 },
    { letter: 'D', anchorWord: 'Dado', emoji: '🎲', level: 2 },

    // Nível 3: Formas Complexas e Frequência Média
    { letter: 'L', anchorWord: 'Leão', emoji: '🦁', level: 3 },
    { letter: 'T', anchorWord: 'Tatu', emoji: '🐢', level: 3 },
    { letter: 'S', anchorWord: 'Sapo', emoji: '🐸', level: 3 },
    { letter: 'R', anchorWord: 'Rato', emoji: '🐭', level: 3 },

    // Nível 4: Letras de Fechamento
    { letter: 'M', anchorWord: 'Macaco', emoji: '🐒', level: 4 },
    { letter: 'N', anchorWord: 'Navio', emoji: '🚢', level: 4 },
    { letter: 'X', anchorWord: 'Xícara', emoji: '☕', level: 4 },
    { letter: 'Z', anchorWord: 'Zebra', emoji: '🦓', level: 4 }
];