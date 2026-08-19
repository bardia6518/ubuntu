import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  FileText,
  Landmark,
  Layers,
  LineChart,
  Menu,
  Moon,
  Shield,
  Sun,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import { Modal, useApp } from '@/App';

const toFa = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

type Props = { onLaunch: () => void };

export default function Landing({ onLaunch }: Props) {
  const { theme, toggleTheme, toast } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { id: 'features', label: 'امکانات' },
    { id: 'how', label: 'نحوه کار' },
    { id: 'pricing', label: 'تعرفه' },
    { id: 'faq', label: 'سوالات' },
  ];

  const features = [
    { icon: FileText, tone: 'ic-brand', title: 'صدور فاکتور آنلاین', desc: 'در کمتر از یک دقیقه فاکتور فروش رسمی صادر کنید، وضعیت پرداخت را پیگیری کنید و یادآوری خودکار برای سررسید تنظیم نمایید.' },
    { icon: Users, tone: 'ic-teal', title: 'مدیریت مشتریان', desc: 'پروفایل کامل مشتریان، تاریخچه معاملات، مانده حساب و تماس‌ها را در یک نگاه ببینید و ارتباط بهتری بسازید.' },
    { icon: TrendingUp, tone: 'ic-green', title: 'گزارش جریان نقدی', desc: 'با نمودارهای زنده و پیش‌بینی هوشمند، همیشه بدانید چه زمانی پول وارد یا خارج می‌شود.' },
    { icon: Landmark, tone: 'ic-amber', title: 'اتصال به بانک‌ها', desc: 'حساب‌های بانکی را متصل کنید و تراکنش‌ها به‌صورت خودکار دسته‌بندی و تطبیق داده شوند.' },
    { icon: BarChart3, tone: 'ic-rose', title: 'گزارش‌های مالی', desc: 'ترازنامه، سود و زیان و گزارش فروش را با چند کلیک تولید کنید و برای حساب‌دار خود بفرستید.' },
    { icon: Shield, tone: 'ic-brand', title: 'امنیت ابری', desc: 'داده‌ها روی سرورهای امن و پشتیبان‌گیری‌شده نگهداری می‌شوند و فقط شما و تیمتان به آن‌ها دسترسی دارند.' },
  ];

  const steps = [
    { title: 'ثبت‌نام رایگان', desc: 'در کمتر از دو دقیقه حساب بسازید و کسب‌وکار خود را وارد کنید.' },
    { title: 'اطلاعات اولیه', desc: 'مشتریان، حساب‌های بانکی و کالاهای خود را اضافه کنید.' },
    { title: 'ثبت معاملات', desc: 'فاکتورها، رسیدها و پرداخت‌ها را ثبت کنید؛ بقیه کار با ماست.' },
    { title: 'گزارش‌گیری', desc: 'هر لحظه گزارش‌های مالی شفاف و دقیق دریافت کنید.' },
  ];

  const plans = [
    { name: 'آغاز', desc: 'مناسب کسب‌وکارهای تازه‌تاسیس', price: '0', period: 'تومان / ماه', features: ['تا ۳۰ فاکتور در ماه', '۱ کاربر', 'گزارش پایه فروش', 'پشتیبانی ایمیلی'], featured: false },
    { name: 'حرفه‌ای', desc: 'محبوب‌ترین انتخاب کسب‌وکارها', price: '۳۹۰,۰۰۰', period: 'تومان / ماه', features: ['فاکتور نامحدود', 'تا ۵ کاربر', 'گزارش‌های کامل مالی', 'اتصال بانکی', 'پشتیبانی اولویت‌دار'], featured: true },
    { name: 'سازمانی', desc: 'برای تیم‌های بزرگ و چندشعبه', price: '۹۸۰,۰۰۰', period: 'تومان / ماه', features: ['کاربر نامحدود', 'چندین شعبه', 'دسترسی نقش‌محور', 'API اختصاصی', 'مدیر اختصاصی حساب'], featured: false },
  ];

  const testimonials = [
    { text: 'بعد از سال‌ها با نرم‌افزارهای پیچیده دست و پنجه نرم می‌کردم، هساو واقعاً نفس راحتی کشیدم. صدور فاکتور و پیگیری پرداخت‌ها حالا فقط چند کلیک است.', name: 'سحر کریمی', role: 'مدیر فروش، استودیو نما', color: '#1b6ca8' },
    { text: 'گزارش جریان نقدی به ما کمک می‌کند قبل از مواعد پرداخت، برنامه دقیق داشته باشیم. این قابلیت تنها دلیل ماندن ما روی هساو است.', name: 'مهندس رضا نوری', role: 'بنیان‌گذار، تک‌ساز', color: '#0d9488' },
    { text: 'پشتیبانی فوق‌العاده و رابط کاربری ساده. حتی کارمندان غیرمالی هم به‌راحتی ازش استفاده می‌کنند بدون اینکه آموزش خاصی ببینند.', name: 'الهام موسوی', role: 'حساب‌دار، گروه آینده', color: '#c98a2e' },
  ];

  const faqs = [
    { q: 'آیا برای شروع به آموزش خاصی نیاز دارم؟', a: 'خیر. هساو طوری طراحی شده که هر کسی بدون دانش حسابداری بتواند در همان روز اول فاکتور صادر کند و معاملاتش را ثبت نماید. در صورت نیاز، ویدیوهای آموزشی کوتاه در دسترس شماست.' },
    { q: 'آیا داده‌های مالی من امن هستند؟', a: 'بله. تمام اطلاعات روی سرورهای امن با پشتیبان‌گیری روزانه نگهداری می‌شود و فقط شما و کسانی که اجازه می‌دهید به آن دسترسی دارند. ارتباطات نیز رمزنگاری‌شده است.' },
    { q: 'می‌توانم هر زمان تعرفه را تغییر دهم؟', a: 'بله. می‌توانید هر زمان بین طرح‌ها جابه‌جا شوید یا اشتراک خود را لغو کنید. هیچ عقد قرارداد طولانی‌مدتی وجود ندارد.' },
    { q: 'آیا با حساب‌دار فعلی من سازگار است؟', a: 'بله. می‌توانید گزارش‌های استاندارد ترازنامه و سود و زیان را خروجی بگیرید و مستقیماً به حساب‌دار یا مشاور مالیاتی خود تحویل دهید.' },
    { q: 'آیا اپلیکیشن موبایل دارد؟', a: 'رابط کاربری هساو کاملاً واکنش‌گراست و روی هر دستگاهی با هر اندازه‌ای به‌خوبی کار می‌کند. اپلیکیشن بومی نیز در دست راه است.' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginOpen(false);
    onLaunch();
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactOpen(false);
    toast('درخواست شما ثبت شد', 'کارشناسان ما به‌زودی با شما تماس می‌گیرند.');
  };

  const handlePlan = (name: string) => {
    onLaunch();
    toast(`طرح «${name}» انتخاب شد`, 'بعد از ثبت‌نام، طرح شما فعال خواهد شد.');
  };

  return (
    <div>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="brand-logo-mark"><Wallet size={20} strokeWidth={2.5} /></span>
            هساو
          </a>
          <nav className="nav-links">
            {navLinks.map((l) => <a key={l.id} href={`#${l.id}`} className="nav-link" onClick={(e) => { e.preventDefault(); scrollTo(l.id); }}>{l.label}</a>)}
          </nav>
          <div className="nav-cta">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="تغییر تم">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setLoginOpen(true)}>ورود</button>
            <button className="btn btn-primary btn-sm" onClick={onLaunch}>شروع رایگان</button>
            <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="منو">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="container" style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navLinks.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="nav-link" onClick={(e) => { e.preventDefault(); scrollTo(l.id); setMenuOpen(false); }}>{l.label}</a>
            ))}
            <button className="nav-link" style={{ textAlign: 'right', border: 0, background: 'transparent' }} onClick={() => { toggleTheme(); setMenuOpen(false); }}>{theme === 'light' ? 'حالت تاریک' : 'حالت روشن'}</button>
          </div>
        )}
      </header>

      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-blob b1" /><div className="hero-blob b2" />
        <div className="container hero-inner">
          <div className="hero-copy fade-up">
            <span className="eyebrow"><SparklesIcon size={14} /> نرم‌افزار ابری حسابداری</span>
            <h1 style={{ marginTop: 20 }}>مدیریت مالی کسب‌وکارتان، <span className="grad">ساده و شفاف</span></h1>
            <p className="hero-lead">هساو به شما کمک می‌کند فاکتورها را صادر کنید، مشتریان را مدیریت کنید و جریان نقدی خود را زنده ببینید؛ همه در یک پلتفرم ابری ساده که روی هر دستگاهی کار می‌کند.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={onLaunch}>شروع رایگان <ArrowLeft size={18} /></button>
              <button className="btn btn-ghost btn-lg" onClick={() => scrollTo('features')}>مشاهده امکانات</button>
            </div>
            <div className="hero-trust">
              <span className="hero-trust-item"><Check size={16} color="var(--green)" /> بدون نیاز به کارت بانکی</span>
              <span className="hero-trust-item"><Check size={16} color="var(--green)" /> راه‌اندازی در ۲ دقیقه</span>
            </div>
          </div>

          <div className="hero-visual fade-up" style={{ animationDelay: '.15s' }}>
            <div className="hero-badge tl float">
              <span className="hero-badge-ic ic-green"><TrendingUp size={18} /></span>
              <div><strong>رشد درآمد</strong><span>۲۴٪ این ماه</span></div>
            </div>
            <div className="hero-card">
              <div className="hero-card-head">
                <div><h4>موجودی کل</h4><span>به‌روزرسانی همین لحظه</span></div>
                <span className="pill pill-green"><Check size={12} /> سالم</span>
              </div>
              <div className="hero-card-amount np">{toFa('۸۰,۳۲۱,۵۷۰')} <small>تومان</small></div>
              <div className="hero-card-trend"><TrendingUp size={13} /> ۲.۴٪ نسبت به ماه قبل</div>
              <div className="hero-card-chart">
                <svg viewBox="0 0 400 120" preserveAspectRatio="none" width="100%" height="100%">
                  <defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity=".25" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
                  <path d="M0,90 C40,75 60,82 90,60 S140,52 170,70 S220,40 250,52 S300,28 330,42 S380,18 400,8 L400,120 L0,120Z" fill="url(#hg)" />
                  <path d="M0,90 C40,75 60,82 90,60 S140,52 170,70 S220,40 250,52 S300,28 330,42 S380,18 400,8" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="hero-card-rows">
                <div className="hero-card-row">
                  <span className="hero-card-row-ic ic-teal"><ArrowLeft size={15} /></span>
                  <div><strong>دریافت از شرکت راهکار</strong><span>امروز، ۱۰:۴۲</span></div>
                  <b className="np" style={{ color: 'var(--green)' }}>+{toFa('۲۵۰,۰۰۰,۰۰۰')}</b>
                </div>
                <div className="hero-card-row">
                  <span className="hero-card-row-ic ic-amber"><FileText size={15} /></span>
                  <div><strong>فاکتور جدید ثبت شد</strong><span>امروز، ۰۹:۱۸</span></div>
                  <b className="np">INV-{toFa('۰۰۹۰۴')}</b>
                </div>
              </div>
            </div>
            <div className="hero-badge bl float" style={{ animationDelay: '1.5s' }}>
              <span className="hero-badge-ic ic-brand"><Shield size={18} /></span>
              <div><strong>رمزنگاری‌شده</strong><span>امنیت ابری</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="logos">
        <div className="container logos-inner">
          <span className="logos-label">مورد اعتماد کسب‌وکارهای ایرانی</span>
          <span className="logo-chip"><Layers size={18} /> تک‌ساز</span>
          <span className="logo-chip"><Zap size={18} /> آینده‌گستر</span>
          <span className="logo-chip"><BarChart3 size={18} /> نما</span>
          <span className="logo-chip"><LineChart size={18} /> پیشرو</span>
          <span className="logo-chip"><SparklesIcon size={18} /> دیجیتال ۲۴۷</span>
        </div>
      </div>

      <section className="section" id="features">
        <div className="container">
          <div className="features-head">
            <span className="section-label">امکانات</span>
            <h2 className="section-title">هر چه برای حسابداری نیاز دارید، در یک جا</h2>
            <p className="section-sub">هساو مجموعه‌ای از ابزارهای مالی را در یک رابط ساده گرد آورده تا زمان شما برای کارهای مهم‌تر آزاد شود.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <article key={f.title} className="feature-card" onClick={() => toast(f.title, f.desc)} style={{ cursor: 'pointer' }}>
                <span className={`feature-ic ${f.tone}`}><f.icon size={22} /></span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section how" id="how">
        <div className="container">
          <div className="features-head">
            <span className="section-label">نحوه کار</span>
            <h2 className="section-title">در چهار قدم آماده به کار</h2>
            <p className="section-sub">بدون نصب نرم‌افزار و بدون نیاز به آموزش، از همین امروز شروع کنید.</p>
          </div>
          <div className="how-grid">
            {steps.map((s, i) => (
              <div key={s.title} className="how-step" onClick={() => toast(`گام ${toFa(String(i + 1))}: ${s.title}`, s.desc)} style={{ cursor: 'pointer' }}>
                <div className="how-num">{toFa(String(i + 1))}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="preview">
        <div className="container">
          <div className="preview-head">
            <span className="section-label">نمونه محیط کار</span>
            <h2 className="section-title">پنل مدیریتی شفاف و سریع</h2>
            <p className="section-sub">همه‌چیز در یک نما: آمار کلیدی، نمودار زنده و آخرین فعالیت‌ها.</p>
          </div>
          <div className="preview-frame">
            <div className="preview-bar">
              <span className="preview-dot" style={{ background: '#ec7b6d' }} />
              <span className="preview-dot" style={{ background: '#e4b83c' }} />
              <span className="preview-dot" style={{ background: '#54b98a' }} />
            </div>
            <div className="preview-body">
              <div className="preview-side">
                <div className="preview-side-item active"><BarChart3 size={16} /> داشبورد</div>
                <div className="preview-side-item"><Users size={16} /> مشتریان</div>
                <div className="preview-side-item"><FileText size={16} /> فاکتورها</div>
                <div className="preview-side-item"><Landmark size={16} /> بانک</div>
                <div className="preview-side-item"><BarChart3 size={16} /> گزارش‌ها</div>
              </div>
              <div className="preview-main">
                <div className="preview-stats">
                  <div className="preview-stat"><span>موجودی کل</span><strong className="np">{toFa('۸۰م')}</strong></div>
                  <div className="preview-stat"><span>دریافتنی</span><strong className="np">{toFa('۱۲.۵م')}</strong></div>
                  <div className="preview-stat"><span>پرداختنی</span><strong className="np">{toFa('۸م')}</strong></div>
                  <div className="preview-stat"><span>فاکتور باز</span><strong className="np">{toFa('۳۲')}</strong></div>
                </div>
                <div className="preview-chart">
                  <div className="preview-chart-head"><strong>جریان نقدی</strong><span>۶ ماه اخیر</span></div>
                  <svg viewBox="0 0 500 130" preserveAspectRatio="none" width="100%" style={{ flex: 1 }}>
                    <defs><linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity=".2" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0,100 C50,80 80,92 120,68 S180,58 220,78 S280,42 320,58 S380,32 420,42 S470,20 500,10 L500,130 L0,130Z" fill="url(#pg)" />
                    <path d="M0,100 C50,80 80,92 120,68 S180,58 220,78 S280,42 320,58 S380,32 420,42 S470,20 500,10" fill="none" stroke="var(--brand)" strokeWidth="2.5" />
                    <path d="M0,112 C50,98 80,106 120,86 S180,80 220,98 S280,68 320,86 S380,70 420,88 S470,58 500,64" fill="none" stroke="var(--amber)" strokeWidth="2" strokeDasharray="4 5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn btn-primary btn-lg" onClick={onLaunch}>ورود به پنل مدیریت <ArrowLeft size={18} /></button>
          </div>
        </div>
      </section>

      <section className="stats-band">
        <div className="container">
          <div className="stats-grid">
            <div><strong className="np">{toFa('۱۲,۰۰۰')}<span>+</span></strong><p>کسب‌وکار فعال</p></div>
            <div><strong className="np">{toFa('۸۵۰,۰۰۰')}</strong><p>فاکتور صادرشده</p></div>
            <div><strong className="np">{toFa('۹۹.۹')}<span>٪</span></strong><p>پایداری سرویس</p></div>
            <div><strong className="np">{toFa('۲۴')}/<span>{toFa('۷')}</span></strong><p>پشتیبانی</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="features-head">
            <span className="section-label">تعرفه</span>
            <h2 className="section-title">قیمتی شفاف برای هر اندازه کسب‌وکار</h2>
            <p className="section-sub">بدون هزینه پنهان. هر زمان بخواهید می‌توانید طرح خود را تغییر دهید.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((p) => (
              <div key={p.name} className={`price-card ${p.featured ? 'featured' : ''}`}>
                {p.featured && <span className="price-tag">محبوب‌ترین</span>}
                <div className="price-name">{p.name}</div>
                <div className="price-desc">{p.desc}</div>
                <div className="price-amount">
                  <strong className="np">{toFa(p.price)}</strong>
                  <span>{p.period}</span>
                </div>
                <div className="price-features">
                  {p.features.map((f) => (
                    <div key={f} className="price-feature"><Check size={18} /> {f}</div>
                  ))}
                </div>
                <button className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handlePlan(p.name)}>انتخاب طرح {p.name}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section how" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="features-head">
            <span className="section-label">نظر کاربران</span>
            <h2 className="section-title">کسب‌وکارهایی که به هساو اعتماد کرده‌اند</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <article key={t.name} className="testi-card">
                <div className="testi-stars">{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: 'var(--amber)' }}>★</span>)}</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <span className="testi-avatar" style={{ background: t.color }}>{t.name[0]}</span>
                  <div><strong>{t.name}</strong><span>{t.role}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="features-head">
            <span className="section-label">سوالات متداول</span>
            <h2 className="section-title">پاسخ پرسش‌های رایج</h2>
          </div>
          <div className="faq-wrap">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item ${faqOpen === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  {f.q}
                  <ChevronDown size={18} />
                </button>
                <div className="faq-a" style={{ maxHeight: faqOpen === i ? 200 : 0 }}>
                  <div className="faq-a-inner">{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-inner">
            <h2>همین امروز مدیریت مالی را ساده کنید</h2>
            <p>به جمع هزاران کسب‌وکار بپیوندید که با هساو زمان خود را آزاد کرده‌اند. شروع رایگان است.</p>
            <div className="cta-actions">
              <button className="btn btn-lg btn-white" onClick={onLaunch}>شروع رایگان <ArrowLeft size={18} /></button>
              <button className="btn btn-lg btn-outline-white" onClick={() => setContactOpen(true)}>گفتگو با کارشناس</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">هساو</div>
              <p className="footer-about">نرم‌افزار ابری حسابداری و مدیریت مالی برای کسب‌وکارهای کوچک و متوسط ایران. ساده، امن و همیشه در دسترس.</p>
              <div className="footer-social">
                <button onClick={() => toast('لینکدین', 'به‌زودی در دسترس قرار می‌گیرد.')} aria-label="لینکدین" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.07)', display: 'grid', placeItems: 'center', color: '#97a8b5', border: 0, cursor: 'pointer' }}><Users size={16} /></button>
                <button onClick={() => toast('تلگرام', 'به‌زودی در دسترس قرار می‌گیرد.')} aria-label="تلگرام" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.07)', display: 'grid', placeItems: 'center', color: '#97a8b5', border: 0, cursor: 'pointer' }}><Bell size={16} /></button>
                <button onClick={() => toast('ایمیل', 'contact@hesav.ir')} aria-label="ایمیل" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.07)', display: 'grid', place-items: 'center', color: '#97a8b5', border: 0, cursor: 'pointer' }}><FileText size={16} /></button>
              </div>
            </div>
            <div className="footer-col">
              <h4>محصول</h4>
              <ul>
                <li><button className="footer-link-btn" onClick={() => scrollTo('features')}>امکانات</button></li>
                <li><button className="footer-link-btn" onClick={() => scrollTo('pricing')}>تعرفه</button></li>
                <li><button className="footer-link-btn" onClick={onLaunch}>ورود به پنل</button></li>
                <li><button className="footer-link-btn" onClick={() => toast('تغییرات', 'نسخه فعلی ۱.۲.۰ است.')}>تغییرات</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>پشتیبانی</h4>
              <ul>
                <li><button className="footer-link-btn" onClick={() => scrollTo('faq')}>سوالات متداول</button></li>
                <li><button className="footer-link-btn" onClick={() => toast('راهنمای استفاده', 'مستندات در حال آماده‌سازی است.')}>راهنمای استفاده</button></li>
                <li><button className="footer-link-btn" onClick={() => setContactOpen(true)}>تماس با ما</button></li>
                <li><button className="footer-link-btn" onClick={() => toast('وضعیت سرویس', 'همه سیستم‌ها فعال هستند.')}>وضعیت سرویس</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>شرکت</h4>
              <ul>
                <li><button className="footer-link-btn" onClick={() => toast('درباره ما', 'هساو، ساخته‌شده برای کسب‌وکارهای ایران.')}>درباره ما</button></li>
                <li><button className="footer-link-btn" onClick={() => toast('بلاگ', 'مقالات به‌زودی منتشر می‌شوند.')}>بلاگ</button></li>
                <li><button className="footer-link-btn" onClick={() => toast('فرصت‌های شغلی', 'در حال حاضر موقعیتی باز نیست.')}>فرصت‌های شغلی</button></li>
                <li><button className="footer-link-btn" onClick={() => toast('حریم خصوصی', 'اطلاعات شما محفوظ است.')}>حریم خصوصی</button></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {toFa('۱۴۰۵')} هساو. تمام حقوق محفوظ است.</span>
            <span>ساخته‌شده با دقت برای کسب‌وکارهای ایران</span>
          </div>
        </div>
      </footer>

      {loginOpen && (
        <Modal title="ورود به هساو" onClose={() => setLoginOpen(false)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setLoginOpen(false)}>انصراف</button>
            <button className="btn btn-primary btn-sm" form="login-form" type="submit">ورود</button>
          </>
        }>
          <form id="login-form" onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>برای ورود به پنل مدیریت، ایمیل و رمز عبور خود را وارد کنید.</p>
            <div className="modal-field"><label>ایمیل</label><input type="email" required placeholder="you@example.com" dir="ltr" /></div>
            <div className="modal-field"><label>رمز عبور</label><input type="password" required placeholder="••••••••" dir="ltr" /></div>
          </form>
        </Modal>
      )}

      {contactOpen && (
        <Modal title="گفتگو با کارشناس" onClose={() => setContactOpen(false)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setContactOpen(false)}>انصراف</button>
            <button className="btn btn-primary btn-sm" form="contact-form" type="submit">ارسال درخواست</button>
          </>
        }>
          <form id="contact-form" onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>فرم زیر را پر کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند.</p>
            <div className="modal-field"><label>نام و نام خانوادگی</label><input required placeholder="نام شما" /></div>
            <div className="modal-field"><label>ایمیل یا شماره تماس</label><input required placeholder="راه ارتباطی" dir="ltr" /></div>
            <div className="modal-field"><label>پیام شما</label><textarea required placeholder="درخواست یا سوال خود را بنویسید..." /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
