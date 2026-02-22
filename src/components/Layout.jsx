import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <nav className="navbar">
        <div className="container navbar-content">
          <div className="brand">
            <span role="img" aria-label="leaf">🌿</span> Meal Planner
          </div>
        </div>
      </nav>

      <main className="container main-content fade-in">
        {children}
      </main>

      <footer className="footer">
        <p>© 2026 Meal Planner • Built for Home</p>
      </footer>

      <style>{`
        .layout-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
        }

        .navbar-content {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: var(--spacing-sm);
          padding-bottom: var(--spacing-sm);
        }

        .brand {
          font-size: var(--font-size-lg);
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .main-content {
          flex: 1;
          padding-top: var(--spacing-xl);
        }

        .footer {
          text-align: center;
          padding: var(--spacing-lg);
          color: var(--text-muted);
          font-size: 0.875rem;
          border-top: 1px solid var(--border-color);
          margin-top: var(--spacing-xl);
          background: transparent;
        }
        
        .btn-sm {
           padding: var(--spacing-xs) var(--spacing-md);
           font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default Layout;
