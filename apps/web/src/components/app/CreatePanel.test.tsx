import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreatePanel } from './CreatePanel';

vi.mock('@/lib/api', () => ({
  createSession: vi.fn(),
  storeJoinToken: vi.fn(),
}));

describe('CreatePanel', () => {
  it('shows password field when protected is toggled', () => {
    render(
      <MemoryRouter>
        <CreatePanel />
      </MemoryRouter>,
    );

    expect(screen.queryByPlaceholderText('Enter passcode')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'private' });
    fireEvent.click(toggle);

    expect(screen.getByPlaceholderText('Enter passcode')).toBeInTheDocument();
  });
});
