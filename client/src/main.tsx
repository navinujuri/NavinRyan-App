import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { Login } from './pages/Login';
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

/** Gate: show a splash while checking auth, then Login or the app. */
function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <Splash />;
  if (status === 'anon') return <Login />;
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
