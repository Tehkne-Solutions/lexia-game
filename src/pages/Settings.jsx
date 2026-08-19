import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Home, Eye, Type, Accessibility, Check, LogOut, ShieldCheck, Volume2, Mic2 } from 'lucide-react';
import { loadAccessibilitySettings, saveAccessibilitySettings, applyAccessibilitySettings } from '@/lib/accessibility';
import { playClickSound } from '@/lib/sounds';
import { loadAudioSettings, previewVoice, updateAudioSettings } from '@/audio/audioRuntime';
import { useAuth } from '@/lib/AuthContext';
import { activePlatformProvider } from '@/platform';

export default function Settings() {
  const [settings, setSettings] = useState(loadAccessibilitySettings);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const { logout } = useAuth();

  function update(newSettings) {
    setSettings(newSettings);
    saveAccessibilitySettings(newSettings);
    applyAccessibilitySettings(newSettings);
  }

  function updateAudio(patch) {
    setAudioSettings(updateAudioSettings(patch));
  }

  function toggleDyslexiaFont() {
    playClickSound();
    update({ ...settings, dyslexiaFont: !settings.dyslexiaFont });
  }

  function toggleHighContrast() {
    playClickSound();
    update({ ...settings, highContrast: !settings.highContrast });
  }

  function setTextSize(size) {
    playClickSound();
    update({ ...settings, textSize: size });
  }

  function handleLogout() {
    playClickSound();
    logout(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border p-4 pt-[env(safe-area-inset-top)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={playClickSound}>
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-display text-2xl text-foreground">Acessibilidade</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                Som e voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-body text-sm font-bold text-foreground">Efeitos sonoros</span>
                  <span className="font-body text-xs text-muted-foreground">{Math.round(audioSettings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(audioSettings.sfxVolume * 100)}
                  onChange={(event) => updateAudio({ sfxVolume: Number(event.target.value) / 100 })}
                  className="w-full accent-primary"
                  aria-label="Volume dos efeitos sonoros"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-body text-sm font-bold text-foreground">Volume da voz</span>
                  <span className="font-body text-xs text-muted-foreground">{Math.round(audioSettings.voiceVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(audioSettings.voiceVolume * 100)}
                  onChange={(event) => updateAudio({ voiceVolume: Number(event.target.value) / 100 })}
                  className="w-full accent-primary"
                  aria-label="Volume da voz"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                <div className="min-w-0">
                  <p className="font-body text-sm font-bold text-foreground">Narração da Corujinha</p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">Falas, dicas e pronúncias em português.</p>
                </div>
                <Switch
                  checked={audioSettings.voiceEnabled}
                  onCheckedChange={(checked) => updateAudio({ voiceEnabled: checked })}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={!audioSettings.voiceEnabled || audioSettings.voiceVolume <= 0}
                onClick={() => {
                  playClickSound();
                  previewVoice();
                }}
                className="w-full rounded-2xl gap-2 font-body font-bold"
              >
                <Mic2 className="w-4 h-4" />
                Ouvir voz da Corujinha
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Fonte Amigável para Dislexia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm text-muted-foreground">
                  Usa uma fonte mais legível com espaçamento maior
                </p>
                <Switch checked={settings.dyslexiaFont} onCheckedChange={toggleDyslexiaFont} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Alto Contraste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm text-muted-foreground">
                  Aumenta o contraste das cores para melhor visibilidade
                </p>
                <Switch checked={settings.highContrast} onCheckedChange={toggleHighContrast} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-primary" />
                Tamanho do Texto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: 'sm', label: 'Pequeno' },
                  { size: 'md', label: 'Médio' },
                  { size: 'lg', label: 'Grande' },
                ].map(opt => (
                  <button
                    key={opt.size}
                    onClick={() => setTextSize(opt.size)}
                    className={`py-3 rounded-2xl border-2 font-body font-bold text-sm transition-all flex items-center justify-center gap-1
                      ${settings.textSize === opt.size
                        ? 'border-primary bg-primary/10 text-primary shadow-md'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'}`}
                  >
                    {opt.label}
                    {settings.textSize === opt.size && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {activePlatformProvider === 'supabase' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Conta de aprendizagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-body text-sm text-muted-foreground">
                  Seu progresso fica protegido pela sessão desta conta neste dispositivo.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full rounded-2xl gap-2 font-body font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <p className="font-body text-xs text-muted-foreground text-center pt-4">
          As configurações são salvas automaticamente neste dispositivo 💾
        </p>
      </div>
    </div>
  );
}
