import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { activePlatformProvider } from '@/platform';

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import PlayGame from './pages/PlayGame';
import PlaySyllables from './pages/PlaySyllables';
import PlaySentences from './pages/PlaySentences';
import PracticeHub from './pages/PracticeHub';
import ParentDashboard from './pages/ParentDashboard';
import Profile from './pages/Profile';
import WorldMap from './pages/WorldMap';
import SpeedChallenge from './pages/SpeedChallenge';
import StoryMode from './pages/StoryMode';
import Settings from './pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const isPublicSupabaseWelcome = activePlatformProvider === 'supabase' && location.pathname === '/';

  if (location.pathname === '/login') {
    return <Login />;
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="font-display text-xl text-primary animate-pulse">Lexia Game</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'auth_required' && !isPublicSupabaseWelcome) {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/play" element={<PlayGame />} />
      <Route path="/play-syllables" element={<PlaySyllables />} />
      <Route path="/play-sentences" element={<PlaySentences />} />
      <Route path="/practice" element={<PracticeHub />} />
      <Route path="/parent" element={<ParentDashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/world" element={<WorldMap />} />
      <Route path="/speed-challenge" element={<SpeedChallenge />} />
      <Route path="/story" element={<StoryMode />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
