import React from 'react';
import { Delete } from 'lucide-react';
import { playClickSound } from '@/lib/sounds';

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

export default function OnScreenKeyboard({ onKey, onDelete }) {
  return (
    <div className="lexia-onscreen-keyboard flex flex-col gap-1 w-full" aria-label="Teclado virtual">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1">
          {row.map(k => (
            <button
              key={k}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); onKey(k); playClickSound(); }}
              className="lexia-keyboard-key w-8 h-9 sm:w-9 rounded-lg bg-card border border-border font-body font-bold text-sm
                active:scale-95 transition-all select-none"
              aria-label={`Tecla ${k}`}
            >
              {k}
            </button>
          ))}
          {ri === 2 && (
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); onDelete(); playClickSound(); }}
              className="lexia-keyboard-key lexia-keyboard-delete w-12 h-9 rounded-lg bg-muted border border-border flex items-center justify-center
                active:scale-95 transition-all select-none"
              aria-label="Apagar último caractere"
            >
              <Delete className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}