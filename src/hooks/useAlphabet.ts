import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, createEmptyCard, fsrs, needsReview, Grade } from '../lib/fsrs';
import { CURRICULUM, CurriculumItem } from '../data/curriculum';
import { supabase } from '../lib/supabase';

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
const LEVEL_KEY = 'lexia-game-level';

/**
 * Hook customizado para gerenciar o progresso das letras usando FSRS e currículo pedagógico
 */
export function useAlphabet() {
    const [lettersProgress, setLettersProgress] = useState<LetterProgress[]>([]);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Carrega o progresso do Supabase, senão do LocalStorage
    useEffect(() => {
        const loadProgress = async () => {
            try {
                // 1) Tenta carregar do Supabase
                const { data, error } = await supabase
                    .from('lexia_progress')
                    .select('*')
                    .order('letter', { ascending: true });

                if (error) {
                    console.warn('Não foi possível carregar progresso do Supabase:', error.message);
                }

                if (data && data.length > 0) {
                    const progress: LetterProgress[] = data.map((item: any) => ({
                        letter: item.letter,
                        card: {
                            ...item.card,
                            due: new Date(item.card.due),
                            last_review: item.card.last_review ? new Date(item.card.last_review) : undefined,
                        },
                        totalAttempts: item.total_attempts,
                        correctAttempts: item.correct_attempts,
                        streak: item.streak,
                        lastGrade: item.last_grade,
                    }));

                    setLettersProgress(progress);
                    setCurrentLevel(data[0]?.current_level || 1);
                    setIsLoading(false);
                    return;
                }

                // 2) Se não tem no Supabase, carrega do LocalStorage
                const storedProgress = localStorage.getItem(STORAGE_KEY);
                const storedLevel = localStorage.getItem(LEVEL_KEY);

                if (storedLevel) {
                    setCurrentLevel(parseInt(storedLevel, 10));
                }

                if (storedProgress) {
                    const parsed = JSON.parse(storedProgress);
                    const progress: LetterProgress[] = parsed.map((item: any) => ({
                        ...item,
                        card: {
                            ...item.card,
                            due: new Date(item.card.due),
                            last_review: item.card.last_review ? new Date(item.card.last_review) : undefined,
                        },
                    }));
                    setLettersProgress(progress);
                } else {
                    const initialProgress: LetterProgress[] = CURRICULUM.map(item => ({
                        letter: item.letter,
                        card: createEmptyCard(),
                        totalAttempts: 0,
                        correctAttempts: 0,
                        streak: 0,
                    }));
                    setLettersProgress(initialProgress);
                    saveToStorage(initialProgress);
                    // Envio inicial ao Supabase
                    await supabase.from('lexia_progress').upsert(initialProgress.map(p => ({
                        letter: p.letter,
                        card: p.card,
                        total_attempts: p.totalAttempts,
                        correct_attempts: p.correctAttempts,
                        streak: p.streak,
                        current_level: currentLevel,
                    })));
                }
            } catch (error) {
                console.error('Erro ao carregar progresso:', error);
                const initialProgress: LetterProgress[] = CURRICULUM.map(item => ({
                    letter: item.letter,
                    card: createEmptyCard(),
                    totalAttempts: 0,
                    correctAttempts: 0,
                    streak: 0,
                }));
                setLettersProgress(initialProgress);
            } finally {
                setIsLoading(false);
            }
        };

        loadProgress();
    }, []);

    // Salva no LocalStorage e no Supabase (se disponível)
    const saveToStorage = useCallback(async (progress: LetterProgress[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.error('Erro ao salvar progresso localmente:', error);
        }

        try {
            const upsertPayload = progress.map(p => ({
                letter: p.letter,
                card: p.card,
                total_attempts: p.totalAttempts,
                correct_attempts: p.correctAttempts,
                streak: p.streak,
                last_grade: p.lastGrade ?? null,
                current_level: currentLevel,
            }));

            const { error } = await supabase.from('lexia_progress').upsert(upsertPayload, {
                onConflict: 'letter',
            });

            if (error) {
                console.warn('Erro ao gravar progresso no Supabase:', error.message);
            }
        } catch (error) {
            console.warn('Supabase não disponível ou falha de conexão:', error);
        }
    }, [currentLevel]);

    // Salva nível no LocalStorage
    const saveLevelToStorage = useCallback((level: number) => {
        try {
            localStorage.setItem(LEVEL_KEY, level.toString());
        } catch (error) {
            console.error('Erro ao salvar nível:', error);
        }
    }, []);

    // Filtra letras disponíveis baseadas no nível atual
    const availableLetters = useMemo(() => {
        return CURRICULUM.filter(item => item.level <= currentLevel);
    }, [currentLevel]);

    // Obtém a próxima letra baseada na prioridade FSRS
    const getNextLetter = useCallback((): CurriculumItem | null => {
        if (availableLetters.length === 0) return null;

        // Prioriza letras que precisam de revisão (estabilidade baixa)
        const lettersNeedingReview = availableLetters.filter(item => {
            const progress = lettersProgress.find(p => p.letter === item.letter);
            return progress && needsReview(progress.card);
        });

        if (lettersNeedingReview.length > 0) {
            // Retorna a que tem menor estabilidade
            return lettersNeedingReview.reduce((prev, current) => {
                const prevProgress = lettersProgress.find(p => p.letter === prev.letter);
                const currentProgress = lettersProgress.find(p => p.letter === current.letter);
                const prevStability = prevProgress?.card.stability || 0;
                const currentStability = currentProgress?.card.stability || 0;
                return currentStability < prevStability ? current : prev;
            });
        }

        // Se nenhuma precisa de revisão, retorna a primeira não aprendida
        const unlearnedLetters = availableLetters.filter(item => {
            const progress = lettersProgress.find(p => p.letter === item.letter);
            return !progress || progress.streak < 3;
        });

        return unlearnedLetters[0] || availableLetters[0];
    }, [availableLetters, lettersProgress]);

    // Salva uma tentativa para uma letra específica
    const saveAttempt = useCallback((letter: string, grade: Grade) => {
        setLettersProgress(prevProgress => {
            const newProgress = prevProgress.map(progress => {
                if (progress.letter === letter) {
                    // Calcula o novo card usando FSRS
                    const newCard = fsrs(grade, progress.card);

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

            // Verifica se deve avançar de nível baseado na estabilidade média
            const currentLevelCards = CURRICULUM.filter(i => i.level === currentLevel);
            const avgStability = currentLevelCards.reduce((acc, curr) =>
                acc + (newProgress.find(p => p.letter === curr.letter)?.card.stability || 0), 0) / currentLevelCards.length;

            if (avgStability > 0.85 && currentLevel < 4) {
                const newLevel = currentLevel + 1;
                setCurrentLevel(newLevel);
                saveLevelToStorage(newLevel);
                // Trigger de celebração de Novo Nível!
            }

            // Salva no LocalStorage e Supabase
            void saveToStorage(newProgress);

            return newProgress;
        });
    }, [saveToStorage, availableLetters, currentLevel, saveLevelToStorage]);

    // Obtém o progresso de uma letra específica
    const getLetterProgress = useCallback((letter: string): LetterProgress | undefined => {
        return lettersProgress.find(progress => progress.letter === letter);
    }, [lettersProgress]);

    // Obtém letras que precisam ser revisadas hoje
    const getLettersToReview = useCallback((): LetterProgress[] => {
        return lettersProgress.filter(progress => needsReview(progress.card));
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
            totalLetters: CURRICULUM.length,
            currentLevel,
        };
    }, [lettersProgress, getLettersToReview, currentLevel]);

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

            void saveToStorage(newProgress);
            return newProgress;
        });
    }, [saveToStorage]);

    // Reseta todo o progresso
    const resetAll = useCallback(() => {
        const initialProgress: LetterProgress[] = CURRICULUM.map(item => ({
            letter: item.letter,
            card: createEmptyCard(),
            totalAttempts: 0,
            correctAttempts: 0,
            streak: 0,
        }));

        setLettersProgress(initialProgress);
        setCurrentLevel(1);
        void saveToStorage(initialProgress);
        saveLevelToStorage(1);
    }, [saveToStorage, saveLevelToStorage]);

    return {
        lettersProgress,
        isLoading,
        currentLevel,
        availableLetters,
        getNextLetter,
        saveAttempt,
        getLetterProgress,
        getLettersToReview,
        getStats,
        resetLetter,
        resetAll,
    };
}