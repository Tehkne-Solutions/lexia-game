import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * @param {{
 *   activeExperience: any,
 *   journey: any,
 *   missionPct: number,
 *   journeyInsights: any,
 *   relicProgress: any,
 * }} props
 */
export default function ProfileJourneyCard({ activeExperience, journey, missionPct, journeyInsights, relicProgress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 text-primary p-2.5" aria-hidden="true">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {activeExperience.chapter} · {activeExperience.title}
              </p>
              <h2 className="font-display text-lg text-foreground mt-1">{journey.title}</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">{journey.description}</p>

              <div className="flex items-center gap-2 mt-3">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${missionPct}%` }}
                  />
                </div>
                <span className="font-body text-xs font-bold text-muted-foreground whitespace-nowrap">
                  {journey.current}/{journey.total}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 font-body text-xs text-muted-foreground">
                <span><strong className="text-foreground">{journeyInsights.totalMastered}/{journeyInsights.totalTargets}</strong> na jornada</span>
                <span><strong className="text-foreground">{journeyInsights.chaptersCompleted}/{journeyInsights.totalChapters}</strong> capítulos</span>
                <span><strong className="text-foreground">{relicProgress.unlocked}/{relicProgress.total}</strong> relíquias</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
