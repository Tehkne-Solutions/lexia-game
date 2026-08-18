import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-body text-muted-foreground">{label}</p>
          <p className="text-xl font-display text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}