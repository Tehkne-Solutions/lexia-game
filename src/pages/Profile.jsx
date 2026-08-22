import React, { useState } from 'react';
import { isChallengeCompleted } from '@/lib/dailyChallenge';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import { getAvatarById } from '@/lib/avatars';
import { getEarnedAchievements, buildStats } from '@/lib/achievements';
import { buildParentJourneyInsights } from '@/game/parentInsightsEngine';
import { getJourneyWorldExperience, getWorldRelicProgress } from '@/game/worldExperienceEngine';
import { playClickSound } from '@/lib/sounds';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileContent from '@/components/profile/ProfileContent';

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

      <ProfileContent
        currentAvatar={currentAvatar}
        dailyDone={dailyDone}
        level={level}
        starsToNextLevel={starsToNextLevel}
        activeExperience={activeExperience}
        journey={journey}
        missionPct={missionPct}
        journeyInsights={journeyInsights}
        relicProgress={relicProgress}
        totalStars={totalStars}
        maxStreak={stats.maxStreak}
        accuracy={stats.accuracy}
        activeTab={tab}
        onTabChange={setTab}
        profile={profile}
        onSelectAvatar={selectAvatar}
        progressMap={progressMap}
        stats={stats}
        allProgress={allProgress}
        earnedBadges={earnedBadges}
      />
    </div>
  );
}
