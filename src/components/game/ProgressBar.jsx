import React from 'react';
import { Star, Flame } from 'lucide-react';
import '@/styles/premium-gameplay-indicators.css';

export default function ProgressBar({ current, total, streak, stars }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="w-full flex items-center gap-2.5">
      {/* Stars count */}
      <div className="flex items-center gap-1 min-w-fit">
        <Star className="w-4 h-4 text-accent fill-accent" />
        <span className="font-body font-bold text-sm text-foreground">{stars || 0}</span>
      </div>

      {/* Progress track */}
      <div className="lexia-progress-track flex-1 h-4 bg-muted rounded-full overflow-hidden border border-border relative">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1 min-w-fit">
          <Flame className="w-4 h-4 text-destructive" />
          <span className="font-body font-bold text-sm text-foreground">{streak}</span>
        </div>
      )}
    </div>
  );
}
