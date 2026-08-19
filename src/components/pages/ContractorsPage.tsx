import { FormEvent, useState } from 'react';
import { HardHat, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ContractorBillStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField, TextareaField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { RowActions, TableToolbar, type Resource } from '@/components/shared/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BankAccount, Contractor, ContractorBill, ContractorPayment, Project, ReportContractorDebt } from '@/types';

export function ContractorsPage({
  contractorsResource,
  billsResource,
  paymentsResource,
  debtData,
  projects,
  accounts,
  query,
  setQuery,
  currency,
}: {
  contractorsResource: Resource<Contractor>;
  billsResource: Resource<ContractorBill>;
  paymentsResource: Resource<ContractorPayment>;
  debtData: ReportContractorDebt[];
  projects: Project[];
  accounts: BankAccount[];
  query: string;
  setQuery: (v: string) => void;
  currency?: string;
}) {
  const [tab, setTab] = useState<'contractors' | 'bills' | 'payments'>('contractors');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Contractor | ContractorBill | ContractorPayment | null>(null);
  const [deleting, setDeleting] = useState<Contractor | ContractorBill | ContractorPayment | null>(null);

  const debtMap = new Map(debtData.map((d) => [d.contractor_id, d]));

  const filteredContractors = contractorsResource.data.filter((item) =>
    `${item.name} ${item.contact_person} ${item.phone}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredBills = billsResource.data.filter((item) =>
    `${item.bill_number} ${item.contractors?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredPayments = paymentsResource.data.filter((item) =>
    `${item.tracking_number} ${item.contractors?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => { setEditing(null); setModal(true); };

  return (
    <div className="animate-slide-up space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: 'contractors', label: 'همکاران' },
          { id: 'bills', label: 'صورت‌حساب‌ها' },
          { id: 'payments', label: 'پرداخت‌ها' },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'bg-white text-ink-500 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'contractors' && (
        <Card className="overflow-hidden">
          <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در همکاران..." actionLabel="همکار جدید" onAction={openNew} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead>
                <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                  <th className="px-5 py-4 font-medium">نام</th>
                  <th className="px-5 py-4 font-medium">تماس</th>
                  <th className="px-5 py-4 font-medium">بدهی باقی‌مانده</th>
                  <th className="px-5 py-4 font-medium">وضعیت</th>
                  <th className="px-5 py-4 text-left font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filteredContractors.map((contractor) => {
                  const debt = debtMap.get(contractor.id);
                  return (
                    <tr key={contractor.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                      <td className="px-5 py-4 text-sm font-semibold text-ink-800 dark:text-ink-100">{contractor.name}</td>
                      <td className="px-5 py-4 text-sm text-ink-500">{contractor.phone || '—'}</td>
                      <td className="px-5 py-4 num text-sm font-semibold">
                        {debt ? (
                          <span className={debt.outstanding_debt > 0 ? 'text-rose-600' : 'text-primary-600'}>{formatCurrency(debt.outstanding_debt, currency ?? 'تومان')}</span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${contractor.status === 'active' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'}`}>
                          {contractor.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="px-5 py-4"><RowActions onEdit={() => { setEditing(contractor); setModal(true); }} onDelete={() => setDeleting(contractor)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredContractors.length === 0 && <EmptyState icon={HardHat} title="همکاری پیدا نشد" description="همکاران و پیمانکاران خود را ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />همکار جدید</Button>} />}
          </div>
          <ContractorModal open={modal} onClose={() => setModal(false)} contractor={editing as Contractor | null} onSave={async (values) => { if (editing) await contractorsResource.update(editing.id, values); else await contractorsResource.insert(values); setModal(false); }} />
          <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف همکار؟" description="این همکار حذف می‌شود." onConfirm={async () => { if (deleting) await contractorsResource.remove(deleting.id); setDeleting(null); }} />
        </Card>
      )}

      {tab === 'bills' && (
        <Card className="overflow-hidden">
          <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در صورت‌حساب‌ها..." actionLabel="صورت‌حساب جدید" onAction={openNew} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right">
              <thead>
                <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                  <th className="px-5 py-4 font-medium">شماره</th>
                  <th className="px-5 py-4 font-medium">همکار</th>
                  <th className="px-5 py-4 font-medium">پروژه</th>
                  <th className="px-5 py-4 font-medium">مبلغ</th>
                  <th className="px-5 py-4 font-medium">تاریخ</th>
                  <th className="px-5 py-4 font-medium">وضعیت</th>
                  <th className="px-5 py-4 text-left font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-4 text-sm font-semibold text-primary-700 dark:text-primary-300">{bill.bill_number}</td>
                    <td className="px-5 py-4 text-sm text-ink-700 dark:text-ink-200">{bill.contractors?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{bill.projects?.title ?? '—'}</td>
                    <td className="px-5 py-4 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(bill.amount, currency ?? 'تومان')}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{formatDate(bill.bill_date)}</td>
                    <td className="px-5 py-4"><ContractorBillStatusBadge status={bill.status} /></td>
                    <td className="px-5 py-4"><RowActions onEdit={() => { setEditing(bill); setModal(true); }} onDelete={() => setDeleting(bill)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBills.length === 0 && <EmptyState icon={HardHat} title="صورت‌حسابی پیدا نشد" description="صورت‌حساب‌های همکاران را ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />صورت‌حساب جدید</Button>} />}
          </div>
          <ContractorBillModal open={modal} onClose={() => setModal(false)} bill={editing as ContractorBill | null} contractors={contractorsResource.data} projects={projects} onSave={async (values) => { if (editing) await billsResource.update(editing.id, values); else await billsResource.insert(values); setModal(false); }} />
          <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف صورت‌حساب؟" description="این صورت‌حساب حذف می‌شود." onConfirm={async () => { if (deleting) await billsResource.remove(deleting.id); setDeleting(null); }} />
        </Card>
      )}

      {tab === 'payments' && (
        <Card className="overflow-hidden">
          <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در پرداخت‌ها..." actionLabel="پرداخت جدید" onAction={openNew} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right">
              <thead>
                <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                  <th className="px-5 py-4 font-medium">تاریخ</th>
                  <th className="px-5 py-4 font-medium">همکار</th>
                  <th className="px-5 py-4 font-medium">پروژه</th>
                  <th className="px-5 py-4 font-medium">مبلغ</th>
                  <th className="px-5 py-4 font-medium">شماره پیگیری</th>
                  <th className="px-5 py-4 text-left font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-4 text-sm text-ink-500">{formatDate(payment.payment_date)}</td>
                    <td className="px-5 py-4 text-sm text-ink-700 dark:text-ink-200">{payment.contractors?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{payment.projects?.title ?? '—'}</td>
                    <td className="px-5 py-4 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(payment.amount, currency ?? 'تومان')}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{payment.tracking_number || '—'}</td>
                    <td className="px-5 py-4"><RowActions onEdit={() => { setEditing(payment); setModal(true); }} onDelete={() => setDeleting(payment)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && <EmptyState icon={HardHat} title="پرداختی پیدا نشد" description="پرداخت‌های همکاران را ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />پرداخت جدید</Button>} />}
          </div>
          <ContractorPaymentModal open={modal} onClose={() => setModal(false)} payment={editing as ContractorPayment | null} contractors={contractorsResource.data} projects={projects} accounts={accounts} onSave={async (values) => { if (editing) await paymentsResource.update(editing.id, values); else await paymentsResource.insert(values); setModal(false); }} />
          <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف پرداخت؟" description="این پرداخت حذف می‌شود." onConfirm={async () => { if (deleting) await paymentsResource.remove(deleting.id); setDeleting(null); }} />
        </Card>
      )}
    </div>
  );
}

function ContractorModal({ open, onClose, contractor, onSave }: { open: boolean; onClose: () => void; contractor: Contractor | null; onSave: (v: Partial<Contractor>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; contact_person: string; phone: string; email: string; national_id: string; status: string }>({
    name: contractor?.name ?? '',
    contact_person: contractor?.contact_person ?? '',
    phone: contractor?.phone ?? '',
    email: contractor?.email ?? '',
    national_id: contractor?.national_id ?? '',
    status: contractor?.status ?? 'active',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      name: form.name,
      contact_person: form.contact_person,
      phone: form.phone,
      email: form.email,
      national_id: form.national_id,
      status: form.status as Contractor['status'],
    });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={contractor ? 'ویرایش همکار' : 'ثبت همکار جدید'}>
      <form onSubmit={submit} className="space-y-4">
        <InputField label="نام" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="نام مسئول" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          <InputField label="شماره تماس" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="ایمیل" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <InputField label="کد ملی" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
        </div>
        <SelectField label="وضعیت" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'فعال' }, { value: 'inactive', label: 'غیرفعال' }]} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ContractorBillModal({ open, onClose, bill, contractors, projects, onSave }: { open: boolean; onClose: () => void; bill: ContractorBill | null; contractors: Contractor[]; projects: Project[]; onSave: (v: Partial<ContractorBill>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ bill_number: string; contractor_id: string; project_id: string; amount: string; bill_date: string; status: string; description: string }>({
    bill_number: bill?.bill_number ?? `BILL-${Date.now().toString().slice(-6)}`,
    contractor_id: bill?.contractor_id ?? '',
    project_id: bill?.project_id ?? '',
    amount: String(bill?.amount ?? 0),
    bill_date: bill?.bill_date ?? new Date().toISOString().slice(0, 10),
    status: bill?.status ?? 'pending',
    description: bill?.description ?? '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      bill_number: form.bill_number,
      contractor_id: form.contractor_id,
      project_id: form.project_id || null,
      amount: Number(form.amount) || 0,
      bill_date: form.bill_date,
      status: form.status as ContractorBill['status'],
      description: form.description,
    });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={bill ? 'ویرایش صورت‌حساب' : 'ثبت صورت‌حساب جدید'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="شماره صورت‌حساب" required value={form.bill_number} onChange={(e) => setForm({ ...form, bill_number: e.target.value })} />
          <SelectField label="همکار" value={form.contractor_id} onChange={(e) => setForm({ ...form, contractor_id: e.target.value })} options={[{ value: '', label: 'انتخاب کنید' }, ...contractors.map((c) => ({ value: c.id, label: c.name }))]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="مبلغ" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <InputField label="تاریخ" type="date" value={form.bill_date} onChange={(e) => setForm({ ...form, bill_date: e.target.value })} />
        </div>
        <SelectField label="پروژه" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} options={[{ value: '', label: 'بدون پروژه' }, ...projects.map((p) => ({ value: p.id, label: p.title }))]} />
        <SelectField label="وضعیت" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'pending', label: 'در انتظار' }, { value: 'approved', label: 'تأیید شده' }, { value: 'paid', label: 'پرداخت شده' }, { value: 'rejected', label: 'رد شده' }]} />
        <TextareaField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ContractorPaymentModal({ open, onClose, payment, contractors, projects, accounts, onSave }: { open: boolean; onClose: () => void; payment: ContractorPayment | null; contractors: Contractor[]; projects: Project[]; accounts: BankAccount[]; onSave: (v: Partial<ContractorPayment>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ contractor_id: string; project_id: string; amount: string; payment_date: string; bank_account_id: string; tracking_number: string; description: string }>({
    contractor_id: payment?.contractor_id ?? '',
    project_id: payment?.project_id ?? '',
    amount: String(payment?.amount ?? 0),
    payment_date: payment?.payment_date ?? new Date().toISOString().slice(0, 10),
    bank_account_id: payment?.bank_account_id ?? '',
    tracking_number: payment?.tracking_number ?? '',
    description: payment?.description ?? '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      contractor_id: form.contractor_id,
      project_id: form.project_id || null,
      amount: Number(form.amount) || 0,
      payment_date: form.payment_date,
      bank_account_id: form.bank_account_id || null,
      tracking_number: form.tracking_number,
      description: form.description,
    });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={payment ? 'ویرایش پرداخت' : 'ثبت پرداخت جدید'}>
      <form onSubmit={submit} className="space-y-4">
        <SelectField label="همکار" value={form.contractor_id} onChange={(e) => setForm({ ...form, contractor_id: e.target.value })} options={[{ value: '', label: 'انتخاب کنید' }, ...contractors.map((c) => ({ value: c.id, label: c.name }))]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="مبلغ" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <InputField label="تاریخ پرداخت" type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="پروژه" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} options={[{ value: '', label: 'بدون پروژه' }, ...projects.map((p) => ({ value: p.id, label: p.title }))]} />
          <SelectField label="حساب بانکی" value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} options={[{ value: '', label: 'بدون حساب' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        </div>
        <InputField label="شماره پیگیری" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} />
        <TextareaField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره'}</Button>
        </div>
      </form>
    </Modal>
  );
}
