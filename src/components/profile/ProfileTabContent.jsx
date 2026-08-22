import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import ProfileAvatarPicker from '@/components/profile/ProfileAvatarPicker';
import ProfileLetterHistory from '@/components/profile/ProfileLetterHistory';
import ProfileMascotCustomizer from '@/components/profile/ProfileMascotCustomizer';
import ProfileStickerAlbum from '@/components/profile/ProfileStickerAlbum';

/**
 * @param {{
 *   activeTab: string,
 *   profile: object,
 *   totalStars: number,
 *   onSelectAvatar: (avatar: object) => void,
 *   progressMap: object,
 *   stats: object,
 *   allProgress: any[],
 *   earnedBadges: any[],
 * }} props
 */
export default function ProfileTabContent({
  activeTab,
  profile,
  totalStars,
  onSelectAvatar,
  progressMap,
  stats,
  allProgress,
  earnedBadges,
}) {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'avatar' && (
        <motion.div key="avatar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <ProfileAvatarPicker profile={profile} totalStars={totalStars} onSelect={onSelectAvatar} />
        </motion.div>
      )}

      {activeTab === 'mascot' && (
        <motion.div key="mascot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <ProfileMascotCustomizer totalStars={totalStars} />
        </motion.div>
      )}

      {activeTab === 'letters' && (
        <motion.div key="letters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <ProfileLetterHistory progressMap={progressMap} stats={stats} />
        </motion.div>
      )}

      {activeTab === 'stickers' && (
        <motion.div key="stickers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <ProfileStickerAlbum allProgress={allProgress} stats={stats} />
        </motion.div>
      )}

      {activeTab === 'badges' && (
        <motion.div key="badges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <ProfileAchievements earnedBadges={earnedBadges} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
