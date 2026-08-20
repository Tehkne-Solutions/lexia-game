import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isChallengeCompleted } from '@/lib/dailyChallenge';
import { motion, AnimatePresence } from 'framer-motion';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GameActionButton from '@/components/game/GameActionButton';
import { getAvatarById } from '@/lib/avatars';
import { getEarnedAchievements, buildStats } from '@/lib/achievements';
import { buildParentJourneyInsights } from '@/game/parentInsightsEngine';
import { getJourneyWorldExperience, getWorldRelicProgress } from '@/game/worldExperienceEngine';
import { playClickSound } from '@/lib/sounds';
import DeleteAccountButton from '@/components/profile/DeleteAccountButton';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import ProfileAvatarPicker from '@/components/profile/ProfileAvatarPicker';
import ProfileLetterHistory from '@/components/profile/ProfileLetterHistory';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabs from '@/components/profile/ProfileTabs';
import StickerAlbum from '@/components/game/StickerAlbum';
import MascotCustomizer from '@/components/game/MascotCustomizer';

const PROFILE_KEY = 'lexia_profile';

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}
function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export default function Profile() {
  const [profile, setProfile] = useState(loadProfile);
  const [tab, setTab] = useState('avatar');

  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.letter] = p; });

  const stats = buildStats(allProgress);
  const journeyInsights = buildParentJourneyInsights(allProgress);
  const journey = journeyInsights.journey;
  const activeExperience = getJourneyWorldExperience(journey, stats);
  const relicProgress = getWorldRelicProgress(stats);
  const missionPct = journey.total > 0 ? Math.round((journey.current / journey.total) * 100) : 0;
  const totalStars = stats.totalStars;
  const earnedBadges = getEarnedAchievements(stats);
  const currentAvatar = getAvatarById(profile.avatarId || 'owl');

  function selectAvatar(avatar) {
    if (avatar.unlockStars > totalStars) return;
    playClickSound();
    const updated = { ...profile, avatarId: avatar.id };
    setProfile(updated);
    saveProfile(updated);
  }

  const level = Math.floor(totalStars / 5) + 1;
  const starsToNextLevel = 5 - (totalStars % 5);
  const dailyDone = isChallengeCompleted();

  return (
    <div className="min-h-screen bg-background">
      <div className="lexia-gameplay-hud border-b border-border p-4 pt-[env(safe-area-inset-top)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <GameActionButton
              gameVariant="neutral"
              variant="ghost"
              size="icon"
              className="lexia-hud-icon rounded-xl"
              onClick={playClickSound}
              aria-label="Voltar ao início"
            >
              <ArrowLeft className="w-5 h-5" />
            </GameActionButton>
          </Link>
          <h1 className="font-display text-2xl text-foreground">Meu Perfil</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lexia-game-panel lexia-game-panel-reward rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="text-6xl">{currentAvatar.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display text-xl text-foreground">{currentAvatar.name}</p>
              {dailyDone && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="rounded-full border border-accent/45 bg-accent/15 px-2 py-0.5 text-xs font-body font-bold text-accent-foreground flex items-center gap-1"
                >
                  🏆 Desafio Diário!
                </motion.span>
              )}
            </div>
            <p className="font-body text-sm text-muted-foreground">Nível {level} · Corujinha Guardiã</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((5 - starsToNextLevel) / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-body text-muted-foreground whitespace-nowrap">{starsToNextLevel} ⭐ p/ nível {level + 1}</span>
            </div>
          </div>
        </motion.div>

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

        <ProfileStats
          totalStars={totalStars}
          journeyMastered={journeyInsights.totalMastered}
          journeyTotal={journeyInsights.totalTargets}
          maxStreak={stats.maxStreak}
          accuracy={stats.accuracy}
        />

        <ProfileTabs activeTab={tab} onChange={setTab} />

        <AnimatePresence mode="wait">
          {tab === 'avatar' && (
            <motion.div key="avatar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfileAvatarPicker profile={profile} totalStars={totalStars} onSelect={selectAvatar} />
            </motion.div>
          )}

          {tab === 'mascot' && (
            <motion.div key="mascot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader><CardTitle className="font-display text-base">Personalize sua Corujinha</CardTitle></CardHeader>
                <CardContent>
                  <MascotCustomizer totalStars={totalStars} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === 'letters' && (
            <motion.div key="letters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfileLetterHistory progressMap={progressMap} stats={stats} />
            </motion.div>
          )}

          {tab === 'stickers' && (
            <motion.div key="stickers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader><CardTitle className="font-display text-base">Álbum de Adesivos</CardTitle></CardHeader>
                <CardContent>
                  <StickerAlbum allProgress={allProgress} stats={stats} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfileAchievements earnedBadges={earnedBadges} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2">
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
