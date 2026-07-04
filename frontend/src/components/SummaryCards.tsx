interface SummaryData {
  avgSleepHours: number | null;
  avgHrv: number | null;
  avgRestingHr: number | null;
  avgSteps: number | null;
}

interface Props {
  data: SummaryData;
}

const cards = [
  { key: 'avgSleepHours', label: 'Avg Sleep',      unit: 'hrs',  icon: '😴', color: '#6366F1' },
  { key: 'avgHrv',        label: 'Avg HRV',         unit: 'ms',   icon: '💚', color: '#10B981' },
  { key: 'avgRestingHr',  label: 'Avg Resting HR',  unit: 'bpm',  icon: '❤️', color: '#EF4444' },
  { key: 'avgSteps',      label: 'Avg Steps',        unit: 'steps',icon: '🏃', color: '#F59E0B' },
];

export default function SummaryCards({ data }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    }}>
      {cards.map(card => {
        const value = data[card.key as keyof SummaryData];
        return (
          <div
            key={card.key}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0A1628' }}>
              {value !== null ? value.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              {card.unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}