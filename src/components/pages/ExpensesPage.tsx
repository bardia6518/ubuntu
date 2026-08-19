import { FormEvent, useState } from 'react';
import { Check, Plus, Receipt as ReceiptIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExpenseStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField, TextareaField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { RowActions, TableToolbar, type Resource } from '@/components/shared/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import type { BankAccount, Expense, ExpenseCategory, Project } from '@/types';

export function ExpensesPage({
  resource,
  projects,
  categories,
  accounts,
  query,
  setQuery,
  currency,
}: {
  resource: Resource<Expense>;
  projects: Project[];
  categories: ExpenseCategory[];
  accounts: BankAccount[];
  query: string;
  setQuery: (v: string) => void;
  currency?: string;
}) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const filtered = resource.data.filter((item) =>
    `${item.title} ${item.description} ${item.projects?.title ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => { setEditing(null); setModal(true); };

  const approve = async (expense: Expense) => {
    setBusy(true);
    try {
      await supabase.from('expenses').update({ status: 'approved' }).eq('id', expense.id);
      showToast('هزینه تأیید شد', 'success');
      await resource.refresh();
    } catch {
      showToast('خطا در تأیید هزینه', 'error');
    }
    setBusy(false);
  };

  const reject = async (expense: Expense) => {
    setBusy(true);
    try {
      await supabase.from('expenses').update({ status: 'rejected' }).eq('id', expense.id);
      showToast('هزینه رد شد', 'success');
      await resource.refresh();
    } catch {
      showToast('خطا در رد هزینه', 'error');
    }
    setBusy(false);
  };

  return (
    <div className="animate-slide-up">
      <Card className="overflow-hidden">
        <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در هزینه‌ها..." actionLabel="هزینه جدید" onAction={openNew} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right">
            <thead>
              <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-4 font-medium">عنوان</th>
                <th className="px-5 py-4 font-medium">پروژه</th>
                <th className="px-5 py-4 font-medium">دسته</th>
                <th className="px-5 py-4 font-medium">مبلغ</th>
                <th className="px-5 py-4 font-medium">تاریخ</th>
                <th className="px-5 py-4 font-medium">وضعیت</th>
                <th className="px-5 py-4 text-left font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {filtered.map((expense) => (
                <tr key={expense.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                  <td className="px-5 py-4 text-sm font-semibold text-ink-800 dark:text-ink-100">{expense.title}</td>
                  <td className="px-5 py-4 text-sm text-ink-500">{expense.projects?.title ?? '—'}</td>
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
          {filtered.length === 0 && (
            <EmptyState icon={ReceiptIcon} title="هزینه‌ای پیدا نشد" description="هزینه‌های پروژه و شرکت را اینجا ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />هزینه جدید</Button>} />
          )}
        </div>
      </Card>

      <ExpenseModal open={modal} onClose={() => setModal(false)} expense={editing} projects={projects} categories={categories} accounts={accounts} onSave={async (values) => { if (editing) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); }} />

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف هزینه؟" description="این هزینه حذف می‌شود." onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} />
    </div>
  );
}

function ExpenseModal({ open, onClose, expense, projects, categories, accounts, onSave }: { open: boolean; onClose: () => void; expense: Expense | null; projects: Project[]; categories: ExpenseCategory[]; accounts: BankAccount[]; onSave: (v: Partial<Expense>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    title: string; amount: string; expense_date: string; project_id: string;
    category_id: string; bank_account_id: string; description: string;
  }>({
    title: expense?.title ?? '',
    amount: String(expense?.amount ?? 0),
    expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
    project_id: expense?.project_id ?? '',
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
      project_id: form.project_id || null,
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
          <SelectField label="پروژه" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} options={[{ value: '', label: 'بدون پروژه' }, ...projects.map((p) => ({ value: p.id, label: p.title }))]} />
          <SelectField label="دسته هزینه" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} options={[{ value: '', label: 'بدون دسته' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
        </div>
        <SelectField label="حساب بانکی" value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} options={[{ value: '', label: 'بدون حساب' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        <TextareaField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره هزینه'}</Button>
        </div>
      </form>
    </Modal>
  );
}
