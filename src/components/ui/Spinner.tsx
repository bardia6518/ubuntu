import { Loader2 } from 'lucide-react';

export function Spinner({ label = 'در حال بارگذاری...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <Loader2 size={26} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
