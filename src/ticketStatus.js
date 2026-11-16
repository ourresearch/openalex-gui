// Support-request status display (oxjob #823), shared by the My Tickets list
// and detail views. Zendesk's statuses are agent vocabulary; these are the
// user-facing translations. "hold" is an internal distinction agents make —
// to the user it's just open.
//
// oxjob #1499: the desk parks tickets in custom statuses whose base status is
// "pending" (Fix in backlog, Feature request) though the next step is ours.
// The users API now sends the custom status's own requester label
// (`status_label`, worded in Zendesk admin) and whether the requester has
// anything to do (`awaiting_requester`). Both win when present; the maps below
// are the fallback for an older API response.

const STATUS_LABELS = {
  new: 'Received',
  open: 'Open',
  pending: 'Awaiting your reply',
  hold: 'Open',
  solved: 'Solved',
  closed: 'Closed',
};

const STATUS_COLORS = {
  new: 'primary',
  open: 'primary',
  pending: 'warning',
  hold: 'primary',
  solved: 'success',
  closed: 'grey',
};

// Accepts a ticket object (preferred) or a bare status string.
function asTicket(ticketOrStatus) {
  if (ticketOrStatus && typeof ticketOrStatus === 'object') return ticketOrStatus;
  return { status: ticketOrStatus };
}

function baseStatus(ticket) {
  return (ticket.status || '').toLowerCase();
}

// True only when the requester has something to do (plain Pending).
export function ticketAwaitsRequester(ticketOrStatus) {
  const ticket = asTicket(ticketOrStatus);
  return ticket.awaiting_requester ?? baseStatus(ticket) === 'pending';
}

export function ticketStatusLabel(ticketOrStatus) {
  const ticket = asTicket(ticketOrStatus);
  return ticket.status_label || STATUS_LABELS[baseStatus(ticket)] || 'Open';
}

export function ticketStatusColor(ticketOrStatus) {
  const ticket = asTicket(ticketOrStatus);
  const status = baseStatus(ticket);
  // A pending ticket that waits on us (Fix scheduled, Under consideration)
  // isn't the requester's move, so it doesn't get the "your move" colour.
  if (status === 'pending') {
    return ticketAwaitsRequester(ticket) ? 'warning' : 'primary';
  }
  return STATUS_COLORS[status] || 'primary';
}
