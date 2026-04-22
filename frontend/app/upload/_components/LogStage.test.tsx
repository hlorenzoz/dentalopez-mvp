import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LogStage } from './LogStage';
import type { StageState } from '../../types';

function makeStage(overrides: Partial<StageState> = {}): StageState {
  return { name: 'parse', status: 'pending', logs: [], ...overrides };
}

describe('LogStage', () => {
  it('shows circle icon for pending status', () => {
    render(<LogStage stage={makeStage({ status: 'pending' })} />);
    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('shows spinning icon for running status', () => {
    render(<LogStage stage={makeStage({ status: 'running' })} />);
    expect(screen.getByText('⟳')).toBeInTheDocument();
  });

  it('shows green checkmark for complete status', () => {
    render(<LogStage stage={makeStage({ status: 'complete', latencyMs: 1234 })} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('1234ms')).toBeInTheDocument();
  });

  it('shows red x for error status', () => {
    render(<LogStage stage={makeStage({ status: 'error', errorMessage: 'API error' })} />);
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('expands body on click when complete with logs', () => {
    const stage = makeStage({
      status: 'complete',
      logs: [{ type: 'stage_log', message: 'Parsing file...', timestamp: new Date().toISOString() }],
    });
    render(<LogStage stage={stage} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Parsing file...')).toBeInTheDocument();
  });

  it('shows error message when error stage is expanded', () => {
    const stage = makeStage({ status: 'error', errorMessage: 'Connection refused' });
    render(<LogStage stage={stage} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });
});
