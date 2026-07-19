import { useState } from 'react';
import keycloak from '../keycloak';

interface Props {
  chartData: any[];
}

export default function AiInsights({ chartData }: Props) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({ chartData }),
      });
      if (!res.ok) throw new Error('Failed to generate insights');
      const data = await res.json();
      setInsights(data.insights);
      setGenerated(true);
    } catch (err) {
      setError('Could not generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      borderLeft: '4px solid #8B5CF6',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, color: '#0A1628', fontSize: '16px' }}>
          🤖 AI Health Coach
        </h3>
        {!generated && (
          <button
            onClick={generateInsights}
            disabled={loading}
            style={{
              padding: '8px 20px',
              backgroundColor: loading ? '#94A3B8' : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {loading ? '✨ Analysing...' : '✨ Generate Insights'}
          </button>
        )}
        {generated && (
          <button
            onClick={() => { setGenerated(false); setInsights(null); }}
            style={{
              padding: '6px 14px',
              backgroundColor: 'transparent',
              color: '#8B5CF6',
              border: '1px solid #8B5CF6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Not yet generated */}
      {!generated && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          backgroundColor: '#F5F3FF',
          borderRadius: '8px',
          color: '#6D28D9',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Click "Generate Insights" to get personalised AI analysis of your health trends
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          backgroundColor: '#F5F3FF',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧠</div>
          <p style={{ color: '#6D28D9', margin: 0, fontSize: '14px' }}>
            Analysing your health patterns...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ color: '#EF4444', fontSize: '13px' }}>{error}</div>
      )}

      {/* Insights */}
      {insights && (
        <div style={{
          backgroundColor: '#F5F3FF',
          borderRadius: '8px',
          padding: '16px 20px',
          fontSize: '14px',
          lineHeight: '1.7',
          color: '#1E1B4B',
          whiteSpace: 'pre-wrap',
        }}>
          {insights}
        </div>
      )}
    </div>
  );
}