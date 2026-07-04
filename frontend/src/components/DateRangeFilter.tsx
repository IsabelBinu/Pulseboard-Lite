interface Props {
  selected: number;
  onChange: (days: number) => void;
}

export default function DateRangeFilter({ selected, onChange }: Props) {
  const options = [
    { label: '7 Days',  value: 7  },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: selected === opt.value ? 'bold' : 'normal',
            backgroundColor: selected === opt.value ? '#0891B2' : '#E2E8F0',
            color: selected === opt.value ? 'white' : '#475569',
            transition: 'all 0.2s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}