import { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900 ${className}`}
      {...props}
    />
  );
}
