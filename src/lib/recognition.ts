// Handwriting Recognition Library
// Uses the experimental Handwriting Recognition API when available

export interface StrokePoint {
    x: number;
    y: number;
    t: number; // timestamp
}

export interface HandwritingResult {
    letter: string;
    confidence: number;
}

export async function recognizeDrawing(strokes: StrokePoint[][]): Promise<HandwritingResult | null> {
    // Feature detection
    if (!('createHandwritingRecognizer' in navigator)) {
        console.warn('Handwriting Recognition API not supported. Falling back to manual evaluation.');
        return null;
    }

    try {
        // Create recognizer for Portuguese
        const recognizer = await (navigator as any).createHandwritingRecognizer({
            languages: ['pt-BR']
        });

        // Convert strokes to HandwritingStroke format
        const handwritingStrokes = strokes.map(stroke => ({
            points: stroke.map(point => ({
                x: point.x,
                y: point.y,
                t: point.t
            }))
        }));

        // Recognize
        const results = await recognizer.recognize(handwritingStrokes);

        // Clean up
        recognizer.destroy();

        // Return the best result
        if (results.length > 0) {
            const bestResult = results[0];
            return {
                letter: bestResult.text,
                confidence: bestResult.confidence || 0.5
            };
        }

        return null;
    } catch (error) {
        console.error('Handwriting recognition failed:', error);
        return null;
    }
}