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
import Tour, { TourStep } from './components/Tour';
import { LiveDataProvider } from './hooks/useLiveData';
import { useIsMobile } from './hooks/useIsMobile';
import { supabase, signOut, hasAppSession, getSessionEmail, DEMO_EMAIL } from './lib/auth';
import { getFarmProfile, hydrateFarmProfileFromCloud } from './lib/farm';

type AppView = 'landing' | 'login' | 'onboarding' | 'app';

// One-time guided tour shown on the dashboard right after a user sets up their
// farm. Steps that point at an element are skipped automatically when that
// element isn't on screen (e.g. the nav lives in a drawer on mobile).
const TOUR_STEPS: TourStep[] = [
  {
    mascot: true,
    title: 'Welcome to AgroSense!',
    body: "I'm Sprout, your farm advisor. Here's a quick 20-second tour of your new dashboard — skip it any time.",
  },
  {
    selector: '[data-tour="nav"]',
    title: 'Get around',
    body: 'Jump between your dashboard, sensors, irrigation, weather and the full AI advisor from here.',
  },
  {
    selector: '[data-tour="farm"]',
    title: 'Your farm',
    body: 'This is the farm and crops you just set up. Head to Irrigation to open your field and add more crops.',
  },
  {
    selector: '[data-tour="sensors"]',
    title: 'Live readings',
    body: 'Temperature, humidity and soil moisture stream straight from your device — each scored against a healthy range.',
  },
  {
    selector: '[data-tour="pump"]',
    title: 'Your pump',
    body: 'Leave it on Auto to water from live soil moisture, or take manual control whenever you like.',
  },
  {
    selector: '[data-tour="advisor"]',
    title: 'Ask me anything',
    body: 'I read your live sensors and crops to answer questions and tell you exactly when — and how much — to water.',
  },
  {
    mascot: true,
    title: "You're all set!",
    body: "That's the tour. Your field is live now — explore around, and tap me whenever you need a hand. 🌱",
  },
];

const App: React.FC = () => {
  const isMobile = useIsMobile();
  // Start in the app if a session was saved locally, so a page reload keeps
  // signed-in users where they were instead of bouncing them to the landing page.
  const [view, setView] = useState<AppView>(() => (hasAppSession() ? 'app' : 'landing'));
  const [activePage, setActivePage] = useState('dashboard');

  // Confirm against Supabase in the background. If a real session exists, stay in
  // the app; the local flag already handles demo and not-yet-confirmed accounts.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setView('app');
    });
    return () => { mounted = false; };
  }, []);

  // Farm profile hydration. On entering the app, pull the cloud copy for this
  // farm's Product ID (the demo login maps to 0001) into localStorage, so the
  // saved setup appears even on a fresh device. Users who already have a local
  // copy render immediately while the sync refreshes in the background.
  const [profileReady, setProfileReady] = useState<boolean>(() => getFarmProfile() !== null);

  useEffect(() => {
    if (view !== 'app') return;
    const email = (getSessionEmail() ?? '').toLowerCase();
    const productId = email === DEMO_EMAIL ? '0001' : getFarmProfile()?.productId ?? null;
    let cancelled = false;
    hydrateFarmProfileFromCloud(productId).finally(() => {
      if (!cancelled) setProfileReady(true);
    });
    return () => { cancelled = true; };
  }, [view]);

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

  if (!profileReady) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: '26px', height: '26px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
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
      <Tour steps={TOUR_STEPS} run={activePage === 'dashboard'} storageKey="agrosense.tourSeen" />
    </LiveDataProvider>
  );
};

export default App;
