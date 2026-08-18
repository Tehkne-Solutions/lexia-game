import React from 'react';
import { Star, Flame } from 'lucide-react';

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
      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden border border-border shadow-inner relative">
        <div
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-700 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-y-0 -left-full w-1/2 bg-white/30 skew-x-12 animate-[shimmer_2.5s_infinite]" />
          </div>
        </div>
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