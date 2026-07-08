import { useState } from 'react';
import keycloak from './keycloak';
import Dashboard from './components/Dashboard';
import CsvUpload from './components/CsvUpload';
import UploadHistory from './components/UploadHistory';
import { useWindowWidth } from './hooks/useWindowWidth';

type View = 'dashboard' | 'upload' | 'history';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const width = useWindowWidth();
  const isMobile = width < 768;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F9FF' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#0A1628',
        color: 'white',
        padding: isMobile ? '0 12px' : '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: isMobile ? '56px' : '60px',
        flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? '16px' : '20px',
          color: 'white',
        }}>
          💓 {isMobile ? 'PulseBoard' : 'PulseBoard Lite'}
        </h1>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: isMobile ? '4px' : '8px' }}>
          {(['dashboard', 'upload', 'history'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: isMobile ? '4px 10px' : '6px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: view === v ? '#0891B2' : 'transparent',
                color: 'white',
                fontWeight: view === v ? 'bold' : 'normal',
                fontSize: isMobile ? '12px' : '14px',
                textTransform: 'capitalize',
              }}
            >
              {v === 'upload' ? (isMobile ? 'Upload' : 'Upload Data')
               : v === 'history' ? 'History'
               : 'Dashboard'}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '12px',
        }}>
          {!isMobile && (
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              👤 {keycloak.tokenParsed?.preferred_username}
            </span>
          )}
          <button
            onClick={() => keycloak.logout()}
            style={{
              padding: isMobile ? '4px 10px' : '6px 14px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: isMobile ? '16px 12px' : '32px 24px',
      }}>
        {view === 'dashboard' && <Dashboard />}
        {view === 'upload'    && <CsvUpload />}
        {view === 'history'   && <UploadHistory />}
      </main>
    </div>
  );
}

export default App;