import { FormEvent, useState } from 'react';
import { AlertTriangle, CheckCircle2, FolderKanban, Lock, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProjectExecutionBadge, ProjectFinancialBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField, TextareaField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { RowActions, SectionHeader, TableToolbar, type Resource } from '@/components/shared/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { checkProjectCloseReadiness, closeProject } from '@/lib/finance';
import type { Customer, Project, Service, ReportProjectProfit } from '@/types';

const executionStatusOptions = [
  { value: 'not_started', label: 'شروع نشده' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'delivered', label: 'تحویل شده' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'on_hold', label: 'متوقف' },
  { value: 'cancelled', label: 'لغو شده' },
];

const financialStatusOptions = [
  { value: 'no_contract', label: 'بدون قرارداد' },
  { value: 'contracted', label: 'قرارداد بسته شده' },
  { value: 'invoicing', label: 'در حال فاکتور کردن' },
  { value: 'partial_received', label: 'دریافت جزئی' },
  { value: 'fully_received', label: 'تسویه شده' },
  { value: 'overdue', label: 'سررسید گذشته' },
];

const blockerLabels: Record<string, string> = {
  delivery_not_done: 'تحویل پروژه انجام نشده است',
  missing_required_documents: 'مدارک ضروری موجود نیست',
  pending_expenses: 'هزینه‌های بررسی‌نشده باقی مانده است',
  pending_contractor_bills: 'صورت‌حساب همکاران ثبت نشده است',
  customer_balance_unresolved: 'مانده مشتری تعیین‌تکلیف نشده است',
};

export function ProjectsPage({
  resource,
  profitData,
  customers,
  services,
  query,
  setQuery,
  currency,
}: {
  resource: Resource<Project>;
  profitData: ReportProjectProfit[];
  customers: Customer[];
  services: Service[];
  query: string;
  setQuery: (v: string) => void;
  currency?: string;
}) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [closeTarget, setCloseTarget] = useState<Project | null>(null);
  const [closeReadiness, setCloseReadiness] = useState<{ can_close: boolean; blockers: string[] } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [closing, setClosing] = useState(false);
  const { showToast } = useToast();

  const profitMap = new Map(profitData.map((p) => [p.project_id, p]));
  const filtered = resource.data.filter((item) =>
    `${item.project_code} ${item.title} ${item.customers?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => { setEditing(null); setModal(true); };

  const handleCloseClick = async (project: Project) => {
    setCloseTarget(project);
    setOverrideReason('');
    try {
      const readiness = await checkProjectCloseReadiness(project.id);
      setCloseReadiness(readiness);
    } catch {
      setCloseReadiness({ can_close: false, blockers: ['خطا در بررسی وضعیت'] });
    }
  };

  const executeClose = async () => {
    if (!closeTarget) return;
    setClosing(true);
    try {
      const result = await closeProject(
        closeTarget.id,
        closeReadiness && !closeReadiness.can_close ? overrideReason : undefined
      );
      if (result.success) {
        showToast(result.override ? 'پروژه با Override بسته شد' : 'پروژه با موفقیت بسته شد', 'success');
        setCloseTarget(null);
        setCloseReadiness(null);
        await resource.refresh();
      } else if (result.blockers) {
        setCloseReadiness({ can_close: false, blockers: result.blockers });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در بستن پروژه', 'error');
    }
    setClosing(false);
  };

  return (
    <div className="animate-slide-up">
      <Card className="overflow-hidden">
        <TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در پروژه‌ها..." actionLabel="پروژه جدید" onAction={openNew} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead>
              <tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-4 font-medium">کد پروژه</th>
                <th className="px-5 py-4 font-medium">عنوان</th>
                <th className="px-5 py-4 font-medium">مشتری</th>
                <th className="px-5 py-4 font-medium">قرارداد</th>
                <th className="px-5 py-4 font-medium">دریافت شده</th>
                <th className="px-5 py-4 font-medium">سود</th>
                <th className="px-5 py-4 font-medium">وضعیت اجرا</th>
                <th className="px-5 py-4 font-medium">وضعیت مالی</th>
                <th className="px-5 py-4 text-left font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {filtered.map((project) => {
                const profit = profitMap.get(project.id);
                return (
                  <tr key={project.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-4 text-sm font-semibold text-primary-700 dark:text-primary-300">{project.project_code}</td>
                    <td className="px-5 py-4 text-sm font-medium text-ink-800 dark:text-ink-100">{project.title}</td>
                    <td className="px-5 py-4 text-sm text-ink-500">{project.customers?.name ?? '—'}</td>
                    <td className="px-5 py-4 num text-sm text-ink-700 dark:text-ink-200">{formatCurrency(project.contract_amount, currency ?? 'تومان')}</td>
                    <td className="px-5 py-4 num text-sm text-ink-700 dark:text-ink-200">{profit ? formatCurrency(profit.total_received, currency ?? 'تومان') : '—'}</td>
                    <td className="px-5 py-4 num text-sm font-semibold">
                      {profit ? (
                        <span className={profit.profit >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600'}>
                          {formatCurrency(profit.profit, currency ?? 'تومان')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4"><ProjectExecutionBadge status={project.execution_status} /></td>
                    <td className="px-5 py-4"><ProjectFinancialBadge status={project.financial_status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {project.execution_status !== 'completed' && (
                          <button onClick={() => handleCloseClick(project)} className="rounded-lg p-2 text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10" title="بستن پروژه">
                            <Lock size={15} />
                          </button>
                        )}
                        <RowActions onEdit={() => { setEditing(project); setModal(true); }} onDelete={() => setDeleting(project)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={FolderKanban} title="پروژه‌ای پیدا نشد" description="اولین پروژه خود را ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />پروژه جدید</Button>} />
          )}
        </div>
      </Card>

      <ProjectModal open={modal} onClose={() => setModal(false)} project={editing} customers={customers} services={services} onSave={async (values) => { if (editing) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); }} />

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف پروژه؟" description={`پروژه «${deleting?.title}» حذف می‌شود.`} onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} />

      {/* Close Project Modal */}
      <Modal open={!!closeTarget} onClose={() => { setCloseTarget(null); setCloseReadiness(null); }} title="بستن پروژه" description={closeTarget?.title}>
        {closeReadiness === null ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            {closeReadiness.can_close ? (
              <div className="flex items-center gap-3 rounded-xl bg-primary-50 p-4 dark:bg-primary-500/10">
                <CheckCircle2 size={20} className="text-primary-600 dark:text-primary-400" />
                <p className="text-sm text-primary-700 dark:text-primary-300">پروژه آماده بسته شدن است. همه شرایط برقرار است.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">برخی شرایط برقرار نیست. می‌توانید با ذکر دلیل، بستن پروژه را Override کنید.</p>
                </div>
                <div className="space-y-2">
                  {closeReadiness.blockers.map((blocker, i) => {
                    const key = blocker.split(':')[0];
                    const label = blockerLabels[key] ?? blocker;
                    const count = blocker.includes(':') ? blocker.split(':')[1] : '';
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
                        <X size={14} className="text-rose-500" />
                        <span>{label}{count && ` (${count})`}</span>
                      </div>
                    );
                  })}
                </div>
                <TextareaField label="دلیل Override" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="دلیل بستن پروژه با وجود موانع را وارد کنید..." />
              </>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setCloseTarget(null); setCloseReadiness(null); }}>انصراف</Button>
              <Button onClick={executeClose} disabled={closing || (!closeReadiness.can_close && !overrideReason.trim())}>
                {closing ? 'در حال بستن...' : closeReadiness.can_close ? 'بستن پروژه' : 'بستن با Override'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProjectModal({ open, onClose, project, customers, services, onSave }: { open: boolean; onClose: () => void; project: Project | null; customers: Customer[]; services: Service[]; onSave: (v: Partial<Project>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    project_code: string; title: string; customer_id: string; service_id: string;
    contract_amount: string; estimated_cost: string; start_date: string; delivery_deadline: string;
    project_manager: string; execution_status: string; financial_status: string; description: string;
  }>({
    project_code: project?.project_code ?? `PRJ-${Date.now().toString().slice(-6)}`,
    title: project?.title ?? '',
    customer_id: project?.customer_id ?? '',
    service_id: project?.service_id ?? '',
    contract_amount: String(project?.contract_amount ?? 0),
    estimated_cost: String(project?.estimated_cost ?? 0),
    start_date: project?.start_date ?? new Date().toISOString().slice(0, 10),
    delivery_deadline: project?.delivery_deadline ?? '',
    project_manager: project?.project_manager ?? '',
    execution_status: project?.execution_status ?? 'not_started',
    financial_status: project?.financial_status ?? 'no_contract',
    description: project?.description ?? '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      project_code: form.project_code,
      title: form.title,
      customer_id: form.customer_id || null,
      service_id: form.service_id || null,
      contract_amount: Number(form.contract_amount) || 0,
      estimated_cost: Number(form.estimated_cost) || 0,
      start_date: form.start_date || null,
      delivery_deadline: form.delivery_deadline || null,
      project_manager: form.project_manager,
      execution_status: form.execution_status as Project['execution_status'],
      financial_status: form.financial_status as Project['financial_status'],
      description: form.description,
    });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? 'ویرایش پروژه' : 'ثبت پروژه جدید'} description="اطلاعات پروژه را وارد کنید.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="کد پروژه" required value={form.project_code} onChange={(e) => setForm({ ...form, project_code: e.target.value })} />
          <InputField label="عنوان پروژه" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلا طراحی وب‌سایت شرکت آریا" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="مشتری" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} options={[{ value: '', label: 'بدون مشتری' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} />
          <SelectField label="نوع خدمت" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} options={[{ value: '', label: 'بدون خدمت' }, ...services.map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="مبلغ قرارداد" type="number" value={form.contract_amount} onChange={(e) => setForm({ ...form, contract_amount: e.target.value })} />
          <InputField label="هزینه برآوردی" type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="تاریخ شروع" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <InputField label="مهلت تحویل" type="date" value={form.delivery_deadline} onChange={(e) => setForm({ ...form, delivery_deadline: e.target.value })} />
        </div>
        <InputField label="مدیر پروژه" value={form.project_manager} onChange={(e) => setForm({ ...form, project_manager: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="وضعیت اجرا" value={form.execution_status} onChange={(e) => setForm({ ...form, execution_status: e.target.value })} options={executionStatusOptions} />
          <SelectField label="وضعیت مالی" value={form.financial_status} onChange={(e) => setForm({ ...form, financial_status: e.target.value })} options={financialStatusOptions} />
        </div>
        <TextareaField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره پروژه'}</Button>
        </div>
      </form>
    </Modal>
  );
}
