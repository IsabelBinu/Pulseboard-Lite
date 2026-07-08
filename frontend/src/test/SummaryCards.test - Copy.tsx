import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SummaryCards from '../components/SummaryCards';

describe('SummaryCards', () => {
  const mockData = {
    avgSleepHours: 7.4,
    avgHrv: 58,
    avgRestingHr: 54,
    avgSteps: 9210,
  };

  it('renders all four metric cards', () => {
    render(<SummaryCards data={mockData} />);
    expect(screen.getByText('Avg Sleep')).toBeInTheDocument();
    expect(screen.getByText('Avg HRV')).toBeInTheDocument();
    expect(screen.getByText('Avg Resting HR')).toBeInTheDocument();
    expect(screen.getByText('Avg Steps')).toBeInTheDocument();
  });

  it('displays correct values', () => {
    render(<SummaryCards data={mockData} />);
    expect(screen.getByText('7.4')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('9,210')).toBeInTheDocument();
  });

  it('shows dash when value is null', () => {
    render(<SummaryCards data={{
      avgSleepHours: null,
      avgHrv: null,
      avgRestingHr: null,
      avgSteps: null,
    }} />);
    const dashes = screen.getAllByText('—');
    expect(dashes).toHaveLength(4);
  });

  it('displays correct units', () => {
    render(<SummaryCards data={mockData} />);
    expect(screen.getByText('hrs')).toBeInTheDocument();
    expect(screen.getByText('ms')).toBeInTheDocument();
    expect(screen.getByText('bpm')).toBeInTheDocument();
    expect(screen.getByText('steps')).toBeInTheDocument();
  });
});