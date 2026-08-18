import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { lexiaPlatform, activePlatformProvider } from '@/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, KeyRound, Mail, UserPlus } from 'lucide-react';

function getSafeReturnTo() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('returnTo');
  if (!raw) return '/';
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
  } catch {
    return '/';
  }
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const returnTo = useMemo(getSafeReturnTo, []);

  if (activePlatformProvider !== 'supabase') {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'recover') {
        await lexiaPlatform.auth.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/login`,
        });
        setMessage('Enviamos as instruções de recuperação para seu e-mail.');
        return;
      }

      if (mode === 'signup') {
        const result = await lexiaPlatform.auth.signUp({
          email,
          password,
          data: { onboarding_version: 'fresh-start-v1' },
          redirectTo: `${window.location.origin}/login`,
        });
        if (lexiaPlatform.auth.hasAccessToken() || result?.access_token || result?.session?.access_token) {
          window.location.assign(returnTo);
        } else {
          setMessage('Conta criada. Confirme seu e-mail para começar sua nova jornada.');
        }
        return;
      }

      await lexiaPlatform.auth.signInWithPassword({ email, password });
      window.location.assign(returnTo);
    } catch (err) {
      setError(err?.message || 'Não foi possível concluir a autenticação.');
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'login' ? 'Entrar no Lexia' : mode === 'signup' ? 'Criar conta' : 'Recuperar acesso';
  const helperText = mode === 'signup'
    ? 'Sua jornada começa do zero. O progresso novo ficará salvo nesta conta.'
    : mode === 'recover'
      ? 'Recupere o acesso à sua conta para continuar sua jornada.'
      : 'Entre para continuar sua jornada de aprendizagem.';
  const submitLabel = mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar recuperação';
  const SubmitIcon = mode === 'signup' ? UserPlus : mode === 'recover' ? Mail : KeyRound;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-3xl border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="text-6xl">🦉</div>
          <CardTitle className="font-display text-2xl">{title}</CardTitle>
          <p className="font-body text-sm text-muted-foreground">{helperText}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-body text-sm font-semibold text-foreground">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="mt-1 rounded-xl"
              />
            </div>

            {mode !== 'recover' && (
              <div>
                <label className="font-body text-sm font-semibold text-foreground">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                  className="mt-1 rounded-xl"
                />
              </div>
            )}

            {error && <p className="font-body text-sm text-red-600" role="alert">{error}</p>}
            {message && <p className="font-body text-sm text-green-700" role="status">{message}</p>}

            <Button type="submit" disabled={busy} className="w-full rounded-2xl gap-2 font-display">
              <SubmitIcon className="w-4 h-4" />
              {busy ? 'Processando...' : submitLabel}
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center">
            {mode !== 'login' && (
              <button type="button" className="text-sm text-primary font-body" onClick={() => { setMode('login'); setError(''); setMessage(''); }}>
                Já tenho conta
              </button>
            )}
            {mode === 'login' && (
              <>
                <button type="button" className="text-sm text-primary font-body" onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>
                  Criar uma conta
                </button>
                <button type="button" className="text-sm text-muted-foreground font-body" onClick={() => { setMode('recover'); setError(''); setMessage(''); }}>
                  Esqueci minha senha
                </button>
              </>
            )}
          </div>

          <Button variant="ghost" className="w-full mt-4 rounded-xl gap-2" onClick={() => window.location.assign('/')}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
