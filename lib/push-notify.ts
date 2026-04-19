/**
 * Send a push notification to a user via the /api/push-notify endpoint.
 * Fire-and-forget — never throws or blocks the UI.
 */
export function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  fetch('/api/push-notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, title, body, data }),
  }).catch(() => {});
}
