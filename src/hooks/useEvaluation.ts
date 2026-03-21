// Hook for automatic evaluation of drawn letters
import { useCallback } from 'react';
import { recognizeDrawing, StrokePoint, HandwritingResult } from '../lib/recognition';
import { celebrate } from '../lib/voice';

export type Grade = 1 | 2 | 3 | 4;

export interface EvaluationResult {
    grade: Grade;
    recognizedLetter: string | null;
    confidence: number;
    isAutomatic: boolean;
}

export function useEvaluation() {
    const evaluateDrawing = useCallback(async (
        targetLetter: string,
        strokes: StrokePoint[][]
    ): Promise<EvaluationResult> => {
        // Try automatic recognition
        const recognitionResult = await recognizeDrawing(strokes);

        if (recognitionResult) {
            // Automatic evaluation
            const { letter, confidence } = recognitionResult;
            let grade: Grade;

            if (letter.toUpperCase() === targetLetter.toUpperCase()) {
                grade = 4; // Perfect match - Easy
            } else if (isVisuallySimilar(letter, targetLetter)) {
                grade = 2; // Similar but not exact - Hard
            } else {
                grade = 1; // No match - Again
            }

            // Celebrate on good grades
            if (grade >= 3) {
                celebrate();
            }

            return {
                grade,
                recognizedLetter: letter,
                confidence,
                isAutomatic: true
            };
        } else {
            // Fallback to manual evaluation
            return {
                grade: 1, // Default to "Again" for manual
                recognizedLetter: null,
                confidence: 0,
                isAutomatic: false
            };
        }
    }, []);

    return { evaluateDrawing };
}

// Helper function to check visual similarity between letters
function isVisuallySimilar(detected: string, target: string): boolean {
    const detectedUpper = detected.toUpperCase();
    const targetUpper = target.toUpperCase();

    // Simple similarity rules for common confusions
    const similarities: Record<string, string[]> = {
        'A': ['4', 'O'],
        'B': ['8', 'D'],
        'C': ['O', 'G'],
        'D': ['O', 'B'],
        'E': ['F', '3'],
        'F': ['E', 'P'],
        'G': ['C', 'Q'],
        'H': ['N', 'M'],
        'I': ['1', 'L'],
        'J': ['I', '7'],
        'K': ['X', 'H'],
        'L': ['1', 'I'],
        'M': ['N', 'W'],
        'N': ['M', 'H'],
        'O': ['0', 'Q', 'C'],
        'P': ['F', 'R'],
        'Q': ['O', 'G'],
        'R': ['P', 'K'],
        'S': ['5', '8'],
        'T': ['7', 'I'],
        'U': ['V', 'W'],
        'V': ['U', 'W'],
        'W': ['M', 'U'],
        'X': ['K', 'Y'],
        'Y': ['X', 'V'],
        'Z': ['2', '7']
    };

    return similarities[targetUpper]?.includes(detectedUpper) || false;
}