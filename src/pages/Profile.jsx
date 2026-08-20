import React, { useState } from 'react';
import { isChallengeCompleted } from '@/lib/dailyChallenge';
import { motion, AnimatePresence } from 'framer-motion';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import { getAvatarById } from '@/lib/avatars';
import { getEarnedAchievements, buildStats } from '@/lib/achievements';
import { buildParentJourneyInsights } from '@/game/parentInsightsEngine';
import { getJourneyWorldExperience, getWorldRelicProgress } from '@/game/worldExperienceEngine';
import { playClickSound } from '@/lib/sounds';
import DeleteAccountButton from '@/components/profile/DeleteAccountButton';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import ProfileAvatarPicker from '@/components/profile/ProfileAvatarPicker';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileJourneyCard from '@/components/profile/ProfileJourneyCard';
import ProfileLetterHistory from '@/components/profile/ProfileLetterHistory';
import ProfileMascotCustomizer from '@/components/profile/ProfileMascotCustomizer';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileStickerAlbum from '@/components/profile/ProfileStickerAlbum';
import ProfileTabs from '@/components/profile/ProfileTabs';

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
      <ProfileHeader onBackClick={playClickSound} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <ProfileHero
          currentAvatar={currentAvatar}
          dailyDone={dailyDone}
          level={level}
          starsToNextLevel={starsToNextLevel}
        />

        <ProfileJourneyCard
          activeExperience={activeExperience}
          journey={journey}
          missionPct={missionPct}
          journeyInsights={journeyInsights}
          relicProgress={relicProgress}
        />

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
              <ProfileMascotCustomizer totalStars={totalStars} />
            </motion.div>
          )}

          {tab === 'letters' && (
            <motion.div key="letters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfileLetterHistory progressMap={progressMap} stats={stats} />
            </motion.div>
          )}

          {tab === 'stickers' && (
            <motion.div key="stickers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfileStickerAlbum allProgress={allProgress} stats={stats} />
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
