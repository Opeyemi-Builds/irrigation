import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Irrigation from './pages/Irrigation';
import Weather from './pages/Weather';
import AIAdvisorPage from './pages/AIAdvisorPage';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import { LiveDataProvider } from './hooks/useLiveData';
import { useIsMobile } from './hooks/useIsMobile';
import { supabase, signOut } from './lib/auth';

type AppView = 'landing' | 'login' | 'onboarding' | 'app';

const App: React.FC = () => {
  const isMobile = useIsMobile();
  const [view, setView] = useState<AppView>('landing');
  const [activePage, setActivePage] = useState('dashboard');

  // Restore an existing Supabase session so returning, signed-in users land
  // straight in the app. (The demo login has no session, so it never auto-enters.)
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setView('app');
    });
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setActivePage('dashboard');
    setView('landing');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <Dashboard />;
      case 'sensors':    return <Sensors />;
      case 'irrigation': return <Irrigation />;
      case 'weather':    return <Weather />;
      case 'ai-advisor': return <AIAdvisorPage />;
      default:           return <Dashboard />;
    }
  };

  if (view === 'landing') {
    return (
      <Landing
        onGetStarted={() => setView('onboarding')}
        onLogin={() => setView('login')}
      />
    );
  }

  if (view === 'login') {
    return (
      <Login
        onLogin={() => setView('app')}
        onBack={() => setView('landing')}
        onSignUp={() => setView('onboarding')}
      />
    );
  }

  if (view === 'onboarding') {
    return (
      <Onboarding
        onComplete={() => setView('app')}
        onBack={() => setView('landing')}
      />
    );
  }

  return (
    <LiveDataProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)', paddingTop: isMobile ? 'calc(56px + env(safe-area-inset-top))' : 0, paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0 }}>
          {renderPage()}
        </main>
      </div>
    </LiveDataProvider>
  );
};

export default App;
