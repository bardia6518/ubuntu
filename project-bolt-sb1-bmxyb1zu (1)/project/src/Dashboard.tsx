import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sun,
  UserCircle,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Modal, useApp } from '@/App';

const toFa = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

type PageKey = 'dashboard' | 'clients' | 'invoices' | 'calendar' | 'bank' | 'team' | 'reports' | 'settings';
type PageConfig = { title: string; eyebrow: string; desc: string; action: string };

const pages: Record<PageKey, PageConfig> = {
  dashboard: { title: 'داشبورد مالی', eyebrow: 'نمای کلی', desc: 'وضعیت مالی کسب‌وکار را در یک نگاه بررسی کنید.', action: 'ثبت رویداد' },
  clients: { title: 'مشتریان', eyebrow: 'مدیریت ارتباط', desc: 'اطلاعات مشتریان و مانده حساب را مدیریت کنید.', action: 'مشتری جدید' },
  invoices: { title: 'فاکتورها', eyebrow: 'فروش و دریافت', desc: 'فاکتورها را ثبت و وضعیت پرداخت را دنبال کنید.', action: 'فاکتور جدید' },
  calendar: { title: 'تقویم مالی', eyebrow: 'سررسیدها', desc: 'دریافت‌ها و پرداخت‌های پیش‌رو را برنامه‌ریزی کنید.', action: 'رویداد جدید' },
  bank: { title: 'حساب‌های بانکی', eyebrow: 'تراکنش‌ها', desc: 'حساب‌ها و پرداخت‌های بانکی را بررسی کنید.', action: 'حساب جدید' },
  team: { title: 'همکاران', eyebrow: 'مدیریت دسترسی', desc: 'اعضای تیم و سطح دسترسی آن‌ها را مدیریت کنید.', action: 'دعوت همکار' },
  reports: { title: 'گزارش‌ها', eyebrow: 'تحلیل مالی', desc: 'گزارش‌های دقیق و کاربردی برای تصمیم‌گیری بهتر.', action: 'گزارش جدید' },
  settings: { title: 'تنظیمات', eyebrow: 'تنظیمات فضای کاری', desc: 'اطلاعات شرکت، دسترسی‌ها و تنظیمات حساب را مدیریت کنید.', action: 'ذخیره تغییرات' },
};

