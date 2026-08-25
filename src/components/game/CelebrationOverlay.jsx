import React from 'react';
import { Star, Sparkles } from 'lucide-react';

export function CelebrationOverlay({ isVisible, accuracy = 100, onContinue }) {
  if (!isVisible) return null;

  const starCount = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-4 border-amber-300 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl transform animate-bounce-short">
        <div className="flex justify-center items-center gap-2 mb-3">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin-slow" />
          <h2 className="text-3xl font-black text-amber-500 tracking-wide">
            {starCount === 3 ? 'Incrível!' : 'Muito Bem!'}
          </h2>
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin-slow" />
        </div>

        <div className="flex justify-center items-center gap-3 my-4">
          {[1, 2, 3].map((starIndex) => (
            <Star
              key={starIndex}
              className={`w-14 h-14 transition-all duration-500 transform ${
                starIndex <= starCount
                  ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md animate-pulse'
                  : 'text-gray-200 fill-gray-100'
              }`}
            />
          ))}
        </div>

        <p className="text-gray-600 font-bold text-lg mb-6">
          Você desenhou super bem! Vamos continuar a aventura?
        </p>

        <button
          onClick={onContinue}
          className="w-full py-4 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-extrabold text-xl rounded-2xl shadow-lg border-b-4 border-green-700 active:translate-y-1 transition-all"
        >
          Próxima Letra! 🚀
        </button>
      </div>
    </div>
  );
}
