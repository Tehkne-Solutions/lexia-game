import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MascotCustomizer from '@/components/game/MascotCustomizer';

/** @param {{ totalStars?: number }} props */
export default function ProfileMascotCustomizer({ totalStars = 0 }) {
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Personalize sua Corujinha</CardTitle></CardHeader>
      <CardContent>
        <MascotCustomizer totalStars={totalStars} />
      </CardContent>
    </Card>
  );
}
