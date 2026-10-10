// src/components/layout/CockpitShell.tsx

import React from 'react';

export interface CockpitShellProps {
  header: React.ReactNode;
  mainPanel: React.ReactNode;
  subPanel: React.ReactNode;
  isMaximized: boolean;
}

export const CockpitShell: React.FC<CockpitShellProps> = ({
  header,
  mainPanel,
  subPanel,
  isMaximized,
}) => {
  return (
    <div className="cockpit-shell" data-testid="cockpit-shell">
      {header}

      <main className="main-viewport" data-testid="main-viewport">
        {/* Main Panel: 60% (or 100% when maximized) */}
        <section
          className={`main-panel ${isMaximized ? 'maximized' : ''}`}
          data-testid="main-panel"
        >
          {mainPanel}
        </section>

        {/* Sub Panel: 40% (hidden when maximized) */}
        <aside
          className={`sub-panel ${isMaximized ? 'hidden' : ''}`}
          data-testid="sub-panel"
        >
          {subPanel}
        </aside>
      </main>
    </div>
  );
};
