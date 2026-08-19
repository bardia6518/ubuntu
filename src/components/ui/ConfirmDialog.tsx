import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تایید حذف',
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertTriangle size={22} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-ink-500 dark:text-ink-400">{description}</p>
        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'در حال حذف...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
