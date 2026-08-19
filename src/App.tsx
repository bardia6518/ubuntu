import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpLeft,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt as ReceiptIcon,
  Search,
  Settings,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerStatusBadge, EventStatusBadge, InvoiceStatusBadge, RoleBadge, TeamStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useResource } from '@/hooks/useResource';
import { formatCurrency, formatDate, initials } from '@/lib/format';
import { fetchProjectProfitReport, fetchContractorDebtReport } from '@/lib/finance';
import {
  BankAccount,
  CalendarEvent,
  Customer,
  ExpenseCategory,
  Invoice,
  Project,
  Receipt,
  Service,
  TeamMember,
  Contractor,
  ContractorBill,
  ContractorPayment,
  ReportProjectProfit,
  ReportContractorDebt,
  View,
} from '@/types';
import { ProjectsPage } from '@/components/pages/ProjectsPage';
import { ReceiptsPage } from '@/components/pages/ReceiptsPage';
import { ExpensesPage } from '@/components/pages/ExpensesPage';
import { ContractorsPage } from '@/components/pages/ContractorsPage';
import { ReportsPage } from '@/components/pages/ReportsPage';
import { CalendarPage } from '@/components/pages/CalendarPage';

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'customers', label: 'مشتریان', icon: Users },
  { id: 'projects', label: 'پروژه‌ها', icon: FolderKanban },
  { id: 'invoices', label: 'فاکتورها', icon: FileText },
  { id: 'receipts', label: 'دریافت‌ها', icon: ReceiptIcon },
  { id: 'expenses', label: 'هزینه‌ها', icon: ArrowUpLeft },
  { id: 'contractors', label: 'همکاران', icon: HardHat },
  { id: 'calendar', label: 'تقویم مالی', icon: CalendarDays },
  { id: 'bank-accounts', label: 'حساب‌های بانکی', icon: Building2 },
  { id: 'team', label: 'همکاران سیستم', icon: Users },
  { id: 'reports', label: 'گزارش‌ها', icon: BarChart3 },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
  dashboard: { title: 'داشبورد مالی', eyebrow: 'نمای کلی', description: 'وضعیت مالی کسب‌وکار را در یک نگاه بررسی کنید.' },
  customers: { title: 'مشتریان', eyebrow: 'مدیریت ارتباط', description: 'اطلاعات مشتریان و وضعیت حساب آن‌ها را مدیریت کنید.' },
  projects: { title: 'پروژه‌ها', eyebrow: 'مدیریت سفارش‌ها', description: 'پروژه‌ها را مدیریت کنید و سودآوری هر سفارش را ببینید.' },
  invoices: { title: 'فاکتورها', eyebrow: 'فروش و دریافت', description: 'فاکتورها را بسازید، پیگیری کنید و وضعیت پرداخت را ببینید.' },
  receipts: { title: 'دریافت‌ها', eyebrow: 'پرداخت مشتریان', description: 'دریافت‌های مشتریان را ثبت و تأیید کنید.' },
  expenses: { title: 'هزینه‌ها', eyebrow: 'مدیریت هزینه‌ها', description: 'هزینه‌های پروژه و شرکت را ثبت و تأیید کنید.' },
  contractors: { title: 'همکاران و پیمانکاران', eyebrow: 'مدیریت همکاران', description: 'صورت‌حساب و پرداخت‌های همکاران را مدیریت کنید.' },
  calendar: { title: 'تقویم مالی', eyebrow: 'برنامه‌ریزی نقدینگی', description: 'دریافت‌ها و پرداخت‌های پیش‌رو را برنامه‌ریزی کنید.' },
  'bank-accounts': { title: 'حساب‌های بانکی', eyebrow: 'نقدینگی', description: 'موجودی حساب‌ها و جریان نقدی کسب‌وکار را مدیریت کنید.' },
  team: { title: 'همکاران سیستم', eyebrow: 'مدیریت دسترسی', description: 'اعضای تیم را اضافه کنید و سطح دسترسی آن‌ها را مدیریت کنید.' },
  reports: { title: 'گزارش‌ها', eyebrow: 'تحلیل عملکرد', description: 'تصویر دقیق‌تری از درآمد، هزینه و سود خود داشته باشید.' },
  settings: { title: 'تنظیمات', eyebrow: 'شخصی‌سازی', description: 'اطلاعات مجموعه و ترجیحات حسابیار را تنظیم کنید.' },
};

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { settings, update: updateSettings } = useCompanySettings();
  const customers = useResource<Customer>('customers');
  const invoices = useResource<Invoice>('invoices', { select: '*, customers(name)' });
  const events = useResource<CalendarEvent>('calendar_events', { orderBy: 'event_date', ascending: true });
  const accounts = useResource<BankAccount>('bank_accounts');
  const team = useResource<TeamMember>('team_members');
  const projects = useResource<Project>('projects', { select: '*, customers(name), services(name)' });
  const services = useResource<Service>('services');
  const receipts = useResource<Receipt>('receipts', { select: '*, customers(name), projects(title), bank_accounts(name)' });
  const expenses = useResource<import('@/types').Expense>('expenses', { select: '*, projects(title), expense_categories(name), bank_accounts(name)' });
  const expenseCategories = useResource<ExpenseCategory>('expense_categories');
  const contractors = useResource<Contractor>('contractors');
  const contractorBills = useResource<ContractorBill>('contractor_bills', { select: '*, contractors(name), projects(title)' });
  const contractorPayments = useResource<ContractorPayment>('contractor_payments', { select: '*, contractors(name), projects(title), bank_accounts(name)' });

  const [profitData, setProfitData] = useState<ReportProjectProfit[]>([]);
  const [contractorDebtData, setContractorDebtData] = useState<ReportContractorDebt[]>([]);

  useEffect(() => {
    fetchProjectProfitReport().then(setProfitData).catch(() => {});
    fetchContractorDebtReport().then(setContractorDebtData).catch(() => {});
  }, [projects.data, receipts.data, expenses.data, contractorPayments.data]);

  const activeNav = navItems.find((item) => item.id === view) ?? navItems[0];
  const meta = pageMeta[view] ?? pageMeta.dashboard;

  const navigate = (next: View) => {
    setView(next);
    setMobileOpen(false);
    setSearch('');
  };

  const handleRefresh = async () => {
    await Promise.all([
      customers.refresh(), invoices.refresh(), events.refresh(), accounts.refresh(), team.refresh(),
      projects.refresh(), services.refresh(), receipts.refresh(), expenses.refresh(),
      expenseCategories.refresh(), contractors.refresh(), contractorBills.refresh(), contractorPayments.refresh(),
    ]);
    fetchProjectProfitReport().then(setProfitData).catch(() => {});
    fetchContractorDebtReport().then(setContractorDebtData).catch(() => {});
    showToast('اطلاعات با موفقیت به‌روزرسانی شد', 'success');
  };

  return (
    <div className="min-h-screen bg-ink-50 text-ink-800 dark:bg-ink-950 dark:text-ink-100" dir="rtl">
      <Sidebar view={view} onNavigate={navigate} open={mobileOpen} onClose={() => setMobileOpen(false)} companyName={settings?.company_name ?? 'شرکت بردیا'} />
      <div className="lg:pr-[272px]">
        <Topbar
          view={view}
          activeLabel={activeNav.label}
          search={search}
          setSearch={setSearch}
          onMenu={() => setMobileOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          onRefresh={handleRefresh}
          onNavigate={navigate}
        />
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageHeader meta={meta} view={view} onNavigate={navigate} />
          {view === 'dashboard' && (
            <Dashboard customers={customers.data} invoices={invoices.data} events={events.data} accounts={accounts.data} loading={customers.loading || invoices.loading || accounts.loading} onNavigate={navigate} currency={settings?.currency_label} />
          )}
          {view === 'customers' && <CustomersPage resource={customers} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'projects' && <ProjectsPage resource={projects} profitData={profitData} customers={customers.data} services={services.data} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'invoices' && <InvoicesPage resource={invoices} customers={customers.data} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'receipts' && <ReceiptsPage resource={receipts} customers={customers.data} projects={projects.data} accounts={accounts.data} invoices={invoices.data} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'expenses' && <ExpensesPage resource={expenses} projects={projects.data} categories={expenseCategories.data} accounts={accounts.data} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'contractors' && <ContractorsPage contractorsResource={contractors} billsResource={contractorBills} paymentsResource={contractorPayments} debtData={contractorDebtData} projects={projects.data} accounts={accounts.data} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'calendar' && <CalendarPage resource={events} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'bank-accounts' && <AccountsPage resource={accounts} query={search} setQuery={setSearch} currency={settings?.currency_label} />}
          {view === 'team' && <TeamPage resource={team} query={search} setQuery={setSearch} />}
          {view === 'reports' && <ReportsPage currency={settings?.currency_label} />}
          {view === 'settings' && <SettingsPage settings={settings} onSave={updateSettings} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ view, onNavigate, open, onClose, companyName }: { view: View; onNavigate: (view: View) => void; open: boolean; onClose: () => void; companyName: string }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden" onClick={onClose} aria-label="بستن منو" />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-[272px] flex-col border-l border-ink-100 bg-white transition-transform duration-300 dark:border-ink-800 dark:bg-ink-900 lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between border-b border-ink-100 px-6 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20"><WalletCards size={22} /></div>
            <div><p className="text-lg font-bold tracking-tight text-ink-900 dark:text-white">حسابیار</p><p className="text-[10px] text-ink-400">مدیریت مالی هوشمند</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"><X size={18} /></button>
        </div>
        <div className="mx-4 mt-5 flex items-center gap-3 rounded-2xl bg-ink-50 p-3 dark:bg-ink-800/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-primary-700 shadow-sm dark:bg-ink-700 dark:text-primary-300">ب</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{companyName}</p><p className="mt-0.5 text-[11px] text-ink-400">فضای کاری اصلی</p></div>
          <ChevronDown size={15} className="text-ink-400" />
        </div>
        <p className="px-7 pb-2 pt-7 text-[11px] font-semibold text-ink-400">منوی اصلی</p>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = item.id === view;
            return <button key={item.id} onClick={() => onNavigate(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-right text-sm font-medium transition ${selected ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100'}`}><Icon size={18} className={selected ? 'text-white' : 'text-ink-400 group-hover:text-primary-600'} /><span className="flex-1">{item.label}</span></button>;
          })}
        </nav>
        <div className="border-t border-ink-100 p-4 dark:border-ink-800"><button onClick={() => onNavigate('settings')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"><CircleDollarSign size={18} /><span>پشتیبانی حسابیار</span><ChevronLeft size={15} className="mr-auto" /></button></div>
      </aside>
    </>
  );
}

function Topbar({ view, activeLabel, search, setSearch, onMenu, theme, toggleTheme, onRefresh, onNavigate }: { view: View; activeLabel: string; search: string; setSearch: (s: string) => void; onMenu: () => void; theme: 'light' | 'dark'; toggleTheme: () => void; onRefresh: () => void; onNavigate: (v: View) => void }) {
  return <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-ink-100 bg-white/90 px-4 backdrop-blur dark:border-ink-800 dark:bg-ink-900/90 sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button onClick={onMenu} className="rounded-xl border border-ink-200 p-2.5 text-ink-500 dark:border-ink-700 dark:text-ink-300 lg:hidden"><Menu size={18} /></button><div className="hidden items-center gap-2 text-xs text-ink-400 sm:flex"><span>حساب</span><ChevronLeft size={13} /><span className="font-medium text-ink-700 dark:text-ink-200">{activeLabel}</span></div><div className="relative hidden w-[310px] md:block"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === 'dashboard' ? 'جستجو در فاکتورها و مشتریان...' : `جستجو در ${activeLabel}...`} className="h-10 w-full rounded-xl border border-transparent bg-ink-50 pr-10 pl-3 text-sm text-ink-800 outline-none transition focus:border-primary-300 focus:bg-white dark:bg-ink-800 dark:text-white dark:focus:border-primary-700 dark:focus:bg-ink-800" /></div></div><div className="flex items-center gap-2"><button onClick={onRefresh} className="hidden rounded-xl p-2.5 text-ink-400 transition hover:bg-ink-100 hover:text-primary-600 dark:hover:bg-ink-800 sm:block" title="به‌روزرسانی"><ArrowUpLeft size={18} /></button><button onClick={toggleTheme} className="rounded-xl p-2.5 text-ink-400 transition hover:bg-ink-100 hover:text-primary-600 dark:hover:bg-ink-800" title="تغییر پوسته">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button onClick={() => onNavigate('settings')} className="relative rounded-xl p-2.5 text-ink-400 transition hover:bg-ink-100 hover:text-primary-600 dark:hover:bg-ink-800" title="اعلان‌ها"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-ink-900" /></button><div className="mr-2 hidden h-8 w-px bg-ink-100 dark:bg-ink-800 sm:block" /><button onClick={() => onNavigate('settings')} className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-ink-50 dark:hover:bg-ink-800"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">م</div><span className="hidden text-sm font-medium text-ink-700 dark:text-ink-200 sm:block">مدیر سیستم</span><ChevronDown size={14} className="text-ink-400" /></button></div></header>;
}

