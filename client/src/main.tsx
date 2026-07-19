import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider, useAuth } from './state/AuthContext';
import { DataProvider } from './state/DataContext';
import { IconFlame } from './components/ui/icons';

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-accent-grad shadow-glow">
        <IconFlame className="text-white" width={28} height={28} />
      </div>
    </div>
  );
}

/** Gate: splash while checking auth, then Login/Register, then the app. */
function Gate() {
  const { status } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (status === 'loading') return <Splash />;
  if (status === 'anon') {
    return mode === 'login' ? (
      <Login onRegister={() => setMode('register')} />
    ) : (
      <Register onLogin={() => setMode('login')} />
    );
  }
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </StrictMode>,
);
