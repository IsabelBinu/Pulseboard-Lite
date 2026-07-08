interface RecoveryData {
  score: number;
  recommendation: string;
  confidence: string;
  explanation: string;
  breakdown: {
    hrvScore: number;
    sleepScore: number;
    restingHrScore: number;
  };
}

interface Props {
  data: RecoveryData;
}

// Score colour — red → amber → green
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // green
  if (score >= 60) return '#F59E0B'; // amber
  if (score >= 40) return '#F97316'; // orange
  return '#EF4444';                  // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
}

export default function RecoveryScore({ data }: Props) {
  const color = getScoreColor(data.score);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      borderLeft: `4px solid ${color}`,
    }}>
      {/* Header */}
      <h3 style={{ margin: '0 0 20px', color: '#0A1628', fontSize: '16px' }}>
        🔋 Recovery Score
      </h3>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

        {/* Score circle */}
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `6px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
          }}>
            <span style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color,
            }}>
              {data.score}
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>/ 100</span>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color,
          }}>
            {getScoreLabel(data.score)}
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: '200px' }}>

          {/* Recommendation */}
          <div style={{
            backgroundColor: `${color}15`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <div style={{
              fontSize: '11px',
              color: '#94A3B8',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Recommendation
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#0A1628',
            }}>
              {data.recommendation}
            </div>
          </div>

          {/* Confidence + Explanation */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>
                Confidence
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: data.confidence === 'High' ? '#10B981'
                  : data.confidence === 'Medium' ? '#F59E0B'
                  : '#EF4444',
              }}>
                {data.confidence}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>
                Formula
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                {data.explanation}
              </div>
            </div>
          </div>

          {/* Score breakdown bars */}
          {data.breakdown && (
            <div>
              <div style={{
                fontSize: '11px',
                color: '#94A3B8',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}>
                Breakdown
              </div>
              {[
                { label: 'HRV',        value: data.breakdown.hrvScore,       color: '#10B981' },
                { label: 'Sleep',      value: data.breakdown.sleepScore,     color: '#6366F1' },
                { label: 'Resting HR', value: data.breakdown.restingHrScore, color: '#EF4444' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '6px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '2px',
                  }}>
                    <span style={{ fontSize: '12px', color: '#475569' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#475569' }}>
                      {item.value}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    height: '6px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}