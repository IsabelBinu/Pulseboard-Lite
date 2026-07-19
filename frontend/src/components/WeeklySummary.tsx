import { useState, useEffect } from 'react';
import keycloak from '../keycloak';

export default function WeeklySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/ai/weekly-summary', {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setSummary(data.summary);
        setWeekStart(data.weekStart);
        setCached(data.cached);
      } catch (err) {
        console.error('Weekly summary error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return null;
  if (!summary) return null;

  const formatWeekStart = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      borderLeft: '4px solid #10B981',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#0A1628', fontSize: '16px' }}>
            📝 Weekly Summary
          </h3>
          {weekStart && (
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              Week of {formatWeekStart(weekStart)}
              {cached && ' · Cached'}
            </div>
          )}
        </div>
        <span style={{
          fontSize: '11px',
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          padding: '3px 10px',
          borderRadius: '10px',
          fontWeight: '600',
        }}>
          AI Generated
        </span>
      </div>

      {/* Summary text */}
      <div style={{
        backgroundColor: '#F0FDF4',
        borderRadius: '8px',
        padding: '16px 20px',
        fontSize: '14px',
        lineHeight: '1.75',
        color: '#064E3B',
        whiteSpace: 'pre-wrap',
      }}>
        {summary}
      </div>
    </div>
  );
}