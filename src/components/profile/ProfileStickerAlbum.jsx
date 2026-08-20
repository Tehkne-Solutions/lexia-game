import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StickerAlbum from '@/components/game/StickerAlbum';

/** @param {{ allProgress?: unknown[], stats: any }} props */
export default function ProfileStickerAlbum({ allProgress = [], stats }) {
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Álbum de Adesivos</CardTitle></CardHeader>
      <CardContent>
        <StickerAlbum allProgress={allProgress} stats={stats} />
      </CardContent>
    </Card>
  );
}
