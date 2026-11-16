import { describe, it, expect } from 'vitest';
import { ticketStatusLabel, ticketStatusColor, ticketAwaitsRequester } from '@/ticketStatus';

// oxjob #1499: tickets parked on us (Fix in backlog) must not read as the requester's move.
describe('ticketStatus', () => {
  it('shows the desk label for a pending ticket that waits on us', () => {
    const t = { status: 'pending', status_label: 'Fix scheduled', awaiting_requester: false };
    expect(ticketStatusLabel(t)).toBe('Fix scheduled');
    expect(ticketAwaitsRequester(t)).toBe(false);
    expect(ticketStatusColor(t)).toBe('primary');
  });

  it('keeps the your-move colour for plain Pending', () => {
    const t = { status: 'pending', status_label: 'Waiting on your reply', awaiting_requester: true };
    expect(ticketStatusLabel(t)).toBe('Waiting on your reply');
    expect(ticketStatusColor(t)).toBe('warning');
  });

  it('falls back to the base-status map without the new fields', () => {
    expect(ticketStatusLabel({ status: 'pending' })).toBe('Awaiting your reply');
    expect(ticketStatusColor({ status: 'pending' })).toBe('warning');
    expect(ticketStatusLabel('solved')).toBe('Solved');
    expect(ticketStatusLabel({})).toBe('Open');
  });
});
