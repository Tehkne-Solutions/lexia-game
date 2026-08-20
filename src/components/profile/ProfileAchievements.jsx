import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ACHIEVEMENTS } from '@/lib/achievements';

export default function ProfileAchievements({ earnedBadges = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base">
          Insígnias · {earnedBadges.length}/{ACHIEVEMENTS.length} conquistadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement, index) => {
            const earned = earnedBadges.some((item) => item.id === achievement.id);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                whileHover={earned ? { scale: 1.04 } : {}}
                className={`rounded-2xl border-2 p-3 flex items-center gap-3 transition-all
                  ${earned ? achievement.color : 'bg-muted/50 border-border opacity-50 grayscale'}`}
              >
                <motion.span
                  className="text-3xl"
                  animate={earned ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                >
                  {achievement.emoji}
                </motion.span>
                <div>
                  <p className={`font-body font-bold text-sm ${earned ? achievement.textColor : 'text-muted-foreground'}`}>
                    {achievement.title}
                  </p>
                  <p className="text-xs font-body text-muted-foreground">{achievement.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
