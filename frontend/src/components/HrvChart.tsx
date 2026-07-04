import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

interface Props {
  data: { date: string; hrvMs: number | null }[];
}

export default function HrvChart({ data }: Props) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
    }}>
      <h3 style={{ margin: '0 0 16px', color: '#0A1628', fontSize: '16px' }}>
        💚 HRV Trend
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={d => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            unit=" ms"
          />
          <Tooltip
            formatter={(value: any) => [`${value} ms`, 'HRV']}
            labelStyle={{ color: '#0A1628' }}
          />
          <Line
            type="monotone"
            dataKey="hrvMs"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}