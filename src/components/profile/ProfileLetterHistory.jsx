import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ALPHABET } from '@/lib/alphabetData';
import { calculateMastery } from '@/lib/fsrs';

const letterStatusClasses = {
  mastered: 'bg-secondary text-white border-secondary',
  learning: 'bg-accent/80 text-accent-foreground border-accent',
  started: 'bg-primary/20 text-primary border-primary/30',
  new: 'bg-muted text-muted-foreground border-border',
};

const letterStatusLegend = [
  { color: 'bg-secondary', label: 'Dominada' },
  { color: 'bg-accent/80', label: 'Aprendendo' },
  { color: 'bg-primary/20', label: 'Iniciada' },
  { color: 'bg-muted', label: 'Nova' },
];

export default function ProfileLetterHistory({ progressMap = {}, stats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base">
          Histórico de Letras · {stats.masteredCount}/26 dominadas
        </CardTitle>
        <p className="font-body text-xs text-muted-foreground">
          Precisão deste capítulo: {stats.letterAccuracy}% · {stats.letterAttempts} tentativas
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {ALPHABET.map((item) => {
            const progress = progressMap[item.letter];
            const mastery = progress ? calculateMastery(progress) : 0;
            const attempts = progress?.total_attempts || 0;
            let status = 'new';
            if (mastery >= 80) status = 'mastered';
            else if (mastery >= 40) status = 'learning';
            else if (attempts > 0) status = 'started';

            return (
              <motion.div
                key={item.letter}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 ${letterStatusClasses[status]}`}
              >
                <span className="font-display text-xl">{item.letter}</span>
                <span className="text-sm">{item.emoji}</span>
                {status === 'mastered' && <span className="text-xs">⭐</span>}
                {attempts > 0 && status !== 'mastered' && (
                  <span className="text-xs opacity-70">{mastery}%</span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {letterStatusLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-xs font-body text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
