/**
 * Format a Date as a human-readable date + time string in UTC.
 * Example: "May 1, 2026 at 2:57 AM UTC"
 */
export function formatDateTime(d: Date): string {
  const datePart = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
  return `${datePart} at ${timePart}`;
}
