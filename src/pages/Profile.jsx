import React, { useState } from 'react';
import { playClickSound } from '@/lib/sounds';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileContent from '@/components/profile/ProfileContent';
import useProfileViewModel from '@/hooks/useProfileViewModel';

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

  const {
    allProgress,
    progressMap,
    stats,
    journeyInsights,
    journey,
    activeExperience,
    relicProgress,
    missionPct,
    totalStars,
    earnedBadges,
    currentAvatar,
    level,
    starsToNextLevel,
    dailyDone,
  } = useProfileViewModel(profile);

  function selectAvatar(avatar) {
    if (avatar.unlockStars > totalStars) return;
    playClickSound();
    const updated = { ...profile, avatarId: avatar.id };
    setProfile(updated);
    saveProfile(updated);
  }

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
