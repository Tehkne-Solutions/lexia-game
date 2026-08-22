import { useQuery } from '@tanstack/react-query';
import { isChallengeCompleted } from '@/lib/dailyChallenge';
import { getAvatarById } from '@/lib/avatars';
import { getEarnedAchievements, buildStats } from '@/lib/achievements';
import { buildParentJourneyInsights } from '@/game/parentInsightsEngine';
import { getJourneyWorldExperience, getWorldRelicProgress } from '@/game/worldExperienceEngine';
import { lexiaPlatform } from '@/platform';

export default function useProfileViewModel(profile) {
  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  const progressMap = {};
  allProgress.forEach((progress) => { progressMap[progress.letter] = progress; });

  const stats = buildStats(allProgress);
  const journeyInsights = buildParentJourneyInsights(allProgress);
  const journey = journeyInsights.journey;
  const activeExperience = getJourneyWorldExperience(journey, stats);
  const relicProgress = getWorldRelicProgress(stats);
  const missionPct = journey.total > 0 ? Math.round((journey.current / journey.total) * 100) : 0;
  const totalStars = stats.totalStars;
  const earnedBadges = getEarnedAchievements(stats);
  const currentAvatar = getAvatarById(profile.avatarId || 'owl');
  const level = Math.floor(totalStars / 5) + 1;
  const starsToNextLevel = 5 - (totalStars % 5);
  const dailyDone = isChallengeCompleted();

  return {
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
  };
}
