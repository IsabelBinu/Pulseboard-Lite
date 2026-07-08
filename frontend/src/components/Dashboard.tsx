import { useState, useEffect } from 'react';
import keycloak from '../keycloak';
import SummaryCards from './SummaryCards';
import DateRangeFilter from './DateRangeFilter';
import SleepChart from './SleepChart';
import HrvChart from './HrvChart';
import RestingHrChart from './RestingHrChart';
import ActivityChart from './ActivityChart';
import RecoveryScore from './RecoveryScore';

interface DashboardData {
  empty: boolean;
  summaryCards?: {
    avgSleepHours: number | null;
    avgHrv: number | null;
    avgRestingHr: number | null;
    avgSteps: number | null;
  };
  chartData?: any[];
  recoveryScore?: any;  
  totalRecords?: number;
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3001/api/dashboard?days=${selectedDays}`,
        {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(days);
  }, [days]);

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
  };

  // ── Loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
        Loading your health data...
      </div>
    );
  }

  // ── Error state
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#EF4444' }}>
        {error}
      </div>
    );
  }

  // ── Empty state
  if (!data || data.empty) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h2 style={{ color: '#0A1628', marginBottom: '8px' }}>No data yet</h2>
        <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
          Upload a CSV file to see your health trends here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0A1628' }}>Health Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
            {data.totalRecords} records in the last {days} days
          </p>
        </div>
        <DateRangeFilter selected={days} onChange={handleDaysChange} />
      </div>

      {/* Summary Cards */}
      {data.summaryCards && <SummaryCards data={data.summaryCards} />}
	  
	  {data.recoveryScore && <RecoveryScore data={data.recoveryScore} />}

      {/* Charts */}
      {data.chartData && (
        <>
          <SleepChart data={data.chartData} />
          <HrvChart data={data.chartData} />
          <RestingHrChart data={data.chartData} />
          <ActivityChart data={data.chartData} />
        </>
      )}
    </div>
  );
}