import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { lexiaPlatform } from '@/platform';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Target, Flame, BookOpen, Trophy, TrendingUp, RefreshCw, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ALPHABET } from '@/lib/alphabetData';
import { calculateMastery } from '@/lib/fsrs';
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

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['childProgress'] });
  }

  async function handleSendReport() {
    setSendingReport(true);
    try {
      const me = await lexiaPlatform.auth.me();
      const email = me?.email;
      if (!email) throw new Error('no email');

      const recommendations = [
        lettersMastered < 26
          ? `• Continue praticando! Faltam ${26 - lettersMastered} letras para dominar o alfabeto.`
          : '• Parabéns! O alfabeto foi dominado. Explore sílabas e palavras!',
        accuracy < 70
          ? '• Foque na precisão: pratique com calma e peça ajuda quando precisar.'
          : '• Excelente precisão! Continue assim!',
        maxStreak < 5
          ? '• Tente acertar 5 seguidas para ganhar um combo!'
          : '• Que sequência incrível! Continue mantendo o ritmo.',
      ].join('\n');

      const body = `Relatório Semanal — Lexia Game

Estrelas: ${totalStars}
Letras Iniciadas: ${lettersStarted}/26
Letras Dominadas: ${lettersMastered}/26
Precisão: ${accuracy}%
Maior Sequência: ${maxStreak}
Tentativas Totais: ${totalAttempts}

Recomendações:
${recommendations}

Continue aprendendo com a Corujinha! 🦉`;

      await lexiaPlatform.email.send({
        to: email,
        subject: 'Relatório Semanal - Lexia Game',
        body,
      });

      toast({ title: '📧 Relatório enviado!', description: `Verifique seu email: ${email}` });
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente mais tarde', variant: 'destructive' });
    }
    setSendingReport(false);
  }

  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.letter] = p; });

  const letterProgress = allProgress.filter(p => p.letter && p.letter.length === 1);

  const totalStars = allProgress.reduce((s, p) => s + (p.stars_earned || 0), 0);
  const totalAttempts = letterProgress.reduce((s, p) => s + (p.total_attempts || 0), 0);
  const totalCorrect = letterProgress.reduce((s, p) => s + (p.correct_attempts || 0), 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const lettersStarted = letterProgress.filter(p => p.total_attempts > 0).length;
  const lettersMastered = letterProgress.filter(p => calculateMastery(p) >= 80).length;
  const maxStreak = letterProgress.reduce((max, p) => Math.max(max, p.streak || 0), 0);

  const chartData = ALPHABET.map(item => {
    const p = progressMap[item.letter];
    return {
      letter: item.letter,
      mastery: p ? calculateMastery(p) : 0,
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
          <div className="flex-1">
            <h1 className="font-display text-2xl text-foreground">Área dos Pais</h1>
            <p className="font-body text-sm text-muted-foreground">Acompanhe o progresso da aprendizagem</p>
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
          <StatsCard icon={Star} label="Estrelas" value={totalStars} color="bg-yellow-500" />
          <StatsCard icon={Target} label="Precisão" value={`${accuracy}%`} color="bg-green-500" />
          <StatsCard icon={BookOpen} label="Letras Iniciadas" value={`${lettersStarted}/26`} color="bg-blue-500" />
          <StatsCard icon={Trophy} label="Dominadas" value={lettersMastered} color="bg-purple-500" />
          <StatsCard icon={Flame} label="Maior Sequência" value={maxStreak} color="bg-red-500" />
          <StatsCard icon={TrendingUp} label="Tentativas" value={totalAttempts} color="bg-teal-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Progresso por Letra</CardTitle>
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
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={entry.mastery > 0 ? 0.8 : 0.2} />
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
            <p className="font-body text-sm text-foreground">
              💡 <strong>Dica:</strong> O algoritmo de repetição espaçada (FSRS) adapta automaticamente 
              o ritmo de aprendizagem. Letras mais difíceis aparecem com mais frequência, e as já dominadas 
              são revisadas em intervalos maiores para fixar na memória de longo prazo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}