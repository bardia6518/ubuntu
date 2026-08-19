import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';

export interface Resource<T extends { id: string }> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  insert: (values: Partial<T>) => Promise<T>;
  update: (id: string, values: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function TableToolbar({ query, setQuery, placeholder, actionLabel, onAction }: { query: string; setQuery: (s: string) => void; placeholder: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-100 bg-ink-50/50 p-4 dark:border-ink-800 dark:bg-ink-800/30 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-ink-200 bg-white pr-9 pl-3 text-sm outline-none focus:border-primary-400 dark:border-ink-700 dark:bg-ink-900 dark:text-white" />
      </div>
      <Button size="sm" onClick={onAction}><Plus size={15} />{actionLabel}</Button>
    </div>
  );
}

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={onEdit} className="rounded-lg p-2 text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10" title="ویرایش"><Pencil size={15} /></button>
      {onDelete && <button onClick={onDelete} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="حذف"><Trash2 size={15} /></button>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action, onClick }: { title: string; subtitle: string; action?: string; onClick?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
      <div>
        <h2 className="font-semibold text-ink-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs text-ink-400">{subtitle}</p>
      </div>
      {action && <button onClick={onClick} className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"><span>{action}</span><ChevronLeft size={14} /></button>}
    </div>
  );
}
