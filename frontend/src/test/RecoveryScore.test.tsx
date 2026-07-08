import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecoveryScore from '../components/RecoveryScore';

describe('RecoveryScore', () => {
  const mockData = {
    score: 82,
    recommendation: 'Full training — your body is ready',
    confidence: 'High',
    explanation: 'Based on HRV (50%), Sleep (30%), Resting HR (20%)',
    breakdown: {
      hrvScore: 85,
      sleepScore: 80,
      restingHrScore: 75,
    },
  };

  it('renders the score', () => {
    render(<RecoveryScore data={mockData} />);
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders the recommendation', () => {
    render(<RecoveryScore data={mockData} />);
    expect(
      screen.getByText('Full training — your body is ready')
    ).toBeInTheDocument();
  });

  it('renders confidence level', () => {
    render(<RecoveryScore data={mockData} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders breakdown scores', () => {
    render(<RecoveryScore data={mockData} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });
});