import { useState, useEffect, useCallback } from 'react';
import { Card, createEmptyCard, getNextReview, needsReview, Grade } from '../lib/fsrs';

// Interface para o progresso de uma letra
interface LetterProgress {
    letter: string;
    card: Card;
    lastGrade?: Grade;
    totalAttempts: number;
    correctAttempts: number;
    streak: number;
}

// Chave do LocalStorage
const STORAGE_KEY = 'lexia-game-progress';

// Todas as letras do alfabeto
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Hook customizado para gerenciar o progresso das letras usando FSRS
 */
export function useAlphabet() {
    const [lettersProgress, setLettersProgress] = useState<LetterProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Carrega o progresso do LocalStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Converte as datas de string para Date
                const progress: LetterProgress[] = parsed.map((item: any) => ({
                    ...item,
                    card: {
                        ...item.card,
                        due: new Date(item.card.due),
                        last_review: new Date(item.card.last_review),
                    },
                }));
                setLettersProgress(progress);
            } else {
                // Inicializa com cards vazios para todas as letras
                const initialProgress: LetterProgress[] = ALPHABET.map(letter => ({
                    letter,
                    card: createEmptyCard(),
                    totalAttempts: 0,
                    correctAttempts: 0,
                    streak: 0,
                }));
                setLettersProgress(initialProgress);
                saveToStorage(initialProgress);
            }
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
            // Fallback para estado inicial
            const initialProgress: LetterProgress[] = ALPHABET.map(letter => ({
                letter,
                card: createEmptyCard(),
                totalAttempts: 0,
                correctAttempts: 0,
                streak: 0,
            }));
            setLettersProgress(initialProgress);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Salva no LocalStorage
    const saveToStorage = useCallback((progress: LetterProgress[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.error('Erro ao salvar progresso:', error);
        }
    }, []);

    // Salva uma tentativa para uma letra específica
    const saveAttempt = useCallback((letter: string, grade: Grade) => {
        setLettersProgress(prevProgress => {
            const newProgress = prevProgress.map(progress => {
                if (progress.letter === letter) {
                    // Calcula o novo card usando FSRS
                    const newCard = getNextReview(progress.card, grade);

                    // Atualiza estatísticas
                    const isCorrect = grade >= 3; // Good ou Easy são considerados corretos
                    const newStreak = isCorrect ? progress.streak + 1 : 0;

                    return {
                        ...progress,
                        card: newCard,
                        lastGrade: grade,
                        totalAttempts: progress.totalAttempts + 1,
                        correctAttempts: progress.correctAttempts + (isCorrect ? 1 : 0),
                        streak: newStreak,
                    };
                }
                return progress;
            });

            // Salva no LocalStorage
            saveToStorage(newProgress);

            return newProgress;
        });
    }, [saveToStorage]);

    // Obtém o progresso de uma letra específica
    const getLetterProgress = useCallback((letter: string): LetterProgress | undefined => {
        return lettersProgress.find(progress => progress.letter === letter);
    }, [lettersProgress]);

    // Obtém letras que precisam ser revisadas hoje
    const getLettersToReview = useCallback((): LetterProgress[] => {
        return lettersProgress.filter(progress => needsReview(progress.card));
    }, [lettersProgress]);

    // Obtém letras que não precisam ser revisadas hoje
    const getLettersNotToReview = useCallback((): LetterProgress[] => {
        return lettersProgress.filter(progress => !needsReview(progress.card));
    }, [lettersProgress]);

    // Obtém estatísticas gerais
    const getStats = useCallback(() => {
        const totalAttempts = lettersProgress.reduce((sum, p) => sum + p.totalAttempts, 0);
        const totalCorrect = lettersProgress.reduce((sum, p) => sum + p.correctAttempts, 0);
        const toReview = getLettersToReview().length;
        const mastered = lettersProgress.filter(p => p.streak >= 3).length;

        return {
            totalAttempts,
            totalCorrect,
            accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
            toReview,
            mastered,
            totalLetters: ALPHABET.length,
        };
    }, [lettersProgress, getLettersToReview]);

    // Reseta o progresso de uma letra específica
    const resetLetter = useCallback((letter: string) => {
        setLettersProgress(prevProgress => {
            const newProgress = prevProgress.map(progress => {
                if (progress.letter === letter) {
                    return {
                        ...progress,
                        card: createEmptyCard(),
                        totalAttempts: 0,
                        correctAttempts: 0,
                        streak: 0,
                        lastGrade: undefined,
                    };
                }
                return progress;
            });

            saveToStorage(newProgress);
            return newProgress;
        });
    }, [saveToStorage]);

    // Reseta todo o progresso
    const resetAll = useCallback(() => {
        const initialProgress: LetterProgress[] = ALPHABET.map(letter => ({
            letter,
            card: createEmptyCard(),
            totalAttempts: 0,
            correctAttempts: 0,
            streak: 0,
        }));

        setLettersProgress(initialProgress);
        saveToStorage(initialProgress);
    }, [saveToStorage]);

    return {
        lettersProgress,
        isLoading,
        saveAttempt,
        getLetterProgress,
        getLettersToReview,
        getLettersNotToReview,
        getStats,
        resetLetter,
        resetAll,
    };
}