const navItems: { key: PageKey; label: string; icon: typeof Home; badge?: string }[] = [
  { key: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { key: 'clients', label: 'مشتریان', icon: Users },
  { key: 'invoices', label: 'فاکتورها', icon: FileText, badge: '7' },
  { key: 'calendar', label: 'تقویم مالی', icon: CalendarDays },
  { key: 'bank', label: 'حساب‌های بانکی', icon: Landmark },
  { key: 'team', label: 'همکاران', icon: Users },
];

type Props = { onExit: () => void };

export default function Dashboard({ onExit }: Props) {
  const { theme, toggleTheme, toast } = useApp();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const cfg = pages[page];

  const handleAction = () => setModalOpen(true);
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalOpen(false);
    toast('با موفقیت ثبت شد', `${cfg.action} انجام شد.`);
  };

  return (
    <div className="dash-app" dir="rtl">
      {sidebarOpen && <div className="dash-overlay show" onClick={() => setSidebarOpen(false)} />}
      <aside className={`dash-side ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <span className="dash-brand-mark"><Wallet size={20} strokeWidth={2.5} /></span>
          <div><strong>هساو</strong><span>حسابداری ابری</span></div>
          <button className="nav-toggle" style={{ marginRight: 'auto', display: sidebarOpen ? 'grid' : 'none' }} onClick={() => setSidebarOpen(false)} aria-label="بستن"><X size={18} /></button>
        </div>
        <div className="dash-ws">
          <span className="dash-ws-avatar">ب</span>
          <div><strong>شرکت بردیا</strong><span>فضای کاری اصلی</span></div>
          <ChevronDown size={16} color="var(--ink-4)" />
        </div>
        <div className="dash-nav-label">منوی اصلی</div>
        {navItems.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} className={`dash-nav-item ${page === key ? 'active' : ''}`} onClick={() => { setPage(key); setSidebarOpen(false); }}>
            <Icon size={18} /><span>{label}</span>
            {badge && <span className="badge">{toFa(badge)}</span>}
          </button>
        ))}
        <div className="dash-nav-label spaced">سایر</div>
        <button className={`dash-nav-item ${page === 'reports' ? 'active' : ''}`} onClick={() => { setPage('reports'); setSidebarOpen(false); }}><SlidersHorizontal size={18} /><span>گزارش‌ها</span></button>
        <button className={`dash-nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => { setPage('settings'); setSidebarOpen(false); }}><SettingsIcon size={18} /><span>تنظیمات</span></button>
        <div className="dash-side-foot">
          <span className="dash-help-ic"><CircleHelp size={18} /></span>
          <div><strong>نیاز به کمک دارید؟</strong><span>با ما در تماس باشید</span></div>
          <ArrowLeft size={15} color="var(--ink-4)" />
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-right">
            <button className="dash-icon-btn dash-mobile-toggle" onClick={() => setSidebarOpen(true)} aria-label="منو"><Menu size={20} /></button>
            <div className="dash-crumb"><span>هساو</span><ChevronLeft size={14} /><strong>{cfg.title}</strong></div>
          </div>
          <div className="dash-topbar-left" style={{ position: 'relative' }}>
            <label className="dash-search">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در مشتریان، فاکتورها..." />
            </label>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="تغییر تم">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="dash-icon-btn" aria-label="اعلان‌ها" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}><Bell size={19} /><i className="dot" /></button>
              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-head"><strong>اعلان‌ها</strong><button onClick={() => { setNotifOpen(false); toast('همه خوانده شدند', 'اعلان‌ها علامت‌گذاری شدند.'); }}>علامت‌گذاری همه</button></div>
                  <div className="notif-item" onClick={() => { setNotifOpen(false); setPage('invoices'); toast('فاکتور سررسید شده', '۲ فاکتور نیازمند پیگیری هستند.'); }}><span className="notif-dot" /><div><strong>۲ فاکتور سررسید شده</strong><span>نیازمند پیگیری فوری</span></div></div>
                  <div className="notif-item" onClick={() => { setNotifOpen(false); setPage('bank'); toast('تراکنش جدید', 'تراکنش بانکی جدید ثبت شد.'); }}><span className="notif-dot" /><div><strong>تراکنش بانکی جدید</strong><span>واریز ۲۵۰ میلیون تومان</span></div></div>
                  <div className="notif-item" onClick={() => { setNotifOpen(false); setPage('clients'); toast('مشتری جدید', 'مشتری جدید اضافه شد.'); }}><span className="notif-dot" /><div><strong>مشتری جدید اضافه شد</strong><span>شرکت توسعه نرم‌افزار بردیا</span></div></div>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button className="dash-profile" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}>
                <span className="dash-profile-avatar">م</span>
                <span><strong>مدیر سیستم</strong><small>دسترسی کامل</small></span>
                <ChevronDown size={15} color="var(--ink-4)" />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <button onClick={() => { setProfileOpen(false); setPage('settings'); toast('تنظیمات', 'به بخش تنظیمات منتقل شدید.'); }}><UserCircle size={17} /> پروفایل من</button>
                  <button onClick={() => { setProfileOpen(false); setPage('settings'); toast('تنظیمات', 'به بخش تنظیمات منتقل شدید.'); }}><SettingsIcon size={17} /> تنظیمات حساب</button>
                  <button onClick={() => { setProfileOpen(false); toggleTheme(); toast('تغییر تم', theme === 'light' ? 'حالت تاریک فعال شد.' : 'حالت روشن فعال شد.'); }}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />} {theme === 'light' ? 'حالت تاریک' : 'حالت روشن'}</button>
                  <button onClick={() => { setProfileOpen(false); onExit(); }} style={{ color: 'var(--rose)' }}><LogOut size={17} /> خروج از حساب</button>
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onExit}>خروج</button>
          </div>
        </header>

        <div className="dash-content">
          <section className="dash-heading">
            <div>
              <span className="eyebrow"><span style={{ color: 'var(--teal)' }}>✦</span> {cfg.eyebrow}</span>
              <h1 style={{ marginTop: 12 }}>{cfg.title}</h1>
              <p>{cfg.desc}</p>
            </div>
            <div className="dash-heading-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => toast('گزینه‌های بیشتر', 'این بخش در حال توسعه است.')}><MoreHorizontal size={17} /></button>
              <button className="btn btn-primary btn-sm" onClick={handleAction}><Plus size={17} /> {cfg.action}</button>
            </div>
          </section>

          {page === 'dashboard' && <DashboardPage />}
          {page === 'clients' && <ClientsPage search={search} />}
          {page === 'invoices' && <InvoicesPage search={search} />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'bank' && <BankPage search={search} />}
          {page === 'team' && <TeamPage />}
          {page === 'reports' && <ReportsPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>

      {modalOpen && (
        <Modal title={cfg.action} onClose={() => setModalOpen(false)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>انصراف</button>
            <button className="btn btn-primary btn-sm" form="action-form" type="submit">ثبت</button>
          </>
        }>
          <form id="action-form" onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>فرم زیر را برای «{cfg.action}» تکمیل کنید.</p>
            <div className="modal-field"><label>عنوان</label><input required placeholder="عنوان را وارد کنید" /></div>
            <div className="modal-field"><label>مبلغ (تومان)</label><input type="number" required placeholder="0" dir="ltr" /></div>
            <div className="modal-field"><label>توضیحات</label><textarea placeholder="توضیحات اختیاری..." /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, detail, tone, icon: Icon }: { label: string; value: string; detail: string; tone: string; icon: typeof Home }) {
  return (
    <article className="dash-stat">
      <span className={`dash-stat-ic ${tone}`}><Icon size={20} /></span>
      <div className="dash-stat-body">
        <span>{label}</span>
        <strong className="np">{value}</strong>
        <small>{detail}</small>
      </div>
      <ArrowUpRight size={17} color="var(--ink-4)" style={{ position: 'relative', zIndex: 1 }} />
    </article>
  );
}

function DashboardPage() {
  const { toast } = useApp();
  return (
    <>
      <section className="dash-stats">
        <StatCard label="موجودی کل حساب‌ها" value={`${toFa('۸۰,۳۲۱,۵۷۰,۰۰۰')} ت`} detail="۲.۴٪ بیشتر از ماه قبل" tone="ic-brand" icon={Wallet} />
        <StatCard label="دریافتنی‌ها" value={`${toFa('۱۲,۵۹۰,۶۷۰,۰۰۰')} ت`} detail="۴ فاکتور در انتظار" tone="ic-teal" icon={ArrowDownLeft} />
        <StatCard label="پرداختنی‌ها" value={`${toFa('۸,۰۳۲,۱۵۷,۰۰۰')} ت`} detail="۳ پرداخت این هفته" tone="ic-amber" icon={ArrowUpRight} />
        <StatCard label="فاکتورهای باز" value={toFa('۳۲')} detail="۷ مورد نیازمند پیگیری" tone="ic-rose" icon={FileCheck2} />
      </section>
      <div className="dash-layout">
        <section className="dash-panel dash-panel-pad">
          <div className="dash-panel-head">
            <div><h2>جریان نقدی</h2><p>گردش مالی در شش ماه گذشته</p></div>
            <select className="dash-select" defaultValue="6m" onChange={() => toast('بازه تغییر کرد', 'نمودار به‌روزرسانی شد.')}>
              <option value="6m">۶ ماه اخیر</option><option value="3m">۳ ماه اخیر</option><option value="1y">یک سال</option>
            </select>
          </div>
          <div className="dash-chart-legend">
            <span><i className="dash-legend-dot" style={{ background: 'var(--brand)' }} /> دریافتی</span>
            <span><i className="dash-legend-dot" style={{ background: 'var(--amber)' }} /> پرداختی</span>
          </div>
          <div className="dash-chart">
            <div className="dash-chart-y"><span>۸۰م</span><span>۶۰م</span><span>۴۰م</span><span>۲۰م</span><span>۰</span></div>
            <div className="dash-chart-area">
              <div className="dash-grid-lines"><i /><i /><i /><i /><i /></div>
              <svg viewBox="0 0 620 200" preserveAspectRatio="none" className="dash-chart-svg">
                <defs><linearGradient id="dg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity=".22" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
                <path d="M0,140 C40,120 62,134 95,102 S150,90 184,108 S235,78 270,88 S315,46 350,68 S405,50 450,56 S505,32 535,45 S575,24 620,12 L620,200 L0,200Z" fill="url(#dg)" />
                <path d="M0,140 C40,120 62,134 95,102 S150,90 184,108 S235,78 270,88 S315,46 350,68 S405,50 450,56 S505,32 535,45 S575,24 620,12" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
                <path d="M0,165 C48,148 69,160 105,138 S160,128 195,148 S245,114 280,134 S330,96 365,114 S410,98 450,118 S505,86 540,102 S585,74 620,80" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
              </svg>
              <div className="dash-chart-x"><span>فروردین</span><span>اردیبهشت</span><span>خرداد</span><span>تیر</span><span>مرداد</span><span>شهریور</span></div>
            </div>
          </div>
        </section>
        <section className="dash-panel dash-panel-pad">
          <div className="dash-panel-head">
            <div><h2>فعالیت‌های اخیر</h2><p>آخرین تغییرات حساب</p></div>
            <button className="dash-text-btn" onClick={() => toast('فعالیت‌ها', 'نمایش کامل تاریخچه در حال توسعه است.')}>همه <ArrowLeft size={14} /></button>
          </div>
          <div className="dash-activity">
            <Activity icon={FileText} tone="ic-brand" title="فاکتور جدید ثبت شد" meta="فاکتور INV-۰۲۶-۰۰۹۰۴" time="امروز، ۱۰:۴۲" onClick={() => toast('فاکتور ثبت شد', 'فاکتور INV-۰۲۶-۰۰۹۰۴')} />
            <Activity icon={ArrowDownLeft} tone="ic-teal" title="دریافت وجه ثبت شد" meta="واریز از شرکت راهکار دیجیتال" time="امروز، ۰۹:۱۸" onClick={() => toast('دریافت وجه', 'واریز از شرکت راهکار دیجیتال')} />
            <Activity icon={Users} tone="ic-amber" title="مشتری جدید اضافه شد" meta="شرکت توسعه نرم‌افزار بردیا" time="دیروز، ۱۶:۳۰" onClick={() => toast('مشتری جدید', 'شرکت توسعه نرم‌افزار بردیا')} />
            <Activity icon={Bell} tone="ic-rose" title="یادآوری سررسید" meta="۲ فاکتور در انتظار پرداخت" time="دیروز، ۱۳:۰۵" onClick={() => toast('یادآوری سررسید', '۲ فاکتور در انتظار پرداخت')} />
          </div>
        </section>
      </div>
      <section className="dash-panel dash-panel-pad">
        <div className="dash-panel-head">
          <div><h2>کارهای امروز</h2><p>موارد نیازمند توجه شما</p></div>
          <button className="dash-text-btn" onClick={() => toast('کارهای امروز', 'نمایش کامل لیست در حال توسعه است.')}>مشاهده همه <ArrowLeft size={14} /></button>
        </div>
        <div style={{ marginTop: 18 }}>
          <Task title="پیگیری فاکتورهای سررسید شده" meta="آخرین بروزرسانی امروز" count="۲ مورد" tone="danger" onClick={() => toast('پیگیری فاکتورها', '۲ فاکتور سررسید شده')} />
          <Task title="تکمیل اطلاعات مشتریان جدید" meta="آخرین بروزرسانی امروز" count="۵ مورد" tone="warning" onClick={() => toast('تکمیل اطلاعات', '۵ مشتری نیازمند تکمیل اطلاعات')} />
          <Task title="بررسی تراکنش‌های بانکی" meta="آخرین بروزرسانی امروز" count="۳ مورد" tone="success" onClick={() => toast('تراکنش‌های بانکی', '۳ تراکنش نیازمند بررسی')} />
        </div>
      </section>
    </>
  );
}

function Activity({ icon: Icon, tone, title, meta, time, onClick }: { icon: typeof Home; tone: string; title: string; meta: string; time: string; onClick: () => void }) {
  return (
    <div className="dash-activity-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <span className={`dash-activity-ic ${tone}`}><Icon size={17} /></span>
      <div className="dash-activity-body"><strong>{title}</strong><span>{meta}</span></div>
      <time className="dash-activity-time">{time}</time>
    </div>
  );
}

function Task({ title, meta, count, tone, onClick }: { title: string; meta: string; count: string; tone: string; onClick: () => void }) {
  return (
    <div className="dash-task" onClick={onClick} style={{ cursor: 'pointer' }}>
      <span className={`dash-task-dot ${tone}`} />
      <div className="dash-task-body"><strong>{title}</strong><small>{meta}</small></div>
      <b className="np">{count}</b>
      <ChevronLeft size={17} />
    </div>
  );
}

function TableToolbar({ placeholder, onFilter, onExport }: { placeholder: string; onFilter: () => void; onExport: () => void }) {
  return (
    <div className="dash-table-toolbar">
      <label className="dash-table-search"><Search size={16} /><input placeholder={placeholder} /></label>
      <button className="dash-filter-btn" onClick={onFilter}><SlidersHorizontal size={15} /> فیلترها</button>
      <select className="dash-table-select" defaultValue="25" onChange={() => {}}><option value="25">۲۵ ردیف</option><option value="50">۵۰ ردیف</option></select>
      <button className="dash-filter-btn" onClick={onExport}><ArrowDownLeft size={15} /> خروجی</button>
    </div>
  );
}

function ClientsPage({ search }: { search: string }) {
  const { toast } = useApp();
  return (
    <>
      <section className="dash-stats">
        <StatCard label="مشتریان فعال" value={toFa('۱۲۸')} detail="۳ مورد جدید این ماه" tone="ic-brand" icon={Users} />
        <StatCard label="مطالبات کل" value={`${toFa('۲۴,۵۰۰,۰۰۰')} ت`} detail="۳.۲٪ نسبت به ماه قبل" tone="ic-teal" icon={Wallet} />
        <StatCard label="افتتاحیه ناقص" value={toFa('۳')} detail="نیازمند تکمیل" tone="ic-amber" icon={CircleHelp} />
        <StatCard label="پرونده ناقص" value={toFa('۷')} detail="در انتظار اطلاعات" tone="ic-rose" icon={FileCheck2} />
      </section>
      <section className="dash-panel dash-panel-pad">
        <div className="dash-panel-head"><div><h2>فهرست مشتریان</h2><p>اطلاعات حسابداری و وضعیت اعتباری</p></div></div>
        <div style={{ marginTop: 18 }}>
          <TableToolbar placeholder="جستجوی مشتری، شناسه یا تماس..." onFilter={() => toast('فیلترها', 'پنل فیلترها به‌زودی فعال می‌شود.')} onExport={() => toast('خروجی گرفتن', 'فایل CSV آماده شد.')} />
          <DataTable type="clients" search={search} onRowClick={(row) => toast('مشتری', row[1])} />
        </div>
      </section>
    </>
  );
}

function InvoicesPage({ search }: { search: string }) {
  const { toast } = useApp();
  return (
    <>
      <section className="dash-stats">
        <StatCard label="تسویه‌نشده" value={toFa('۱۲۷')} detail="در انتظار دریافت" tone="ic-rose" icon={FileText} />
        <StatCard label="قابل دریافت" value={`${toFa('۱۲,۵۹۰,۶۷۰,۰۰۰')} ت`} detail="۴.۱٪ بیشتر" tone="ic-brand" icon={Wallet} />
        <StatCard label="سررسید گذشته" value={toFa('۱۲')} detail="نیازمند پیگیری" tone="ic-amber" icon={CalendarDays} />
        <StatCard label="پرداختی ماه" value={`${toFa('۲,۳۴۰,۰۰۰')} ت`} detail="تا پایان شهریور" tone="ic-teal" icon={ArrowUpRight} />
      </section>
      <section className="dash-panel dash-panel-pad">
        <div className="dash-panel-head"><div><h2>فهرست فاکتورها</h2><p>وضعیت دریافت مبالغ</p></div></div>
        <div style={{ marginTop: 18 }}>
          <TableToolbar placeholder="شماره فاکتور یا مشتری..." onFilter={() => toast('فیلترها', 'پنل فیلترها به‌زودی فعال می‌شود.')} onExport={() => toast('خروجی گرفتن', 'فایل CSV آماده شد.')} />
          <DataTable type="invoices" search={search} onRowClick={(row) => toast('فاکتور', row[0])} />
        </div>
      </section>
    </>
  );
}

function CalendarPage() {
  const { toast } = useApp();
  const [range, setRange] = useState(1);
  return (
    <>
      <section className="dash-stats">
        <StatCard label="دریافت امروز" value={`${toFa('۸۰۰,۰۰۰')} ت`} detail="۴ رویداد امروز" tone="ic-teal" icon={ArrowDownLeft} />
        <StatCard label="پرداخت امروز" value={`${toFa('۲۳۰,۰۰۰')} ت`} detail="تعهدات امروز" tone="ic-amber" icon={ArrowUpRight} />
        <StatCard label="خالص امروز" value={`${toFa('۵۷۰,۰۰۰')} ت`} detail="دریافت منهای پرداخت" tone="ic-brand" icon={Wallet} />
        <StatCard label="سررسید گذشته" value={toFa('۳')} detail="نیازمند پیگیری" tone="ic-rose" icon={Bell} />
      </section>
      <section className="dash-panel dash-panel-pad">
        <div className="dash-panel-head">
          <div><h2>پیش‌بینی جریان نقدی</h2><p>بر اساس تعهدات واقعی</p></div>
          <div style={{ display: 'flex', gap: 4, border: '1px solid var(--line)', borderRadius: 9, padding: 3 }}>
            {['۷ روز', '۳۰ روز', '۹۰ روز'].map((t, i) => (
              <button key={t} onClick={() => { setRange(i); toast('بازه تغییر کرد', `نمایش ${t}`); }} style={{ border: 0, background: range === i ? 'var(--brand-soft)' : 'transparent', color: range === i ? 'var(--brand)' : 'var(--ink-4)', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: range === i ? 600 : 400, cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
        </div>
        <div className="dash-forecast">
          <div className="dash-forecast-card"><span>دریافت مورد انتظار</span><strong className="np">{toFa('۶۸۸,۸۴۵,۰۰۰')} ت</strong></div>
          <div className="dash-forecast-card"><span>پرداخت مورد انتظار</span><strong className="np">{toFa('۲۸۰,۰۰۰,۰۰۰')} ت</strong></div>
          <div className="dash-forecast-card"><span>خالص جریان آینده</span><strong className="np" style={{ color: 'var(--green)' }}>{toFa('۴۰۸,۸۴۵,۰۰۰')} ت</strong></div>
        </div>
        <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 8 }}>
          <div className="dash-event" onClick={() => toast('دریافت', 'دریافت از شرکت راهکار دیجیتال')} style={{ cursor: 'pointer' }}><span className="dash-event-date">امروز</span><div className="dash-event-body"><strong>دریافت از شرکت راهکار دیجیتال</strong><small>فاکتور INV-۰۲۶-۰۰۹۰۴</small></div><b className="np" style={{ color: 'var(--green)' }}>+{toFa('۲۵۰,۰۰۰,۰۰۰')} ت</b></div>
          <div className="dash-event" onClick={() => toast('پرداخت', 'پرداخت حقوق و دستمزد')} style={{ cursor: 'pointer' }}><span className="dash-event-date">۲۷ مرداد</span><div className="dash-event-body"><strong>پرداخت حقوق و دستمزد</strong><small>حساب بانکی اصلی</small></div><b className="np" style={{ color: 'var(--rose)' }}>-{toFa('۸۰,۰۰۰,۰۰۰')} ت</b></div>
        </div>
      </section>
    </>
  );
}

function BankPage({ search }: { search: string }) {
  const { toast } = useApp();
  return (
    <section className="dash-panel dash-panel-pad">
      <div className="dash-panel-head"><div><h2>حساب‌های بانکی</h2><p>حساب‌ها و پرداخت‌های بانکی</p></div></div>
      <div className="dash-bank-grid">
        <div className="dash-bank-card selected" onClick={() => toast('حساب اصلی', 'بانک ملت •••• ۲۸۶۴')} style={{ cursor: 'pointer' }}>
          <div className="dash-bank-top"><span className="dash-bank-logo"><Landmark size={18} /></span><span>حساب اصلی</span><MoreHorizontal size={18} /></div>
          <strong className="np">{toFa('۴۳,۲۰۰,۰۰۰')} ت</strong><span className="num">بانک ملت •••• ۲۸۶۴</span>
          <div className="dash-bank-progress"><i style={{ width: '72%' }} /></div><small>۷۲٪ از سقف ماهانه</small>
        </div>
        <div className="dash-bank-card" onClick={() => toast('حساب عملیاتی', 'بانک سامان •••• ۷۹۱۲')} style={{ cursor: 'pointer' }}>
          <div className="dash-bank-top"><span className="dash-bank-logo"><Landmark size={18} /></span><span>حساب عملیاتی</span><MoreHorizontal size={18} /></div>
          <strong className="np">{toFa('۲۶,۸۷۰,۰۰۰')} ت</strong><span className="num">بانک سامان •••• ۷۹۱۲</span>
          <div className="dash-bank-progress"><i style={{ width: '48%' }} /></div><small>۴۸٪ از سقف ماهانه</small>
        </div>
        <button className="dash-add-bank" onClick={() => toast('افزودن حساب', 'فرم افزودن حساب بانکی به‌زودی فعال می‌شود.')}><Plus size={26} /><span>افزودن حساب بانکی</span></button>
      </div>
      <TableToolbar placeholder="جستجوی تراکنش..." onFilter={() => toast('فیلترها', 'پنل فیلترها به‌زودی فعال می‌شود.')} onExport={() => toast('خروجی گرفتن', 'فایل CSV آماده شد.')} />
      <DataTable type="bank" search={search} onRowClick={(row) => toast('تراکنش', row[0])} />
    </section>
  );
}

function TeamPage() {
  const { toast } = useApp();
  const team = [['مریم صادقی', 'مدیر مالی', 'maryam@hesav.ir', 'فعال'], ['علی کاظمی', 'حساب‌دار', 'ali@hesav.ir', 'فعال'], ['سارا نوری', 'مشاهده‌گر', 'sara@hesav.ir', 'در انتظار دعوت']];
  return (
    <section className="dash-panel dash-panel-pad">
      <div className="dash-panel-head"><div><h2>اعضای تیم</h2><p>همکاران و سطح دسترسی آن‌ها در فضای کاری</p></div><button className="btn btn-primary btn-sm" onClick={() => toast('دعوت همکار', 'فرم دعوت به‌زودی فعال می‌شود.')}><Plus size={16} /> دعوت همکار</button></div>
      <div style={{ marginTop: 20 }}>
        <div className="dash-table-wrap">
          <table>
            <thead><tr><th>نام و نام خانوادگی</th><th>نقش</th><th>ایمیل</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {team.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td><td>{row[1]}</td><td dir="ltr">{row[2]}</td>
                  <td><span className={`dash-status ${row[3] === 'فعال' ? 'success' : 'warning'}`}>{row[3]}</span></td>
                  <td><button className="dash-row-link" onClick={() => toast('مدیریت همکار', row[0])}>مدیریت <ChevronLeft size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ReportsPage() {
  const { toast } = useApp();
  const reports = [
    { icon: BarChart3, title: 'گزارش سود و زیان', desc: 'بررسی درآمد، هزینه و سود خالص در بازه انتخابی', tone: 'ic-brand' },
    { icon: FileText, title: 'گزارش فروش و فاکتورها', desc: 'تحلیل فروش بر اساس مشتری، کالا و زمان', tone: 'ic-teal' },
    { icon: Wallet, title: 'گزارش جریان نقدی', desc: 'پیش‌بینی ورود و خروج وجه نقد', tone: 'ic-amber' },
    { icon: Landmark, title: 'گزارش تطبیق بانکی', desc: 'مقایسه تراکنش‌های ثبت‌شده با حساب بانکی', tone: 'ic-rose' },
  ];
  return (
    <section className="reports-grid">
      {reports.map(({ icon: Icon, title, desc, tone }) => (
        <button key={title} className="report-card" onClick={() => toast(title, 'در حال تولید گزارش...')}>
          <span className={`dash-stat-ic ${tone}`}><Icon size={21} /></span>
          <span><strong>{title}</strong><small>{desc}</small></span>
          <ChevronLeft size={17} />
        </button>
      ))}
    </section>
  );
}

function SettingsPage() {
  const { toast } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ name: 'شرکت بردیا', nationalId: '۱۴۰۰۵۸۳۲۷۰۱', phone: '۰۲۱-۸۸۷۷۶۶۵۵', email: 'office@bardia.tech' });

  const tabs = ['اطلاعات شرکت', 'اعضای تیم', 'اعلان‌ها', 'امنیت'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('تغییرات ذخیره شد', 'اطلاعات فضای کاری به‌روزرسانی شد.');
  };

  return (
    <section className="dash-panel dash-panel-pad settings-panel">
      <div className="settings-tabs">
        {tabs.map((t, i) => (
          <button key={t} className={activeTab === i ? 'active' : ''} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>
      <div className="settings-form">
        {activeTab === 0 && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div><h2>اطلاعات فضای کاری</h2><p>این اطلاعات در فاکتورها و گزارش‌های شما نمایش داده می‌شود.</p></div>
            <div className="settings-fields">
              <label>نام شرکت<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>شناسه ملی<input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></label>
              <label>شماره تماس<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></label>
              <label>ایمیل کاری<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" /></label>
            </div>
            <button className="btn btn-primary btn-sm" type="submit" style={{ width: 'fit-content' }}>ذخیره تغییرات</button>
          </form>
        )}
        {activeTab === 1 && <div><h2>اعضای تیم</h2><p>مدیریت دسترسی اعضای تیم در این بخش انجام می‌شود.</p><button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => toast('دعوت همکار', 'فرم دعوت به‌زودی فعال می‌شود.')}>دعوت همکار جدید</button></div>}
        {activeTab === 2 && <div><h2>اعلان‌ها</h2><p>تنظیمات اعلان‌های ایمیلی و درون‌برنامه‌ای.</p><button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => toast('اعلان‌ها', 'تنظیمات ذخیره شد.')}>ذخیره تنظیمات</button></div>}
        {activeTab === 3 && <div><h2>امنیت</h2><p>تغییر رمز عبور و تنظیمات ورود دو مرحله‌ای.</p><button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => toast('امنیت', 'تغییرات ذخیره شد.')}>به‌روزرسانی امنیت</button></div>}
      </div>
    </section>
  );
}

function DataTable({ type, search, onRowClick }: { type: 'clients' | 'invoices' | 'bank'; search: string; onRowClick: (row: string[]) => void }) {
  const data: Record<typeof type, { headers: string[]; rows: string[][] }> = {
    clients: {
      headers: ['شناسه', 'نام مشتری', 'نوع', 'تماس', 'وضعیت'],
      rows: [['CUS-2026-00502', 'بردیا تک', 'حقوقی', '0912332350', 'در حال انجام'], ['CUS-2026-00501', 'شرکت نوآوران', 'حقوقی', '09301563610', 'در حال انجام'], ['CUS-2026-00500', 'مهدی محمدی', 'حقیقی', '09198877110', 'تکمیل شده']],
    },
    invoices: {
      headers: ['شماره فاکتور', 'مشتری', 'مبلغ (تومان)', 'تاریخ پرداخت', 'وضعیت'],
      rows: [['INV-2026-00904', 'راهکار دیجیتال', '250,000,000', '1405/05/24', 'در انتظار'], ['INV-2026-00903', 'مهدی محمدی', '1,000', '1405/05/20', 'در انتظار'], ['INV-2026-00902', 'شرکت پیشرو', '1,000', '1405/05/20', 'تسویه‌شده']],
    },
    bank: {
      headers: ['پرداخت', 'تاریخ', 'مبلغ (تومان)', 'وضعیت'],
      rows: [['تراکنش بانکی 5999', '1 شهریور 1405', '43,200,000', 'در انتظار'], ['تراکنش بانکی 5998', '31 مرداد 1405', '59,000,000', 'در انتظار'], ['تراکنش بانکی 5997', '31 مرداد 1405', '27,000,000', 'در انتظار']],
    },
  };
  const d = data[type];
  const statusClass = (s: string) => s.includes('تسویه') || s.includes('تکمیل') ? 'success' : s.includes('در انتظار') || s.includes('در حال') ? 'warning' : 'danger';
  const filtered = search
    ? d.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(search.toLowerCase())))
    : d.rows;
  return (
    <div className="dash-table-wrap">
      <table>
        <thead><tr>{d.headers.map((h) => <th key={h}>{h}<span className="sort">↕</span></th>)}<th>عملیات</th></tr></thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={d.headers.length + 1} style={{ textAlign: 'center', color: 'var(--ink-4)', padding: 32 }}>موردی یافت نشد</td></tr>
          ) : filtered.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{ci === row.length - 1 ? <span className={`dash-status ${statusClass(cell)}`}>{cell}</span> : <span className="np">{cell}</span>}</td>
              ))}
              <td><button className="dash-row-link" onClick={() => onRowClick(row)}>مشاهده <ChevronLeft size={13} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
