import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 px-6 py-14 text-center dark:border-ink-700">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
