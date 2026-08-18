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
    <div className="flex flex-col gap-1 w-full">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1">
          {row.map(k => (
            <button
              key={k}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); onKey(k); playClickSound(); }}
              className="w-8 h-9 sm:w-9 rounded-lg bg-card border border-border font-body font-bold text-sm
                shadow-sm active:bg-primary active:text-white active:scale-95 transition-all select-none"
            >
              {k}
            </button>
          ))}
          {ri === 2 && (
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); onDelete(); playClickSound(); }}
              className="w-12 h-9 rounded-lg bg-muted border border-border flex items-center justify-center
                shadow-sm active:bg-destructive active:text-white active:scale-95 transition-all select-none"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}