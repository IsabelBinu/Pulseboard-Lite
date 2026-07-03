import keycloak from './keycloak';
import CsvUpload from './components/CsvUpload';

function App() {
  return (
    <div>
      <header style={{
        backgroundColor: '#0A1628',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>PulseBoard Lite</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>👤 {keycloak.tokenParsed?.preferred_username}</span>
          <button
            onClick={() => keycloak.logout()}
            style={{
              padding: '6px 14px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '24px' }}>
        <CsvUpload />
      </main>
    </div>
  );
}

export default App;