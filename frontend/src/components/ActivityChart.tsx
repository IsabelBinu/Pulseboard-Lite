import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

interface Props {
  data: { date: string; steps: number | null; activeMinutes: number | null }[];
}

export default function ActivityChart({ data }: Props) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
    }}>
      <h3 style={{ margin: '0 0 16px', color: '#0A1628', fontSize: '16px' }}>
        🏃 Activity — Daily Steps
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={d => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
          />
          <Tooltip
            formatter={(value: any) => [`${value.toLocaleString()} steps`, 'Steps']}
            labelStyle={{ color: '#0A1628' }}
          />
          <Bar
            dataKey="steps"
            fill="#F59E0B"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}