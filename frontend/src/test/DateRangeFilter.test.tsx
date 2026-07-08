import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DateRangeFilter from '../components/DateRangeFilter';

describe('DateRangeFilter', () => {
  it('renders all three options', () => {
    render(<DateRangeFilter selected={30} onChange={() => {}} />);
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('90 Days')).toBeInTheDocument();
  });

  it('calls onChange with correct value when clicked', async () => {
    const onChange = vi.fn();
    render(<DateRangeFilter selected={30} onChange={onChange} />);

    await userEvent.click(screen.getByText('7 Days'));
    expect(onChange).toHaveBeenCalledWith(7);

    await userEvent.click(screen.getByText('90 Days'));
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('highlights the selected option', () => {
    render(<DateRangeFilter selected={7} onChange={() => {}} />);
    const sevenDayBtn = screen.getByText('7 Days');
    expect(sevenDayBtn).toHaveStyle({ fontWeight: 'bold' });
  });
});