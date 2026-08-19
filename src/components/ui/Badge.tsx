import { ReactNode } from 'react';

type Color = 'green' | 'amber' | 'rose' | 'slate' | 'sky';

const colorClasses: Record<Color, string> = {
  green: 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  slate: 'bg-ink-100 text-ink-600 ring-ink-500/20 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-500/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
};

export function Badge({ color = 'slate', children }: { color?: Color; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}

const customerStatusMap: Record<string, { label: string; color: Color }> = {
  active: { label: 'فعال', color: 'green' },
  pending: { label: 'در انتظار', color: 'amber' },
  completed: { label: 'تکمیل شده', color: 'slate' },
};

const invoiceStatusMap: Record<string, { label: string; color: Color }> = {
  draft: { label: 'پیش‌نویس', color: 'slate' },
  unpaid: { label: 'در انتظار پرداخت', color: 'amber' },
  partial: { label: 'پرداخت جزئی', color: 'sky' },
  paid: { label: 'پرداخت شده', color: 'green' },
  overdue: { label: 'سررسید گذشته', color: 'rose' },
  cancelled: { label: 'لغو شده', color: 'slate' },
  overpaid: { label: 'پرداخت اضافی', color: 'sky' },
};

const projectExecutionMap: Record<string, { label: string; color: Color }> = {
  not_started: { label: 'شروع نشده', color: 'slate' },
  in_progress: { label: 'در حال انجام', color: 'sky' },
  delivered: { label: 'تحویل شده', color: 'green' },
  completed: { label: 'تکمیل شده', color: 'green' },
  on_hold: { label: 'متوقف', color: 'amber' },
  cancelled: { label: 'لغو شده', color: 'rose' },
};

const projectFinancialMap: Record<string, { label: string; color: Color }> = {
  no_contract: { label: 'بدون قرارداد', color: 'slate' },
  contracted: { label: 'قرارداد بسته شده', color: 'sky' },
  invoicing: { label: 'در حال فاکتور کردن', color: 'amber' },
  partial_received: { label: 'دریافت جزئی', color: 'sky' },
  fully_received: { label: 'تسویه شده', color: 'green' },
  overdue: { label: 'سررسید گذشته', color: 'rose' },
};

const receiptStatusMap: Record<string, { label: string; color: Color }> = {
  pending: { label: 'در انتظار تأیید', color: 'amber' },
  confirmed: { label: 'تأیید شده', color: 'green' },
  reversed: { label: 'برگشت‌خورده', color: 'rose' },
};

const expenseStatusMap: Record<string, { label: string; color: Color }> = {
  pending: { label: 'در انتظار بررسی', color: 'amber' },
  approved: { label: 'تأیید شده', color: 'green' },
  rejected: { label: 'رد شده', color: 'rose' },
};

const contractorBillStatusMap: Record<string, { label: string; color: Color }> = {
  pending: { label: 'در انتظار', color: 'amber' },
  approved: { label: 'تأیید شده', color: 'sky' },
  paid: { label: 'پرداخت شده', color: 'green' },
  rejected: { label: 'رد شده', color: 'rose' },
};

const installmentStatusMap: Record<string, { label: string; color: Color }> = {
  pending: { label: 'در انتظار', color: 'amber' },
  invoiced: { label: 'فاکتور شده', color: 'sky' },
  paid: { label: 'پرداخت شده', color: 'green' },
  overdue: { label: 'سررسید گذشته', color: 'rose' },
};

const eventStatusMap: Record<string, { label: string; color: Color }> = {
  upcoming: { label: 'پیش‌رو', color: 'sky' },
  completed: { label: 'انجام شده', color: 'green' },
  overdue: { label: 'سررسید گذشته', color: 'rose' },
};

const teamStatusMap: Record<string, { label: string; color: Color }> = {
  active: { label: 'فعال', color: 'green' },
  invited: { label: 'دعوت شده', color: 'amber' },
};

const roleMap: Record<string, { label: string; color: Color }> = {
  admin: { label: 'مدیر مالی', color: 'sky' },
  accountant: { label: 'حسابدار', color: 'green' },
  viewer: { label: 'مشاهده‌گر', color: 'slate' },
};

function mappedBadge(map: Record<string, { label: string; color: Color }>, key: string) {
  const entry = map[key] ?? { label: key, color: 'slate' as Color };
  return <Badge color={entry.color}>{entry.label}</Badge>;
}

export const CustomerStatusBadge = ({ status }: { status: string }) => mappedBadge(customerStatusMap, status);
export const InvoiceStatusBadge = ({ status }: { status: string }) => mappedBadge(invoiceStatusMap, status);
export const EventStatusBadge = ({ status }: { status: string }) => mappedBadge(eventStatusMap, status);
export const TeamStatusBadge = ({ status }: { status: string }) => mappedBadge(teamStatusMap, status);
export const RoleBadge = ({ role }: { role: string }) => mappedBadge(roleMap, role);
export const ProjectExecutionBadge = ({ status }: { status: string }) => mappedBadge(projectExecutionMap, status);
export const ProjectFinancialBadge = ({ status }: { status: string }) => mappedBadge(projectFinancialMap, status);
export const ReceiptStatusBadge = ({ status }: { status: string }) => mappedBadge(receiptStatusMap, status);
export const ExpenseStatusBadge = ({ status }: { status: string }) => mappedBadge(expenseStatusMap, status);
export const ContractorBillStatusBadge = ({ status }: { status: string }) => mappedBadge(contractorBillStatusMap, status);
export const InstallmentStatusBadge = ({ status }: { status: string }) => mappedBadge(installmentStatusMap, status);
