export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('fa-IR');
}

export function formatCurrency(value: number, unit = 'تومان'): string {
  return `${formatNumber(value)} ${unit}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatShortDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}
