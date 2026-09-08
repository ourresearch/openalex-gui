// Support-request status display (oxjob #823), shared by the My Tickets list
// and detail views. Zendesk's statuses are agent vocabulary; these are the
// user-facing translations. "hold" is an internal distinction agents make —
// to the user it's just open.

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

export function ticketStatusLabel(status) {
  return STATUS_LABELS[(status || '').toLowerCase()] || 'Open';
}

export function ticketStatusColor(status) {
  return STATUS_COLORS[(status || '').toLowerCase()] || 'primary';
}
