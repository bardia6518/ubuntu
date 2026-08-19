import { FormEvent, useState } from 'react';
import { ArrowDownLeft, Check, CheckCircle2, Plus, Receipt as ReceiptIcon, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExpenseStatusBadge, ReceiptStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField, TextareaField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { RowActions, TableToolbar, type Resource } from '@/components/shared/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { confirmReceiptWithAllocations, reverseReceipt } from '@/lib/finance';
import type { BankAccount, Customer, Expense, ExpenseCategory, Invoice, Receipt } from '@/types';

const receiptTypeOptions = [
  { value: 'invoice_payment', label: 'پرداخت فاکتور' },
  { value: 'prepayment', label: 'پیش‌پرداخت' },
  { value: 'miscellaneous_income', label: 'درآمد متفرقه' },
  { value: 'unidentified', label: 'نامشخص' },
];

export function ExpensesPage({
  expenseResource,
  receiptResource,
  customers,
  categories,
  accounts,
  invoices,
  query,
  setQuery,
  currency,
}: {
  expenseResource: Resource<Expense>;
  receiptResource: Resource<Receipt>;
  customers: Customer[];
  categories: ExpenseCategory[];
  accounts: BankAccount[];
  invoices: Invoice[];
  query: string;
  setQuery: (v: string) => void;
  currency?: string;
}) {
  const [tab, setTab] = useState<'expenses' | 'receipts'>('expenses');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | Receipt | null>(null);
  const [deleting, setDeleting] = useState<Expense | Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Receipt | null>(null);
  const [reverseTarget, setReverseTarget] = useState<Receipt | null>(null);
  const [allocations, setAllocations] = useState<{ invoice_id: string; amount: string }[]>([]);
  const [reverseReason, setReverseReason] = useState('');
  const { showToast } = useToast();

  const filteredExpenses = expenseResource.data.filter((item) =>
    `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredReceipts = receiptResource.data.filter((item) =>
    `${item.tracking_number} ${item.depositor_name} ${item.customers?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => { setEditing(null); setModal(true); };

  const approve = async (expense: Expense) => {
    setBusy(true);
    try {
      await supabase.from('expenses').update({ status: 'approved' }).eq('id', expense.id);
      showToast('هزینه تأیید شد', 'success');
      await expenseResource.refresh();
    } catch { showToast('خطا در تأیید هزینه', 'error'); }
    setBusy(false);
  };

  const reject = async (expense: Expense) => {
    setBusy(true);
    try {
      await supabase.from('expenses').update({ status: 'rejected' }).eq('id', expense.id);
      showToast('هزینه رد شد', 'success');
      await expenseResource.refresh();
    } catch { showToast('خطا در رد هزینه', 'error'); }
    setBusy(false);
  };

  const openConfirm = (receipt: Receipt) => {
    setConfirmTarget(receipt);
    setAllocations([{ invoice_id: '', amount: '' }]);
  };
  const addAllocation = () => setAllocations([...allocations, { invoice_id: '', amount: '' }]);
  const removeAllocation = (i: number) => setAllocations(allocations.filter((_, idx) => idx !== i));

  const executeConfirm = async () => {
    if (!confirmTarget) return;
    const validAllocations = allocations
      .filter((a) => a.invoice_id && Number(a.amount) > 0)
      .map((a) => ({ invoice_id: a.invoice_id, amount: Number(a.amount) }));
    setBusy(true);
    try {
      const result = await confirmReceiptWithAllocations(confirmTarget.id, validAllocations);
      showToast(`دریافت تأیید شد. ${result.total_allocated.toLocaleString('fa-IR')} تومان تخصیص یافت.`, 'success');
      setConfirmTarget(null);
      setAllocations([]);
      await receiptResource.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در تأیید دریافت', 'error');
    }
    setBusy(false);
  };

  const executeReverse = async () => {
    if (!reverseTarget) return;
    setBusy(true);
    try {
      await reverseReceipt(reverseTarget.id, reverseReason);
      showToast('دریافت برگشت داده شد', 'success');
      setReverseTarget(null);
      setReverseReason('');
      await receiptResource.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در برگشت دریافت', 'error');
    }
    setBusy(false);
  };

  const customerInvoices = (customerId: string | null) =>
    invoices.filter((inv) => inv.customer_id === customerId && !inv.is_cancelled && inv.status !== 'paid');

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex gap-2">
        {([
          { id: 'expenses', label: 'هزینه‌ها', icon: X },
          { id: 'receipts', label: 'دریافت‌ها', icon: ArrowDownLeft },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'bg-white text-ink-500 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800'}`}>
              <Icon size={16} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'expenses' && (
        <Card className="overflow-hidden">
          <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در هزینه‌ها..." actionLabel="هزینه جدید" onAction={openNew} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead>
                <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                  <th className="px-5 py-4 font-medium">عنوان</th>
                  <th className="px-5 py-4 font-medium">دسته</th>
                  <th className="px-5 py-4 font-medium">مبلغ</th>
                  <th className="px-5 py-4 font-medium">تاریخ</th>
                  <th className="px-5 py-4 font-medium">وضعیت</th>
                  <th className="px-5 py-4 text-left font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-4 text-sm font-semibold text-ink-800 dark:text-ink-100">{expense.title}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{expense.expense_categories?.name ?? '—'}</td>
                    <td className="px-5 py-4 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(expense.amount, currency ?? 'تومان')}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{formatDate(expense.expense_date)}</td>
                    <td className="px-5 py-4"><ExpenseStatusBadge status={expense.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {expense.status === 'pending' && (
                          <>
                            <button onClick={() => approve(expense)} disabled={busy} className="rounded-lg p-2 text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10" title="تأیید"><Check size={15} /></button>
                            <button onClick={() => reject(expense)} disabled={busy} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="رد"><X size={15} /></button>
                          </>
                        )}
                        <RowActions onEdit={() => { setEditing(expense); setModal(true); }} onDelete={() => setDeleting(expense)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <EmptyState icon={ReceiptIcon} title="هزینه‌ای پیدا نشد" description="هزینه‌های شرکت را اینجا ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />هزینه جدید</Button>} />
            )}
          </div>
          <ExpenseModal open={modal && tab === 'expenses'} onClose={() => setModal(false)} expense={editing as Expense | null} categories={categories} accounts={accounts} onSave={async (values) => { if (editing) await expenseResource.update(editing.id, values); else await expenseResource.insert(values); setModal(false); }} />
          <ConfirmDialog open={!!deleting && tab === 'expenses'} onClose={() => setDeleting(null)} title="حذف هزینه؟" description="این هزینه حذف می‌شود." onConfirm={async () => { if (deleting) await expenseResource.remove(deleting.id); setDeleting(null); }} />
        </Card>
      )}

      {tab === 'receipts' && (
        <Card className="overflow-hidden">
          <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در دریافت‌ها..." actionLabel="دریافت جدید" onAction={openNew} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead>
                <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                  <th className="px-5 py-4 font-medium">تاریخ</th>
                  <th className="px-5 py-4 font-medium">مشتری</th>
                  <th className="px-5 py-4 font-medium">مبلغ</th>
                  <th className="px-5 py-4 font-medium">شماره پیگیری</th>
                  <th className="px-5 py-4 font-medium">حساب بانکی</th>
                  <th className="px-5 py-4 font-medium">وضعیت</th>
                  <th className="px-5 py-4 text-left font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-4 text-sm text-ink-500">{formatDate(receipt.receipt_date)}</td>
                    <td className="px-5 py-4 text-sm text-ink-700 dark:text-ink-200">{receipt.customers?.name ?? '—'}</td>
                    <td className="px-5 py-4 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(receipt.amount, currency ?? 'تومان')}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{receipt.tracking_number || '—'}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{receipt.bank_accounts?.name ?? '—'}</td>
                    <td className="px-5 py-4"><ReceiptStatusBadge status={receipt.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {receipt.status === 'pending' && (
                          <button onClick={() => openConfirm(receipt)} className="rounded-lg p-2 text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10" title="تأیید دریافت"><CheckCircle2 size={15} /></button>
                        )}
                        {receipt.status === 'confirmed' && (
                          <button onClick={() => setReverseTarget(receipt)} className="rounded-lg p-2 text-ink-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10" title="برگشت دریافت"><RotateCcw size={15} /></button>
                        )}
                        <RowActions onEdit={() => { setEditing(receipt); setModal(true); }} onDelete={receipt.status === 'pending' ? () => setDeleting(receipt) : undefined} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReceipts.length === 0 && (
              <EmptyState icon={ReceiptIcon} title="دریافتی پیدا نشد" description="دریافت‌های مشتریان را اینجا ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />دریافت جدید</Button>} />
            )}
          </div>
          <ReceiptModal open={modal && tab === 'receipts'} onClose={() => setModal(false)} receipt={editing as Receipt | null} customers={customers} accounts={accounts} onSave={async (values) => { if (editing) await receiptResource.update(editing.id, values); else await receiptResource.insert(values); setModal(false); }} />
          <ConfirmDialog open={!!deleting && tab === 'receipts'} onClose={() => setDeleting(null)} title="حذف دریافت؟" description="این دریافت حذف می‌شود." onConfirm={async () => { if (deleting) await receiptResource.remove(deleting.id); setDeleting(null); }} />

          {/* Confirm Receipt Modal */}
          <Modal open={!!confirmTarget} onClose={() => { setConfirmTarget(null); setAllocations([]); }} title="تأیید دریافت" description={`مبلغ: ${confirmTarget ? formatCurrency(confirmTarget.amount, currency ?? 'تومان') : ''}`}>
            <div className="space-y-4">
              <p className="text-sm text-ink-500 dark:text-ink-400">دریافت را به فاکتورهای مشتری تخصیص دهید. مبلغ تخصیص‌نیافته به عنوان اعتبار مشتری ثبت می‌شود.</p>
              {confirmTarget && (
                <div className="space-y-3">
                  {allocations.map((alloc, i) => {
                    const availableInvoices = customerInvoices(confirmTarget.customer_id);
                    return (
                      <div key={i} className="flex items-end gap-2">
                        <div className="flex-1">
                          <SelectField label={`فاکتور ${i + 1}`} value={alloc.invoice_id} onChange={(e) => { const next = [...allocations]; next[i] = { ...next[i], invoice_id: e.target.value }; setAllocations(next); }} options={[{ value: '', label: 'بدون تخصیص' }, ...availableInvoices.map((inv) => ({ value: inv.id, label: `${inv.invoice_number} - ${formatCurrency(inv.total ?? inv.amount, currency ?? 'تومان')}` }))]} />
                        </div>
                        <div className="w-32">
                          <InputField label="مبلغ" type="number" value={alloc.amount} onChange={(e) => { const next = [...allocations]; next[i] = { ...next[i], amount: e.target.value }; setAllocations(next); }} />
                        </div>
                        {allocations.length > 1 && (
                          <button onClick={() => removeAllocation(i)} className="mb-1 rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600"><RotateCcw size={16} /></button>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={addAllocation} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"><Plus size={15} /> افزودن تخصیص</button>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setConfirmTarget(null); setAllocations([]); }}>انصراف</Button>
                <Button onClick={executeConfirm} disabled={busy}>{busy ? 'در حال تأیید...' : 'تأیید دریافت'}</Button>
              </div>
            </div>
          </Modal>

          {/* Reverse Receipt Modal */}
          <Modal open={!!reverseTarget} onClose={() => { setReverseTarget(null); setReverseReason(''); }} title="برگشت دریافت" description={reverseTarget ? `${formatCurrency(reverseTarget.amount, currency ?? 'تومان')} - ${reverseTarget.customers?.name ?? ''}` : ''}>
            <div className="space-y-4">
              <p className="text-sm text-ink-500 dark:text-ink-400">برگشت دریافت، تخصیص‌ها را حذف و فاکتورها را به وضعیت قبلی برمی‌گرداند.</p>
              <TextareaField label="دلیل برگشت" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="دلیل برگشت دریافت را وارد کنید..." />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setReverseTarget(null); setReverseReason(''); }}>انصراف</Button>
                <Button onClick={executeReverse} disabled={busy || !reverseReason.trim()}>{busy ? 'در حال برگشت...' : 'برگشت دریافت'}</Button>
              </div>
            </div>
          </Modal>
        </Card>
      )}
    </div>
  );
}

function ExpenseModal({ open, onClose, expense, categories, accounts, onSave }: { open: boolean; onClose: () => void; expense: Expense | null; categories: ExpenseCategory[]; accounts: BankAccount[]; onSave: (v: Partial<Expense>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    title: string; amount: string; expense_date: string;
    category_id: string; bank_account_id: string; description: string;
  }>({
    title: expense?.title ?? '',
    amount: String(expense?.amount ?? 0),
    expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
    category_id: expense?.category_id ?? '',
    bank_account_id: expense?.bank_account_id ?? '',
    description: expense?.description ?? '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      title: form.title,
      amount: Number(form.amount) || 0,
      expense_date: form.expense_date,
      category_id: form.category_id || null,
      bank_account_id: form.bank_account_id || null,
      description: form.description,
      status: expense?.status ?? 'pending',
    });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'ویرایش هزینه' : 'ثبت هزینه جدید'} description="اطلاعات هزینه را وارد کنید.">
      <form onSubmit={submit} className="space-y-4">
        <InputField label="عنوان هزینه" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلا خرید دامنه" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="مبلغ" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <InputField label="تاریخ هزینه" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="دسته هزینه" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} options={[{ value: '', label: 'بدون دسته' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          <SelectField label="حساب بانکی" value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} options={[{ value: '', label: 'بدون حساب' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        </div>
        <TextareaField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره هزینه'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReceiptModal({ open, onClose, receipt, customers, accounts, onSave }: { open: boolean; onClose: () => void; receipt: Receipt | null; customers: Customer[]; accounts: BankAccount[]; onSave: (v: Partial<Receipt>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    customer_id: string; amount: string; receipt_date: string;
    bank_account_id: string; tracking_number: string; depositor_name: string;
    description: string; receipt_type: string;
  }>({
    customer_id: receipt?.customer_id ?? '',
    amount: String(receipt?.amount ?? 0),
    receipt_date: receipt?.receipt_date ?? new Date().toISOString().slice(0, 10),
    bank_account_id: receipt?.bank_account_id ?? '',
    tracking_number: receipt?.tracking_number ?? '',
    depositor_name: receipt?.depositor_name ?? '',
    description: receipt?.description ?? '',
    receipt_type: receipt?.receipt_type ?? 'invoice_payment',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      customer_id: form.customer_id || null,
      amount: Number(form.amount) || 0,
      receipt_date: form.receipt_date,
      bank_account_id: form.bank_account_id || null,
      tracking_number: form.tracking_number,
      depositor_name: form.depositor_name,
      description: form.description,
      receipt_type: form.receipt_type as Receipt['receipt_type'],
      status: receipt?.status ?? 'pending',
    });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={receipt ? 'ویرایش دریافت' : 'ثبت دریافت جدید'} description="اطلاعات دریافت مشتری را وارد کنید.">
      <form onSubmit={submit} className="space-y-4">
        <SelectField label="مشتری" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} options={[{ value: '', label: 'بدون مشتری' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="مبلغ" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <InputField label="تاریخ دریافت" type="date" value={form.receipt_date} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="حساب بانکی" value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} options={[{ value: '', label: 'بدون حساب' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
          <SelectField label="نوع دریافت" value={form.receipt_type} onChange={(e) => setForm({ ...form, receipt_type: e.target.value })} options={receiptTypeOptions} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="شماره پیگیری" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} />
          <InputField label="نام واریزکننده" value={form.depositor_name} onChange={(e) => setForm({ ...form, depositor_name: e.target.value })} />
        </div>
        <TextareaField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره دریافت'}</Button>
        </div>
      </form>
    </Modal>
  );
}
