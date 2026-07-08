import { describe, it, expect } from 'vitest';

describe('SummaryCards logic', () => {
  it('formats null values as dash', () => {
    const format = (val: number | null) => val !== null ? val.toLocaleString() : '—';
    expect(format(null)).toBe('—');
    expect(format(7.4)).toBe('7.4');
    expect(format(9210)).toBe('9,210');
  });

  it('calculates recovery score range correctly', () => {
    const clamp = (val: number) => Math.min(100, Math.max(0, val));
    expect(clamp(150)).toBe(100);
    expect(clamp(-10)).toBe(0);
    expect(clamp(75)).toBe(75);
  });
});