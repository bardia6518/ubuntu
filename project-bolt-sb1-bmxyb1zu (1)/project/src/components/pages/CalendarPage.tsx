import { FormEvent, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EventStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { type Resource } from '@/components/shared/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import type { CalendarEvent } from '@/types';

const weekdayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const monthLabels = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
];
const today = new Date();

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOffset(date: Date): number {
  return (date.getDay() + 1) % 7;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function monthTitle(date: Date): string {
  return `${date.toLocaleDateString('fa-IR', { month: 'long' })} ${date.toLocaleDateString('fa-IR', { year: 'numeric' })}`;
}

function getMonthDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Date[] = [];
  for (let index = 0; index < startOffset(firstDay); index += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), -startOffset(firstDay) + index + 1));
  }
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (cells.length < 42) cells.push(new Date(month.getFullYear(), month.getMonth() + 1, cells.length - daysInMonth - startOffset(firstDay) + 1));
  return cells;
}

export function CalendarPage({ resource, query, setQuery, currency }: { resource: Resource<CalendarEvent>; query: string; setQuery: (value: string) => void; currency?: string }) {
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toKey(today));
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [kindFilter, setKindFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'overdue'>('all');
  const days = useMemo(() => getMonthDays(month), [month]);
  const unit = currency ?? 'تومان';
  const events = resource.data.filter((event) => {
    const matchesQuery = `${event.title} ${event.amount}`.toLowerCase().includes(query.toLowerCase());
    const matchesKind = kindFilter === 'all' || event.kind === kindFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesQuery && matchesKind && matchesStatus;
  });
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => map.set(event.event_date, [...(map.get(event.event_date) ?? []), event]));
    return map;
  }, [events]);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const selectedDateValue = new Date(`${selectedDate}T12:00:00`);
  const selectedIncome = selectedEvents.filter((event) => event.kind === 'income').reduce((sum, event) => sum + Number(event.amount), 0);
  const selectedExpense = selectedEvents.filter((event) => event.kind === 'expense').reduce((sum, event) => sum + Number(event.amount), 0);
  const monthEvents = events.filter((event) => event.event_date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`));
  const monthIncome = monthEvents.filter((event) => event.kind === 'income').reduce((sum, event) => sum + Number(event.amount), 0);
  const monthExpense = monthEvents.filter((event) => event.kind === 'expense').reduce((sum, event) => sum + Number(event.amount), 0);

  const changeMonth = (amount: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  const goToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toKey(today));
  };
  const openNew = (date = selectedDate) => {
    setEditing({ id: '', title: '', kind: 'income', amount: 0, event_date: date, status: 'upcoming', created_at: '' });
    setModal(true);
  };

  return (
    <div className="animate-slide-up space-y-5">
      <Card className="overflow-hidden border-sky-100/80 bg-slate-50/80 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="border-b border-sky-100/80 px-4 py-4 dark:border-ink-800 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)} className="rounded-xl border border-sky-100 bg-white p-2 text-ink-500 transition hover:border-primary-300 hover:text-primary-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300" aria-label="ماه قبل"><ChevronRight size={17} /></button>
              <button onClick={goToday} className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-300 hover:text-primary-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">امروز</button>
              <button onClick={() => changeMonth(1)} className="rounded-xl border border-sky-100 bg-white p-2 text-ink-500 transition hover:border-primary-300 hover:text-primary-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300" aria-label="ماه بعد"><ChevronLeft size={17} /></button>
              <h2 className="mr-2 text-lg font-bold text-ink-900 dark:text-white">{monthTitle(month)}</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:w-64">
                <CalendarDays size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در رویدادها..." className="h-10 w-full rounded-xl border border-sky-100 bg-white pr-9 pl-3 text-sm text-ink-800 outline-none transition focus:border-primary-400 dark:border-ink-700 dark:bg-ink-800 dark:text-white" />
              </div>
              <button onClick={() => setShowFilters((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${showFilters ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'border-sky-100 bg-white text-ink-500 hover:border-primary-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300'}`}>فیلترها</button>
              <Button size="sm" onClick={() => openNew()}><Plus size={15} />رویداد جدید</Button>
            </div>
          </div>
          {showFilters && <div className="mt-4 flex flex-wrap gap-2 border-t border-sky-100 pt-4 dark:border-ink-800"><FilterPill active={kindFilter === 'all'} onClick={() => setKindFilter('all')}>همه جریان‌ها</FilterPill><FilterPill active={kindFilter === 'income'} onClick={() => setKindFilter('income')} tone="income">دریافت‌ها</FilterPill><FilterPill active={kindFilter === 'expense'} onClick={() => setKindFilter('expense')} tone="expense">پرداخت‌ها</FilterPill><span className="mx-1 hidden w-px bg-sky-100 sm:block dark:bg-ink-700" /><FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>همه وضعیت‌ها</FilterPill><FilterPill active={statusFilter === 'upcoming'} onClick={() => setStatusFilter('upcoming')}>پیش‌رو</FilterPill><FilterPill active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')}>انجام شده</FilterPill><FilterPill active={statusFilter === 'overdue'} onClick={() => setStatusFilter('overdue')}>سررسید گذشته</FilterPill></div>}
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 p-3 sm:p-5">
            <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-sky-100 bg-white dark:border-ink-700 dark:bg-ink-900">
              {weekdayLabels.map((label) => <div key={label} className="border-b border-sky-100 bg-sky-50/80 px-2 py-3 text-center text-[11px] font-semibold text-slate-500 dark:border-ink-700 dark:bg-ink-800/80 dark:text-ink-300">{label}</div>)}
              {days.map((date) => {
                const key = toKey(date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isCurrentMonth = date.getMonth() === month.getMonth();
                const isSelected = key === selectedDate;
                const isToday = key === toKey(today);
                return <button key={key} onClick={() => setSelectedDate(key)} className={`group relative min-h-[112px] border-b border-l border-sky-100 p-2 text-right align-top transition last:border-l-0 hover:bg-sky-50/70 dark:border-ink-800 dark:hover:bg-ink-800/60 sm:min-h-[130px] ${!isCurrentMonth ? 'bg-slate-50/70 text-ink-300 dark:bg-ink-950/30 dark:text-ink-600' : 'bg-white dark:bg-ink-900'} ${isSelected ? 'z-10 bg-sky-50/80 ring-2 ring-inset ring-primary-500/70 dark:bg-primary-500/10' : ''}`}>
                  <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${isToday ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30' : isSelected ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200' : isCurrentMonth ? 'text-ink-700 dark:text-ink-200' : 'text-ink-300 dark:text-ink-600'}`}>{date.toLocaleDateString('fa-IR', { day: 'numeric' })}</span>
                  {dayEvents.length > 0 && <div className="mt-2 space-y-1">{dayEvents.slice(0, 3).map((event) => <div key={event.id} className={`truncate rounded-lg border px-2 py-1.5 text-[10px] font-medium ${event.kind === 'income' ? 'border-primary-100 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300' : 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'}`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${event.kind === 'income' ? 'bg-primary-500' : 'bg-rose-500'}`} />{event.title}</div>)}</div>}
                  {dayEvents.length > 3 && <span className="mt-1 block text-[10px] font-medium text-primary-600">+{(dayEvents.length - 3).toLocaleString('fa-IR')} مورد دیگر</span>}
                </button>;
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 px-1 text-xs text-ink-500 dark:text-ink-400"><LegendDot tone="income" label="دریافت" /><LegendDot tone="expense" label="پرداخت" /><span className="mr-auto text-ink-400">برای دیدن جزئیات، یک روز را انتخاب کنید</span></div>
          </div>

          <aside className="border-t border-sky-100 bg-white/70 p-4 dark:border-ink-800 dark:bg-ink-900/70 xl:border-r xl:border-t-0">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-ink-400">جزئیات روز</p><h3 className="mt-1 text-base font-bold text-ink-900 dark:text-white">{formatDay(selectedDateValue)}</h3></div><button onClick={() => setSelectedDate(toKey(today))} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-sky-50 hover:text-primary-600 dark:hover:bg-ink-800" title="انتخاب امروز"><Clock3 size={16} /></button></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><SummaryCard label="دریافت" value={selectedIncome} unit={unit} tone="income" /><SummaryCard label="پرداخت" value={selectedExpense} unit={unit} tone="expense" /><SummaryCard label="خالص" value={selectedIncome - selectedExpense} unit={unit} tone={selectedIncome - selectedExpense >= 0 ? 'income' : 'expense'} /></div>
            <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold text-ink-800 dark:text-ink-100">رویدادهای روز</p><button onClick={() => openNew(selectedDate)} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"><Plus size={14} />افزودن</button></div>
            <div className="mt-3 space-y-2">{selectedEvents.map((event) => <EventDetail key={event.id} event={event} unit={unit} onEdit={() => { setEditing(event); setModal(true); }} onDelete={() => setDeleting(event)} />)}{selectedEvents.length === 0 && <EmptyState icon={CalendarDays} title="رویدادی نیست" description="برای این روز دریافت یا پرداختی ثبت نشده است." action={<Button size="sm" onClick={() => openNew(selectedDate)}><Plus size={14} />افزودن رویداد</Button>} />}</div>
          </aside>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3"><MonthMetric icon={ArrowDownLeft} label="دریافت‌های این ماه" value={monthIncome} unit={unit} tone="income" /><MonthMetric icon={ArrowUpLeft} label="پرداخت‌های این ماه" value={monthExpense} unit={unit} tone="expense" /><MonthMetric icon={CalendarDays} label="تعداد رویدادها" value={monthEvents.length} unit="رویداد" tone="neutral" /></div>

      <EventModal open={modal} onClose={() => setModal(false)} event={editing} onSave={async (values) => { if (editing?.id) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); await resource.refresh(); }} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف رویداد؟" description="این رویداد مالی حذف می‌شود." onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} />
    </div>
  );
}

function FilterPill({ active, onClick, children, tone }: { active: boolean; onClick: () => void; children: string; tone?: 'income' | 'expense' }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${active ? tone === 'expense' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : tone === 'income' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'bg-ink-800 text-white dark:bg-white dark:text-ink-800' : 'bg-white text-ink-500 hover:bg-sky-50 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'}`}>{children}</button>;
}

function LegendDot({ tone, label }: { tone: 'income' | 'expense'; label: string }) {
  return <span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${tone === 'income' ? 'bg-primary-500' : 'bg-rose-500'}`} />{label}</span>;
}

function SummaryCard({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: 'income' | 'expense' }) {
  return <div className={`rounded-xl border p-2.5 ${tone === 'income' ? 'border-primary-100 bg-primary-50/70 dark:border-primary-500/20 dark:bg-primary-500/10' : 'border-rose-100 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/10'}`}><p className="text-[10px] text-ink-500 dark:text-ink-400">{label}</p><p className={`mt-1 truncate text-xs font-bold ${tone === 'income' ? 'text-primary-700 dark:text-primary-300' : 'text-rose-700 dark:text-rose-300'}`}>{formatCurrency(value, unit)}</p></div>;
}

function MonthMetric({ icon: Icon, label, value, unit, tone }: { icon: typeof CalendarDays; label: string; value: number; unit: string; tone: 'income' | 'expense' | 'neutral' }) {
  const styles = tone === 'income' ? 'border-primary-100 bg-primary-50/70 text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300' : tone === 'expense' ? 'border-rose-100 bg-rose-50/70 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300' : 'border-sky-100 bg-sky-50/70 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300';
  return <Card className={`flex items-center gap-3 border p-4 ${styles}`}><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 dark:bg-ink-800"><Icon size={18} /></div><div><p className="text-xs text-ink-500 dark:text-ink-400">{label}</p><p className="mt-1 num text-base font-bold text-ink-900 dark:text-white">{value.toLocaleString('fa-IR')} <span className="text-[10px] font-medium text-ink-400">{unit}</span></p></div></Card>;
}

function EventDetail({ event, unit, onEdit, onDelete }: { event: CalendarEvent; unit: string; onEdit: () => void; onDelete: () => void }) {
  return <div className={`rounded-2xl border p-3 ${event.kind === 'income' ? 'border-primary-100 bg-primary-50/50 dark:border-primary-500/20 dark:bg-primary-500/10' : 'border-rose-100 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10'}`}><div className="flex items-start gap-2"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${event.kind === 'income' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'}`}>{event.kind === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpLeft size={15} />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{event.title}</p><p className={`num shrink-0 text-xs font-bold ${event.kind === 'income' ? 'text-primary-700 dark:text-primary-300' : 'text-rose-700 dark:text-rose-300'}`}>{event.kind === 'income' ? '+' : '-'}{formatCurrency(event.amount, unit)}</p></div><div className="mt-2 flex items-center justify-between gap-2"><EventStatusBadge status={event.status} /><div className="flex items-center gap-1"><button onClick={onEdit} className="rounded-md p-1.5 text-ink-400 hover:bg-white hover:text-primary-600 dark:hover:bg-ink-800" title="ویرایش"><Pencil size={13} /></button><button onClick={onDelete} className="rounded-md p-1.5 text-ink-400 hover:bg-white hover:text-rose-600 dark:hover:bg-ink-800" title="حذف"><Trash2 size={13} /></button></div></div></div></div></div>;
}

function EventModal({ open, onClose, event, onSave }: { open: boolean; onClose: () => void; event: CalendarEvent | null; onSave: (v: Partial<CalendarEvent>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ title: string; kind: string; amount: string; event_date: string; status: string }>({ title: event?.title ?? '', kind: event?.kind ?? 'income', amount: String(event?.amount ?? 0), event_date: event?.event_date ?? toKey(today), status: event?.status ?? 'upcoming' });
  const submit = async (formEvent: FormEvent) => { formEvent.preventDefault(); setBusy(true); await onSave({ title: form.title, kind: form.kind as CalendarEvent['kind'], amount: Number(form.amount) || 0, event_date: form.event_date, status: form.status as CalendarEvent['status'] }); setBusy(false); };
  return <Modal open={open} onClose={onClose} title={event?.id ? 'ویرایش رویداد' : 'رویداد مالی جدید'}><form onSubmit={submit} className="space-y-4"><InputField label="عنوان رویداد" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلا پرداخت حقوق" /><div className="grid gap-4 sm:grid-cols-2"><SelectField label="نوع" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} options={[{ value: 'income', label: 'دریافت' }, { value: 'expense', label: 'پرداخت' }]} /><InputField label="مبلغ" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div><div className="grid gap-4 sm:grid-cols-2"><InputField label="تاریخ" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /><SelectField label="وضعیت" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'upcoming', label: 'پیش‌رو' }, { value: 'completed', label: 'انجام شده' }, { value: 'overdue', label: 'سررسید گذشته' }]} /></div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره رویداد'}</Button></div></form></Modal>;
}
