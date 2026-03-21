import React from 'react';
import { CURRICULUM } from '../data/curriculum';

export const ParentDashboard = ({ cardsState }: { cardsState: any }) => {
    const calculateProgress = () => {
        const totalLetters = CURRICULUM.length;
        // Consideramos uma letra "aprendida" se a estabilidade for > 0.7
        const learnedLetters = CURRICULUM.filter(l => (cardsState[l.letter]?.stability || 0) > 0.7).length;
        return Math.round((learnedLetters / totalLetters) * 100);
    };

    return (
        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-slate-700 mb-4">Relatório do Pequeno Explorador</h3>
            <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                <div
                    className="bg-green-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculateProgress()}%` }}
                />
            </div>
            <p className="mt-2 text-slate-500 font-medium">{calculateProgress()}% da jornada concluída!</p>
        </div>
    );
};