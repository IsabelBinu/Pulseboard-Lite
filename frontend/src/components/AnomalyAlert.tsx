import { useState, useEffect } from 'react';
import keycloak from '../keycloak';

interface Anomaly {
  date: string;
  metric: string;
  value: string;
  average: string;
  zScore: number;
  direction: string;
}

export default function AnomalyAlert() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [explanations, setExplanations] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/ai/anomalies', {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setAnomalies(data.anomalies || []);
        setExplanations(data.explanations || '');
      } catch (err) {
        console.error('Anomaly fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  if (loading || anomalies.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      borderLeft: '4px solid #F59E0B',
    }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3 style={{ margin: 0, color: '#0A1628', fontSize: '16px' }}>
          ⚠️ {anomalies.length} Anomaly{anomalies.length > 1 ? 'ies' : ''} Detected
        </h3>
        <span style={{ color: '#94A3B8', fontSize: '13px' }}>
          {expanded ? '▲ Hide' : '▼ Show details'}
        </span>
      </div>

      {/* Anomaly list */}
      {expanded && (
        <div style={{ marginTop: '16px' }}>
          {/* Individual anomaly badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '16px',
          }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
              }}>
                <div style={{ fontWeight: '600', color: '#92400E', marginBottom: '2px' }}>
                  {a.date} — {a.metric}
                </div>
                <div style={{ color: '#78350F' }}>
                  {a.value} ({a.direction} avg of {a.average})
                </div>
              </div>
            ))}
          </div>

          {/* AI Explanations */}
          {explanations && (
            <div style={{
              backgroundColor: '#FFFBEB',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '13px',
              lineHeight: '1.7',
              color: '#451A03',
              whiteSpace: 'pre-wrap',
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#92400E',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}>
                AI Explanation
              </div>
              {explanations}
            </div>
          )}
        </div>
      )}
    </div>
  );
}