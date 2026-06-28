import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreatePanel } from './CreatePanel';
import { createSession } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  createSession: vi.fn(),
  storeJoinToken: vi.fn(),
}));

describe('CreatePanel', () => {
  it('renders name input and public access by default', () => {
    render(
      <MemoryRouter>
        <CreatePanel />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText('How others will see you')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'public' })).toHaveClass('shadow-ambient');
    expect(screen.queryByPlaceholderText('Enter passcode')).not.toBeInTheDocument();
  });

  it('shows password field when private access is selected', () => {
    render(
      <MemoryRouter>
        <CreatePanel />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'private' }));

    expect(screen.getByPlaceholderText('Enter passcode')).toBeInTheDocument();
  });

  it('does not submit without a display name', () => {
    render(
      <MemoryRouter>
        <CreatePanel />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Session →' }));

    expect(createSession).not.toHaveBeenCalled();
  });

  it('submits display name with session options', () => {
    vi.mocked(createSession).mockResolvedValue({
      roomId: 'room123',
      joinUrl: '/r/room123',
      expiresAt: new Date().toISOString(),
      isProtected: false,
      joinToken: 'token',
      peerId: 'peer1',
      displayName: 'Alex',
    });

    render(
      <MemoryRouter>
        <CreatePanel />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('How others will see you'), {
      target: { value: 'Alex' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start Session →' }));

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Alex',
        access: 'public',
      }),
    );
  });
});
