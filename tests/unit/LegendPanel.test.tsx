import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LegendPanel } from '../../src/webview/features/F04/LegendPanel';

describe('LegendPanel', () => {
  it('starts minimized by default in the dependency canvas and can be expanded', () => {
    const onToggleMinimized = vi.fn();

    const { rerender } = render(
      <LegendPanel isMinimized onToggleMinimized={onToggleMinimized} />,
    );

    expect(screen.getByLabelText('dependency.legend_aria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'dependency.legend_toggle_expand' })).toBeInTheDocument();
    expect(screen.queryByText('import')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'dependency.legend_toggle_expand' }));
    expect(onToggleMinimized).toHaveBeenCalledTimes(1);

    rerender(<LegendPanel isMinimized={false} onToggleMinimized={onToggleMinimized} />);
    expect(screen.getByRole('button', { name: 'dependency.legend_toggle_collapse' })).toBeInTheDocument();
    expect(screen.getByText('import')).toBeInTheDocument();
    expect(screen.getByText('require')).toBeInTheDocument();
  });
});
