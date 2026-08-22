import React from 'react';
import ProfileAccountActions from '@/components/profile/ProfileAccountActions';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileJourneyCard from '@/components/profile/ProfileJourneyCard';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabContent from '@/components/profile/ProfileTabContent';
import ProfileTabs from '@/components/profile/ProfileTabs';

/**
 * @param {{
 *   currentAvatar: object,
 *   dailyDone: boolean,
 *   level: number,
 *   starsToNextLevel: number,
 *   activeExperience: object,
 *   journey: object,
 *   missionPct: number,
 *   journeyInsights: object,
 *   relicProgress: object,
 *   totalStars: number,
 *   maxStreak: number,
 *   accuracy: number,
 *   activeTab: string,
 *   onTabChange: (tab: string) => void,
 *   profile: object,
 *   onSelectAvatar: (avatar: object) => void,
 *   progressMap: object,
 *   stats: object,
 *   allProgress: any[],
 *   earnedBadges: any[],
 * }} props
 */
export default function ProfileContent({
  currentAvatar,
  dailyDone,
  level,
  starsToNextLevel,
  activeExperience,
  journey,
  missionPct,
  journeyInsights,
  relicProgress,
  totalStars,
  maxStreak,
  accuracy,
  activeTab,
  onTabChange,
  profile,
  onSelectAvatar,
  progressMap,
  stats,
  allProgress,
  earnedBadges,
}) {
  return (
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
        maxStreak={maxStreak}
        accuracy={accuracy}
      />

      <ProfileTabs activeTab={activeTab} onChange={onTabChange} />
      <ProfileTabContent
        activeTab={activeTab}
        profile={profile}
        totalStars={totalStars}
        onSelectAvatar={onSelectAvatar}
        progressMap={progressMap}
        stats={stats}
        allProgress={allProgress}
        earnedBadges={earnedBadges}
      />
      <ProfileAccountActions />
    </div>
  );
}
