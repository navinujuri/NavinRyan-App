import type { ReactNode } from 'react';
import { IconFlame } from '../components/ui/icons';

/** Shared centered layout + branding for the Login / Register screens. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-grad shadow-glow">
            <IconFlame className="text-white" width={30} height={30} />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-fg">Ryan Reynolds Physique Tracker</h1>
          <p className="mt-1 text-sm text-fg-faint">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
