import React, { useState } from 'react';
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

type AppView = 'landing' | 'login' | 'onboarding' | 'app';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [activePage, setActivePage] = useState('dashboard');

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
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}>
          {renderPage()}
        </main>
      </div>
    </LiveDataProvider>
  );
};

export default App;