function PageHeader({ meta, view, onNavigate }: { meta: { title: string; eyebrow: string; description: string }; view: View; onNavigate: (v: View) => void }) {
  return <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"><span className="h-1.5 w-1.5 rounded-full bg-primary-500" />{meta.eyebrow}</div><h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">{meta.title}</h1><p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{meta.description}</p></div>{view === 'dashboard' && <Button onClick={() => onNavigate('reports')}><BarChart3 size={17} />نمای گزارش‌ها</Button>}</div>;
}

function Dashboard({ customers, invoices, events, accounts, loading, onNavigate, currency }: { customers: Customer[]; invoices: Invoice[]; events: CalendarEvent[]; accounts: BankAccount[]; loading: boolean; onNavigate: (view: View) => void; currency?: string }) {
  const unit = currency ?? 'تومان';
  const receivables = customers.reduce((sum, item) => sum + Number(item.balance), 0);
  const cash = accounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const pending = invoices.filter((item) => item.status === 'unpaid' || item.status === 'partial').reduce((sum, item) => sum + Number(item.amount), 0);
  const overdue = invoices.filter((item) => item.status === 'overdue').length;
  if (loading) return <Spinner />;
  return <div className="animate-slide-up space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="موجودی کل حساب‌ها" value={cash} unit={unit} icon={WalletCards} tone="blue" trend="۱۲٪" positive /><MetricCard label="دریافتنی‌ها" value={receivables} unit={unit} icon={ArrowDownLeft} tone="green" trend="۸٪" positive /><MetricCard label="پرداخت‌های پیش‌رو" value={pending} unit={unit} icon={ArrowUpLeft} tone="amber" trend="۳٪" /><MetricCard label="فاکتورهای سررسید گذشته" value={overdue} unit="فاکتور" icon={FileText} tone="rose" trend="نیازمند پیگیری" /></div><div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><CashflowChart /><RecentActivity invoices={invoices} events={events} onNavigate={onNavigate} unit={unit} /></div><div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"><Card className="overflow-hidden"><SectionHeader title="فاکتورهای اخیر" subtitle="آخرین وضعیت فروش و دریافت" action="مشاهده همه" onClick={() => onNavigate('invoices')} /><div className="divide-y divide-ink-100 dark:divide-ink-800">{invoices.slice(0, 4).map((invoice) => <div key={invoice.id} className="flex items-center gap-3 px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"><FileText size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{invoice.invoice_number}</p><p className="mt-0.5 truncate text-xs text-ink-400">{invoice.customers?.name ?? 'بدون مشتری'}</p></div><div className="text-left"><p className="num text-sm font-bold text-ink-800 dark:text-ink-100">{formatCurrency(invoice.amount, unit)}</p><div className="mt-1"><InvoiceStatusBadge status={invoice.status} /></div></div></div>)}{invoices.length === 0 && <EmptyState icon={FileText} title="هنوز فاکتوری ثبت نشده" description="با ساخت اولین فاکتور، اینجا اطلاعات نمایش داده می‌شود." action={<Button size="sm" onClick={() => onNavigate('invoices')}><Plus size={15} />ساخت فاکتور</Button>} />}</div></Card><Card className="overflow-hidden"><SectionHeader title="مشتریان برتر" subtitle="بر اساس مانده حساب" action="مشاهده همه" onClick={() => onNavigate('customers')} />{customers.slice().sort((a, b) => b.balance - a.balance).slice(0, 4).map((customer, index) => <div key={customer.id} className="flex items-center gap-3 border-b border-ink-100 px-5 py-4 last:border-0 dark:border-ink-800"><div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${index === 0 ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300'}`}>{initials(customer.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{customer.name}</p><p className="mt-0.5 text-xs text-ink-400">{customer.kind === 'company' ? 'حقوقی' : 'حقیقی'}</p></div><p className="num text-sm font-bold text-ink-700 dark:text-ink-200">{formatCurrency(customer.balance, unit)}</p></div>)}{customers.length === 0 && <EmptyState icon={Users} title="مشتری‌ای وجود ندارد" description="لیست مشتریان شما اینجا نمایش داده می‌شود." />}</Card></div></div>;
}

function MetricCard({ label, value, unit, icon: Icon, tone, trend, positive }: { label: string; value: number; unit: string; icon: typeof WalletCards; tone: 'blue' | 'green' | 'amber' | 'rose'; trend: string; positive?: boolean }) {
  const styles = { blue: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300', green: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' };
  return <Card className="relative overflow-hidden p-5"><div className="absolute -left-7 -top-7 h-28 w-28 rounded-full bg-ink-50/80 dark:bg-ink-800/30" /><div className="relative flex items-start justify-between"><div><p className="text-xs text-ink-500 dark:text-ink-400">{label}</p><p className="mt-3 num text-xl font-bold tracking-tight text-ink-900 dark:text-white">{value.toLocaleString('fa-IR')} <span className="text-xs font-medium text-ink-400">{unit}</span></p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}><Icon size={19} /></div></div><div className="relative mt-4 flex items-center gap-1.5 text-[11px]"><span className={positive ? 'text-primary-600 dark:text-primary-400' : tone === 'rose' ? 'text-rose-600' : 'text-amber-600'}>{positive ? <TrendingUp size={13} className="inline" /> : <TrendingDown size={13} className="inline" />} {trend}</span><span className="text-ink-400">نسبت به ماه قبل</span></div></Card>;
}

function CashflowChart() { const bars = [45, 58, 52, 69, 62, 78, 74, 88, 82, 94, 90, 100]; return <Card className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-ink-900 dark:text-white">جریان نقدی</h2><p className="mt-1 text-xs text-ink-400">گزارش درآمد و هزینه در ۶ ماه گذشته</p></div><select className="rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-xs text-ink-500 outline-none dark:border-ink-700 dark:text-ink-300"><option>۶ ماه اخیر</option><option>سال جاری</option></select></div><div className="mt-8 flex h-52 items-end gap-2 border-b border-r border-ink-100 px-2 pb-0 pt-3 dark:border-ink-800 sm:gap-4"><div className="flex h-full flex-col justify-between py-0.5 text-[10px] text-ink-400"><span>۱۰۰م</span><span>۷۵م</span><span>۵۰م</span><span>۲۵م</span><span>۰</span></div><div className="relative flex h-full flex-1 items-end justify-around gap-2 border-t border-dashed border-ink-100 bg-[linear-gradient(to_bottom,transparent_24%,rgba(148,163,184,.15)_25%,transparent_26%,transparent_49%,rgba(148,163,184,.15)_50%,transparent_51%,transparent_74%,rgba(148,163,184,.15)_75%,transparent_76%)] dark:border-ink-800"><div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-sky-100/70 to-transparent dark:from-sky-500/5" style={{ clipPath: 'polygon(0 65%, 9% 58%, 18% 63%, 27% 45%, 36% 52%, 45% 39%, 54% 44%, 63% 28%, 72% 34%, 81% 22%, 90% 25%, 100% 7%, 100% 100%, 0 100%)' }} />{bars.map((height, i) => <div key={i} className="relative z-10 flex h-full flex-1 items-end"><div className="mx-auto w-1.5 rounded-t-full bg-primary-500/70 transition-all hover:bg-primary-600" style={{ height: `${height * 0.68}%` }} /></div>)}</div></div><div className="mt-3 flex justify-around pr-8 text-[10px] text-ink-400"><span>فروردین</span><span>اردیبهشت</span><span>خرداد</span><span>تیر</span><span>مرداد</span><span>شهریور</span></div><div className="mt-5 flex items-center gap-5 text-xs text-ink-500 dark:text-ink-400"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-primary-500" />دریافت‌ها</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-amber-500" />پرداخت‌ها</span></div></Card>; }

function RecentActivity({ invoices, events, onNavigate, unit }: { invoices: Invoice[]; events: CalendarEvent[]; onNavigate: (v: View) => void; unit: string }) { const activities = [...invoices.slice(0, 2).map((item) => ({ title: `فاکتور ${item.invoice_number} ثبت شد`, sub: item.customers?.name ?? 'مشتری جدید', icon: FileText, tone: 'blue' })), ...events.slice(0, 2).map((item) => ({ title: item.kind === 'income' ? 'دریافت جدید ثبت شد' : 'پرداخت جدید ثبت شد', sub: `${item.title} · ${formatCurrency(item.amount, unit)}`, icon: item.kind === 'income' ? ArrowDownLeft : ArrowUpLeft, tone: item.kind === 'income' ? 'green' : 'amber' }))]; return <Card className="overflow-hidden"><SectionHeader title="فعالیت‌های اخیر" subtitle="آخرین تغییرات حساب" action="همه فعالیت‌ها" onClick={() => onNavigate('reports')} /><div className="divide-y divide-ink-100 dark:divide-ink-800">{activities.map((activity, i) => { const Icon = activity.icon; return <div key={i} className="flex items-center gap-3 px-5 py-4"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${activity.tone === 'green' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10' : activity.tone === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 'bg-sky-50 text-sky-600 dark:bg-sky-500/10'}`}><Icon size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{activity.title}</p><p className="mt-0.5 truncate text-xs text-ink-400">{activity.sub}</p></div><span className="text-[10px] text-ink-400">امروز</span></div> })}{activities.length === 0 && <EmptyState icon={FileBarChart} title="فعالیتی ثبت نشده" description="فعالیت‌های اخیر شما در این بخش نمایش داده می‌شود." />}</div></Card>; }

function SectionHeader({ title, subtitle, action, onClick }: { title: string; subtitle: string; action?: string; onClick?: () => void }) { return <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5"><div><h2 className="font-semibold text-ink-900 dark:text-white">{title}</h2><p className="mt-1 text-xs text-ink-400">{subtitle}</p></div>{action && <button onClick={onClick} className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"><span>{action}</span><ChevronLeft size={14} /></button>}</div>; }

interface Resource<T extends { id: string }> { data: T[]; loading: boolean; error: string | null; insert: (values: Partial<T>) => Promise<T>; update: (id: string, values: Partial<T>) => Promise<void>; remove: (id: string) => Promise<void>; }

function TableToolbar({ query, setQuery, placeholder, actionLabel, onAction }: { query: string; setQuery: (s: string) => void; placeholder: string; actionLabel: string; onAction: () => void }) { return <div className="flex flex-col gap-3 border-b border-ink-100 bg-ink-50/50 p-4 dark:border-ink-800 dark:bg-ink-800/30 sm:flex-row sm:items-center"><div className="relative flex-1"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-ink-200 bg-white pr-9 pl-3 text-sm outline-none focus:border-primary-400 dark:border-ink-700 dark:bg-ink-900 dark:text-white" /></div><Button size="sm" onClick={onAction}><Plus size={15} />{actionLabel}</Button></div>; }

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) { return <div className="flex items-center justify-end gap-1"><button onClick={onEdit} className="rounded-lg p-2 text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10" title="ویرایش"><Pencil size={15} /></button>{onDelete && <button onClick={onDelete} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="حذف"><Trash2 size={15} /></button>}</div>; }

function CustomersPage({ resource, query, setQuery, currency }: { resource: Resource<Customer>; query: string; setQuery: (value: string) => void; currency?: string }) { const [modal, setModal] = useState(false); const [editing, setEditing] = useState<Customer | null>(null); const [deleting, setDeleting] = useState<Customer | null>(null); const filtered = resource.data.filter((item) => `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.toLowerCase())); const openNew = () => { setEditing(null); setModal(true); }; return <div className="animate-slide-up"><Card className="overflow-hidden"><TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در مشتریان..." actionLabel="مشتری جدید" onAction={openNew} /><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-right"><thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900"><th className="px-5 py-4 font-medium">نام مشتری</th><th className="px-5 py-4 font-medium">نوع</th><th className="px-5 py-4 font-medium">اطلاعات تماس</th><th className="px-5 py-4 font-medium">مانده حساب</th><th className="px-5 py-4 font-medium">وضعیت</th><th className="px-5 py-4 text-left font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-ink-100 dark:divide-ink-800">{filtered.map((customer) => <tr key={customer.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">{initials(customer.name)}</div><span className="text-sm font-semibold text-ink-800 dark:text-ink-100">{customer.name}</span></div></td><td className="px-5 py-4 text-sm text-ink-500">{customer.kind === 'company' ? 'حقوقی' : 'حقیقی'}</td><td className="px-5 py-4"><p className="text-sm text-ink-700 dark:text-ink-200">{customer.phone || '—'}</p><p className="mt-0.5 text-xs text-ink-400">{customer.email || '—'}</p></td><td className="px-5 py-4 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(customer.balance, currency ?? 'تومان')}</td><td className="px-5 py-4"><CustomerStatusBadge status={customer.status} /></td><td className="px-5 py-4"><RowActions onEdit={() => { setEditing(customer); setModal(true); }} onDelete={() => setDeleting(customer)} /></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState icon={Users} title="مشتری‌ای پیدا نشد" description="با تغییر عبارت جستجو یا ثبت مشتری جدید ادامه دهید." action={<Button size="sm" onClick={openNew}><Plus size={15} />مشتری جدید</Button>} />}</div></Card><CustomerModal open={modal} onClose={() => setModal(false)} customer={editing} onSave={async (values) => { if (editing) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); }} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف مشتری؟" description={`اطلاعات «${deleting?.name}» حذف می‌شود و قابل بازگشت نیست.`} onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} /></div>; }

function CustomerModal({ open, onClose, customer, onSave }: { open: boolean; onClose: () => void; customer: Customer | null; onSave: (v: Partial<Customer>) => Promise<void> }) { const [busy, setBusy] = useState(false); const [form, setForm] = useState<{ name: string; kind: string; phone: string; email: string; status: string; balance: string }>({ name: customer?.name ?? '', kind: customer?.kind ?? 'person', phone: customer?.phone ?? '', email: customer?.email ?? '', status: customer?.status ?? 'active', balance: String(customer?.balance ?? 0) }); const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await onSave({ name: form.name, kind: form.kind as Customer['kind'], phone: form.phone, email: form.email, status: form.status as Customer['status'], balance: Number(form.balance) || 0 }); setBusy(false); }; return <Modal open={open} onClose={onClose} title={customer ? 'ویرایش مشتری' : 'ثبت مشتری جدید'} description="اطلاعات مشتری را وارد کنید."><form onSubmit={submit} className="space-y-4"><InputField label="نام مشتری" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلا شرکت آریا" /><div className="grid gap-4 sm:grid-cols-2"><SelectField label="نوع مشتری" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} options={[{ value: 'person', label: 'حقیقی' }, { value: 'company', label: 'حقوقی' }]} /><SelectField label="وضعیت" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'فعال' }, { value: 'pending', label: 'در انتظار' }, { value: 'completed', label: 'تکمیل شده' }]} /></div><div className="grid gap-4 sm:grid-cols-2"><InputField label="شماره تماس" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><InputField label="ایمیل" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><InputField label="مانده حساب" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}</Button></div></form></Modal>; }

function InvoicesPage({ resource, customers, query, setQuery, currency }: { resource: Resource<Invoice>; customers: Customer[]; query: string; setQuery: (value: string) => void; currency?: string }) { const [modal, setModal] = useState(false); const [editing, setEditing] = useState<Invoice | null>(null); const [deleting, setDeleting] = useState<Invoice | null>(null); const filtered = resource.data.filter((item) => `${item.invoice_number} ${item.customers?.name}`.toLowerCase().includes(query.toLowerCase())); const openNew = () => { setEditing(null); setModal(true); }; return <div className="animate-slide-up"><Card className="overflow-hidden"><TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در فاکتورها..." actionLabel="فاکتور جدید" onAction={openNew} /><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right"><thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900"><th className="px-5 py-4 font-medium">شماره فاکتور</th><th className="px-5 py-4 font-medium">مشتری</th><th className="px-5 py-4 font-medium">مبلغ</th><th className="px-5 py-4 font-medium">تاریخ سررسید</th><th className="px-5 py-4 font-medium">وضعیت</th><th className="px-5 py-4 text-left font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-ink-100 dark:divide-ink-800">{filtered.map((invoice) => <tr key={invoice.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40"><td className="px-5 py-4 text-sm font-semibold text-primary-700 dark:text-primary-300">{invoice.invoice_number}</td><td className="px-5 py-4 text-sm text-ink-700 dark:text-ink-200">{invoice.customers?.name ?? '—'}</td><td className="px-5 py-4 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(invoice.amount, currency ?? 'تومان')}</td><td className="px-5 py-4 text-sm text-ink-500">{formatDate(invoice.due_date)}</td><td className="px-5 py-4"><InvoiceStatusBadge status={invoice.status} /></td><td className="px-5 py-4"><RowActions onEdit={() => { setEditing(invoice); setModal(true); }} onDelete={() => setDeleting(invoice)} /></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState icon={FileText} title="فاکتوری پیدا نشد" description="برای شروع اولین فاکتور خود را ثبت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />فاکتور جدید</Button>} />}</div></Card><InvoiceModal open={modal} onClose={() => setModal(false)} invoice={editing} customers={customers} onSave={async (values) => { if (editing) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); }} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف فاکتور؟" description={`فاکتور «${deleting?.invoice_number}» حذف می‌شود.`} onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} /></div>; }

function InvoiceModal({ open, onClose, invoice, customers, onSave }: { open: boolean; onClose: () => void; invoice: Invoice | null; customers: Customer[]; onSave: (v: Partial<Invoice>) => Promise<void> }) { const [busy, setBusy] = useState(false); const [form, setForm] = useState<{ invoice_number: string; customer_id: string; amount: string; issue_date: string; due_date: string; status: string }>({ invoice_number: invoice?.invoice_number ?? `INV-${1000 + Math.floor(Math.random() * 9000)}`, customer_id: invoice?.customer_id ?? customers[0]?.id ?? '', amount: String(invoice?.amount ?? 0), issue_date: invoice?.issue_date ?? new Date().toISOString().slice(0, 10), due_date: invoice?.due_date ?? new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10), status: invoice?.status ?? 'unpaid' }); const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await onSave({ invoice_number: form.invoice_number, customer_id: form.customer_id || null, amount: Number(form.amount) || 0, issue_date: form.issue_date, due_date: form.due_date, status: form.status as Invoice['status'] }); setBusy(false); }; return <Modal open={open} onClose={onClose} title={invoice ? 'ویرایش فاکتور' : 'ساخت فاکتور جدید'}><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><InputField label="شماره فاکتور" required value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /><SelectField label="مشتری" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} options={[{ value: '', label: 'بدون مشتری' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} /></div><InputField label="مبلغ" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /><div className="grid gap-4 sm:grid-cols-2"><InputField label="تاریخ صدور" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /><InputField label="تاریخ سررسید" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div><SelectField label="وضعیت پرداخت" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'unpaid', label: 'در انتظار پرداخت' }, { value: 'paid', label: 'پرداخت شده' }, { value: 'overdue', label: 'سررسید گذشته' }]} /><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره فاکتور'}</Button></div></form></Modal>; }


function AccountsPage({ resource, query, setQuery, currency }: { resource: Resource<BankAccount>; query: string; setQuery: (value: string) => void; currency?: string }) { const [modal, setModal] = useState(false); const [editing, setEditing] = useState<BankAccount | null>(null); const [deleting, setDeleting] = useState<BankAccount | null>(null); const filtered = resource.data.filter((item) => `${item.name} ${item.bank_name} ${item.account_number}`.toLowerCase().includes(query.toLowerCase())); const openNew = () => { setEditing(null); setModal(true); }; return <div className="animate-slide-up"><div className="mb-5 grid gap-4 sm:grid-cols-3">{resource.data.map((account) => <Card key={account.id} className="p-5"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"><CreditCard size={19} /></div><button onClick={() => { setEditing(account); setModal(true); }} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"><MoreHorizontal size={17} /></button></div><p className="mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">{account.name}</p><p className="mt-1 text-xs text-ink-400">{account.bank_name} · {account.account_number}</p><p className="mt-4 num text-lg font-bold text-ink-900 dark:text-white">{formatCurrency(account.balance, currency ?? 'تومان')}</p></Card>)}</div><Card className="overflow-hidden"><TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در حساب‌ها..." actionLabel="حساب جدید" onAction={openNew} /><div className="divide-y divide-ink-100 dark:divide-ink-800">{filtered.map((account) => <div key={account.id} className="flex items-center gap-4 px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10"><Building2 size={18} /></div><div className="flex-1"><p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{account.name}</p><p className="mt-1 text-xs text-ink-400">{account.bank_name} · {account.account_number}</p></div><p className="num text-sm font-bold text-ink-800 dark:text-ink-100">{formatCurrency(account.balance, currency ?? 'تومان')}</p><RowActions onEdit={() => { setEditing(account); setModal(true); }} onDelete={() => setDeleting(account)} /></div>)}{filtered.length === 0 && <EmptyState icon={Building2} title="حسابی پیدا نشد" description="اولین حساب بانکی خود را اضافه کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />حساب جدید</Button>} />}</div></Card><AccountModal open={modal} onClose={() => setModal(false)} account={editing} onSave={async (values) => { if (editing) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); }} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف حساب؟" description={`حساب «${deleting?.name}» حذف می‌شود.`} onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} /></div>; }

function AccountModal({ open, onClose, account, onSave }: { open: boolean; onClose: () => void; account: BankAccount | null; onSave: (v: Partial<BankAccount>) => Promise<void> }) { const [busy, setBusy] = useState(false); const [form, setForm] = useState({ name: account?.name ?? '', bank_name: account?.bank_name ?? '', account_number: account?.account_number ?? '', balance: String(account?.balance ?? 0) }); const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await onSave({ name: form.name, bank_name: form.bank_name, account_number: form.account_number, balance: Number(form.balance) || 0 }); setBusy(false); }; return <Modal open={open} onClose={onClose} title={account ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی'}><form onSubmit={submit} className="space-y-4"><InputField label="عنوان حساب" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><div className="grid gap-4 sm:grid-cols-2"><InputField label="نام بانک" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /><InputField label="شماره حساب" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div><InputField label="موجودی فعلی" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره حساب'}</Button></div></form></Modal>; }

function TeamPage({ resource, query, setQuery }: { resource: Resource<TeamMember>; query: string; setQuery: (value: string) => void }) { const [modal, setModal] = useState(false); const [editing, setEditing] = useState<TeamMember | null>(null); const [deleting, setDeleting] = useState<TeamMember | null>(null); const filtered = resource.data.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase())); const openNew = () => { setEditing(null); setModal(true); }; return <div className="animate-slide-up"><Card className="overflow-hidden"><TableToolbar query={query} setQuery={setQuery} placeholder="جستجو در همکاران..." actionLabel="دعوت همکار" onAction={openNew} /><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right"><thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900"><th className="px-5 py-4 font-medium">نام و ایمیل</th><th className="px-5 py-4 font-medium">نقش</th><th className="px-5 py-4 font-medium">وضعیت</th><th className="px-5 py-4 text-left font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-ink-100 dark:divide-ink-800">{filtered.map((member) => <tr key={member.id} className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">{initials(member.name || member.email)}</div><div><p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{member.name || 'بدون نام'}</p><p className="mt-0.5 text-xs text-ink-400">{member.email}</p></div></div></td><td className="px-5 py-4"><RoleBadge role={member.role} /></td><td className="px-5 py-4"><TeamStatusBadge status={member.status} /></td><td className="px-5 py-4"><RowActions onEdit={() => { setEditing(member); setModal(true); }} onDelete={() => setDeleting(member)} /></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState icon={Users} title="همکاری ثبت نشده" description="اعضای تیم خود را برای همکاری دعوت کنید." action={<Button size="sm" onClick={openNew}><Plus size={15} />دعوت همکار</Button>} />}</div></Card><TeamModal open={modal} onClose={() => setModal(false)} member={editing} onSave={async (values) => { if (editing) await resource.update(editing.id, values); else await resource.insert(values); setModal(false); }} /><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="حذف همکار؟" description="دسترسی این همکار از فضای کاری حذف می‌شود." onConfirm={async () => { if (deleting) await resource.remove(deleting.id); setDeleting(null); }} /></div>; }

function TeamModal({ open, onClose, member, onSave }: { open: boolean; onClose: () => void; member: TeamMember | null; onSave: (v: Partial<TeamMember>) => Promise<void> }) { const [busy, setBusy] = useState(false); const [form, setForm] = useState<{ name: string; email: string; role: string; status: string }>({ name: member?.name ?? '', email: member?.email ?? '', role: member?.role ?? 'viewer', status: member?.status ?? 'invited' }); const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await onSave({ name: form.name, email: form.email, role: form.role as TeamMember['role'], status: form.status as TeamMember['status'] }); setBusy(false); }; return <Modal open={open} onClose={onClose} title={member ? 'ویرایش همکار' : 'دعوت همکار جدید'}><form onSubmit={submit} className="space-y-4"><InputField label="نام" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><InputField label="ایمیل" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><div className="grid gap-4 sm:grid-cols-2"><SelectField label="نقش" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[{ value: 'admin', label: 'مدیر مالی' }, { value: 'accountant', label: 'حسابدار' }, { value: 'viewer', label: 'مشاهده‌گر' }]} /><SelectField label="وضعیت" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'فعال' }, { value: 'invited', label: 'دعوت شده' }]} /></div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ارسال دعوت'}</Button></div></form></Modal>; }

function SettingsPage({ settings, onSave }: { settings: { company_name: string; currency_label: string } | null; onSave: (v: { company_name?: string; currency_label?: string }) => Promise<void> }) { const [form, setForm] = useState({ company_name: settings?.company_name ?? '', currency_label: settings?.currency_label ?? 'تومان' }); const [busy, setBusy] = useState(false); const { showToast } = useToast(); const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await onSave(form); setBusy(false); showToast('تنظیمات با موفقیت ذخیره شد'); }; return <div className="animate-slide-up grid max-w-3xl gap-6"><Card className="p-6"><div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"><Settings size={19} /></div><div><h2 className="font-semibold text-ink-900 dark:text-white">اطلاعات مجموعه</h2><p className="mt-1 text-xs text-ink-400">این اطلاعات در فضای کاری شما نمایش داده می‌شود.</p></div></div><form onSubmit={submit} className="space-y-4"><InputField label="نام مجموعه" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /><SelectField label="واحد پول" value={form.currency_label} onChange={(e) => setForm({ ...form, currency_label: e.target.value })} options={[{ value: 'تومان', label: 'تومان' }, { value: 'ریال', label: 'ریال' }, { value: 'دلار', label: 'دلار' }]} /><div className="flex justify-end pt-2"><Button type="submit" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</Button></div></form></Card><Card className="p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10"><FileBarChart size={19} /></div><div><h2 className="font-semibold text-ink-900 dark:text-white">راهنمای حسابیار</h2><p className="mt-1 text-xs text-ink-400">برای شروع سریع از بخش‌های مختلف استفاده کنید.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Tip icon={Users} text="مشتریان خود را ثبت و مانده حساب را پیگیری کنید." /><Tip icon={FileText} text="فاکتورها را برای کنترل دریافت‌ها مدیریت کنید." /><Tip icon={CalendarDays} text="پرداخت‌ها و دریافت‌های پیش‌رو را برنامه‌ریزی کنید." /><Tip icon={BarChart3} text="گزارش‌های مالی را برای تصمیم‌گیری ببینید." /></div></Card></div>; }
function Tip({ icon: Icon, text }: { icon: typeof Users; text: string }) { return <div className="flex items-start gap-3 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60"><Icon size={16} className="mt-0.5 shrink-0 text-primary-600" /><p className="text-xs leading-5 text-ink-600 dark:text-ink-300">{text}</p></div>; }

export default App;
