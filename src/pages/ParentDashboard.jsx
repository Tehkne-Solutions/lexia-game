import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { lexiaPlatform } from '@/platform';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Target, Flame, BookOpen, Trophy, TrendingUp, RefreshCw, Mail, Compass } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ALPHABET } from '@/lib/alphabetData';
import { calculateMastery } from '@/lib/fsrs';
import { buildParentJourneyInsights, buildParentWeeklyReport } from '@/game/parentInsightsEngine';
import StatsCard from '@/components/parent/StatsCard';
import LetterProgressGrid from '@/components/parent/LetterProgressGrid';
import { useToast } from '@/components/ui/use-toast';

export default function ParentDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendingReport, setSendingReport] = useState(false);
  const { data: allProgress = [], isLoading, isFetching } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  const insights = buildParentJourneyInsights(allProgress);
  const letterChapter = insights.chapters.find((chapter) => chapter.id === 'letters');

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['childProgress'] });
  }

  async function handleSendReport() {
    setSendingReport(true);
    try {
      const me = await lexiaPlatform.auth.me();
      const email = me?.email;
      if (!email) throw new Error('no email');

      await lexiaPlatform.email.send({
        to: email,
        subject: 'Relatório de Jornada - Lexia Game',
        body: buildParentWeeklyReport(insights),
      });

      toast({ title: '📧 Relatório enviado!', description: `Verifique seu email: ${email}` });
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente mais tarde', variant: 'destructive' });
    }
    setSendingReport(false);
  }

  const progressMap = {};
  allProgress.forEach((progress) => { progressMap[progress.letter] = progress; });

  const chartData = ALPHABET.map((item) => {
    const progress = progressMap[item.letter];
    return {
      letter: item.letter,
      mastery: progress ? calculateMastery(progress) : 0,
      color: item.color,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border p-4 pt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-foreground">Área dos Pais</h1>
            <p className="font-body text-sm text-muted-foreground">Acompanhe toda a jornada de alfabetização</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSendReport}
            disabled={sendingReport}
            className="rounded-xl gap-1.5 font-body font-bold text-xs"
          >
            {sendingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sendingReport ? 'Enviando...' : 'Relatório'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            className="rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatsCard icon={Star} label="Estrelas" value={insights.totalStars} color="bg-yellow-500" />
          <StatsCard icon={Target} label="Precisão geral" value={`${insights.overallAccuracy}%`} color="bg-green-500" />
          <StatsCard icon={TrendingUp} label="Jornada" value={`${insights.totalMastered}/${insights.totalTargets}`} color="bg-blue-500" />
          <StatsCard icon={Trophy} label="Capítulos" value={`${insights.chaptersCompleted}/${insights.totalChapters}`} color="bg-purple-500" />
          <StatsCard icon={Flame} label="Maior sequência" value={insights.maxStreak} color="bg-red-500" />
          <StatsCard icon={BookOpen} label="Tentativas" value={insights.totalAttempts} color="bg-teal-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-lg">Jornada de Alfabetização</CardTitle>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {insights.totalMastered}/{insights.totalTargets} objetivos dominados · {insights.overallCompletionPct}% do caminho principal
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 text-primary p-2" aria-hidden="true">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="font-body text-[11px] uppercase tracking-[0.12em] text-primary font-bold">Missão atual</p>
                <p className="font-display text-base text-foreground mt-0.5">{insights.journey.title}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">{insights.journey.description}</p>
              </div>

              <div className="space-y-2">
                {insights.chapters.map((chapter) => {
                  const isCurrent = insights.journey.stage === chapter.stage;
                  return (
                    <div
                      key={chapter.id}
                      className={`rounded-xl border p-3 ${isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">{chapter.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-body font-bold text-sm text-foreground truncate">{chapter.label}</p>
                            <span className="font-body text-xs font-bold text-muted-foreground whitespace-nowrap">
                              {chapter.mastered}/{chapter.total}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-[width] duration-500"
                              style={{ width: `${chapter.completionPct}%` }}
                            />
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-body text-[11px] text-muted-foreground">
                            <span>{chapter.completionPct}% dominado</span>
                            <span>{chapter.started}/{chapter.total} iniciados</span>
                            <span>Precisão {chapter.accuracy}%</span>
                            {chapter.completed && <span className="font-bold text-primary">Capítulo completo</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Próximo foco em casa</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.recommendations.map((recommendation) => (
                  <li key={recommendation} className="font-body text-sm text-foreground flex gap-2 leading-relaxed">
                    <span className="text-primary" aria-hidden="true">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Detalhe do Mundo das Letras</CardTitle>
              <p className="font-body text-sm text-muted-foreground">
                {letterChapter?.mastered || 0}/26 letras dominadas · {letterChapter?.accuracy || 0}% de precisão no capítulo
              </p>
            </CardHeader>
            <CardContent>
              <LetterProgressGrid progressMap={progressMap} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Domínio de Cada Letra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="letter" tick={{ fontSize: 10, fontFamily: 'var(--font-body)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Domínio']}
                      contentStyle={{ borderRadius: '12px', fontFamily: 'var(--font-body)' }}
                    />
                    <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={entry.letter || index} fill={entry.color} opacity={entry.mastery > 0 ? 0.8 : 0.2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="font-body text-sm text-foreground leading-relaxed">
              💡 <strong>Como ler estes dados:</strong> letras usam o algoritmo de repetição espaçada FSRS para adaptar revisões. Sílabas, palavras e frases são consideradas dominadas após repetição correta consistente. A precisão geral acima combina todos os capítulos já praticados, não apenas o alfabeto.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
