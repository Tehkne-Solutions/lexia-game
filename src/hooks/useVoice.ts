import { useCallback } from 'react';

export const useVoice = () => {
    const speak = useCallback((text: string) => {
        // Cancela falas anteriores para evitar sobreposição
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9; // Um pouco mais lento para clareza pedagógica
        utterance.pitch = 1.1; // Tom levemente mais agudo para soar amigável (infantil/tutor)

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
};