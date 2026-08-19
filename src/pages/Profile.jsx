import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isChallengeCompleted } from '@/lib/dailyChallenge';
import { motion, AnimatePresence } from 'framer-motion';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Trophy, Flame, Target, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GameActionButton from '@/components/game/GameActionButton';
import { AVATARS, getAvatarById } from '@/lib/avatars';
import { ALPHABET } from '@/lib/alphabetData';
import { calculateMastery } from '@/lib/fsrs';
import { ACHIEVEMENTS, getEarnedAchievements, buildStats } from '@/lib/achievements';
import { buildParentJourneyInsights } from '@/game/parentInsightsEngine';
import { getJourneyWorldExperience, getWorldRelicProgress } from '@/game/worldExperienceEngine';
import { playClickSound } from '@/lib/sounds';
import DeleteAccountButton from '@/components/profile/DeleteAccountButton';
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
                  className="bg-amber-100 border border-amber-400 rounded-full px-2 py-0.5 text-xs font-body font-bold text-amber-700 flex items-center gap-1"
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

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Star, label: 'Estrelas', value: totalStars, color: 'text-yellow-500' },
            { icon: Trophy, label: 'Jornada', value: `${journeyInsights.totalMastered}/${journeyInsights.totalTargets}`, color: 'text-purple-500' },
            { icon: Flame, label: 'Sequência', value: stats.maxStreak, color: 'text-red-500' },
            { icon: Target, label: 'Precisão', value: `${stats.accuracy}%`, color: 'text-green-500' },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <CardContent className="p-3">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="font-display text-lg text-foreground">{s.value}</p>
                <p className="text-xs font-body text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto sm:overflow-visible pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'avatar', label: '🐾 Avatar' },
            { id: 'mascot', label: '🎨 Corujinha' },
            { id: 'letters', label: '🔤 Letras' },
            { id: 'stickers', label: '🏆 Adesivos' },
            { id: 'badges', label: '🏅 Insígnias' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { playClickSound(); setTab(t.id); }}
              className={`flex-none min-w-[92px] sm:flex-1 sm:min-w-0 py-2 px-3 rounded-xl font-body font-bold text-sm transition-all
                ${tab === t.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'avatar' && (
            <motion.div key="avatar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader><CardTitle className="font-display text-base">Escolha seu Avatar</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map(av => {
                      const locked = av.unlockStars > totalStars;
                      const selected = profile.avatarId === av.id || (!profile.avatarId && av.id === 'owl');
                      return (
                        <motion.button
                          key={av.id}
                          whileTap={!locked ? { scale: 0.9 } : {}}
                          onClick={() => selectAvatar(av)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all
                            ${selected ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-muted/30'}
                            ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
                        >
                          <span className="text-3xl">{av.emoji}</span>
                          <span className="text-xs font-body font-semibold text-foreground leading-tight text-center">{av.name}</span>
                          {locked && <span className="text-xs text-muted-foreground">🔒 {av.unlockStars}⭐</span>}
                          {selected && <span className="text-xs text-primary">✓</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground font-body text-center mt-3">
                    Você tem {totalStars} ⭐ — ganhe mais para desbloquear avatares!
                  </p>
                </CardContent>
              </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">
                    Histórico de Letras · {stats.masteredCount}/26 dominadas
                  </CardTitle>
                  <p className="font-body text-xs text-muted-foreground">
                    Precisão deste capítulo: {stats.letterAccuracy}% · {stats.letterAttempts} tentativas
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {ALPHABET.map(item => {
                      const p = progressMap[item.letter];
                      const mastery = p ? calculateMastery(p) : 0;
                      const attempts = p?.total_attempts || 0;
                      let status = 'new';
                      if (mastery >= 80) status = 'mastered';
                      else if (mastery >= 40) status = 'learning';
                      else if (attempts > 0) status = 'started';

                      const statusBg = {
                        mastered: 'bg-secondary text-white border-secondary',
                        learning: 'bg-accent/80 text-accent-foreground border-accent',
                        started: 'bg-primary/20 text-primary border-primary/30',
                        new: 'bg-muted text-muted-foreground border-border',
                      }[status];

                      return (
                        <motion.div
                          key={item.letter}
                          whileHover={{ scale: 1.05 }}
                          className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 ${statusBg}`}
                        >
                          <span className="font-display text-xl">{item.letter}</span>
                          <span className="text-sm">{item.emoji}</span>
                          {status === 'mastered' && <span className="text-xs">⭐</span>}
                          {attempts > 0 && status !== 'mastered' && (
                            <span className="text-xs opacity-70">{mastery}%</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {[
                      { color: 'bg-secondary', label: 'Dominada' },
                      { color: 'bg-accent/80', label: 'Aprendendo' },
                      { color: 'bg-primary/20', label: 'Iniciada' },
                      { color: 'bg-muted', label: 'Nova' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${l.color}`} />
                        <span className="text-xs font-body text-muted-foreground">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">
                    Insígnias · {earnedBadges.length}/{ACHIEVEMENTS.length} conquistadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {ACHIEVEMENTS.map((a, i) => {
                      const earned = earnedBadges.some(e => e.id === a.id);
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                          whileHover={earned ? { scale: 1.04 } : {}}
                          className={`rounded-2xl border-2 p-3 flex items-center gap-3 transition-all
                            ${earned ? a.color : 'bg-muted/50 border-border opacity-50 grayscale'}`}
                        >
                          <motion.span
                            className="text-3xl"
                            animate={earned ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                          >
                            {a.emoji}
                          </motion.span>
                          <div>
                            <p className={`font-body font-bold text-sm ${earned ? a.textColor : 'text-muted-foreground'}`}>
                              {a.title}
                            </p>
                            <p className="text-xs font-body text-muted-foreground">{a.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
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
