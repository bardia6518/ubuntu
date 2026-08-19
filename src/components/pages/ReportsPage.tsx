import { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { SectionHeader } from '@/components/shared/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  fetchProjectProfitReport,
  fetchCustomerReceivablesReport,
  fetchOverdueInvoicesReport,
  fetchContractorDebtReport,
  fetchIncomeByServiceReport,
  fetchExpenseByCategoryReport,
  fetchBankTreasuryReport,
  fetchCashflowReport,
} from '@/lib/finance';
import type {
  ReportProjectProfit,
  ReportCustomerReceivables,
  ReportOverdueInvoice,
  ReportContractorDebt,
  ReportIncomeByService,
  ReportExpenseByCategory,
  ReportBankTreasury,
  ReportCashflowEntry,
} from '@/types';

type ReportTab = 'profit' | 'receivables' | 'overdue' | 'contractor' | 'income' | 'expense' | 'bank' | 'cashflow';

const tabs: { id: ReportTab; label: string }[] = [
  { id: 'profit', label: 'سود پروژه‌ها' },
  { id: 'receivables', label: 'مطالبات مشتریان' },
  { id: 'overdue', label: 'فاکتورهای سررسید گذشته' },
  { id: 'contractor', label: 'بدهی به همکاران' },
  { id: 'income', label: 'درآمد براساس خدمت' },
  { id: 'expense', label: 'هزینه براساس دسته' },
  { id: 'bank', label: 'بانک/خزانه' },
  { id: 'cashflow', label: 'جریان نقدی' },
];

export function ReportsPage({ currency }: { currency?: string }) {
  const [tab, setTab] = useState<ReportTab>('profit');
  const [loading, setLoading] = useState(true);
  const [profit, setProfit] = useState<ReportProjectProfit[]>([]);
  const [receivables, setReceivables] = useState<ReportCustomerReceivables[]>([]);
  const [overdue, setOverdue] = useState<ReportOverdueInvoice[]>([]);
  const [contractorDebt, setContractorDebt] = useState<ReportContractorDebt[]>([]);
  const [income, setIncome] = useState<ReportIncomeByService[]>([]);
  const [expense, setExpense] = useState<ReportExpenseByCategory[]>([]);
  const [bank, setBank] = useState<ReportBankTreasury[]>([]);
  const [cashflow, setCashflow] = useState<ReportCashflowEntry[]>([]);

  const unit = currency ?? 'تومان';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, r, o, c, i, e, b, cf] = await Promise.all([
          fetchProjectProfitReport(),
          fetchCustomerReceivablesReport(),
          fetchOverdueInvoicesReport(),
          fetchContractorDebtReport(),
          fetchIncomeByServiceReport(),
          fetchExpenseByCategoryReport(),
          fetchBankTreasuryReport(),
          fetchCashflowReport(),
        ]);
        setProfit(p); setReceivables(r); setOverdue(o); setContractorDebt(c);
        setIncome(i); setExpense(e); setBank(b); setCashflow(cf);
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const exportCsv = () => {
    let rows: Array<Record<string, unknown>> = [];
    let headers = '';
    switch (tab) {
      case 'profit': rows = profit as unknown as Array<Record<string, unknown>>; headers = 'کد پروژه,عنوان,مشتری,قرارداد,دریافت شده,هزینه,هزینه همکار,سود,مانده';
        break;
      case 'receivables': rows = receivables as unknown as Array<Record<string, unknown>>; headers = 'مشتری,فاکتور شده,دریافت شده,مانده,اعتبار,سقف اعتبار';
        break;
      case 'overdue': rows = overdue as unknown as Array<Record<string, unknown>>; headers = 'شماره فاکتور,مشتری,مبلغ,پرداخت شده,مانده,سررسید,روز تأخیر';
        break;
      case 'contractor': rows = contractorDebt as unknown as Array<Record<string, unknown>>; headers = 'همکار,کل صورت‌حساب,کل پرداخت,بدهی';
        break;
      case 'income': rows = income as unknown as Array<Record<string, unknown>>; headers = 'نوع خدمت,فاکتور شده,دریافت شده';
        break;
      case 'expense': rows = expense as unknown as Array<Record<string, unknown>>; headers = 'دسته,مبلغ,تعداد';
        break;
      case 'bank': rows = bank as unknown as Array<Record<string, unknown>>; headers = 'حساب,بانک,موجودی,ورودی,خروجی,خالص';
        break;
      case 'cashflow': rows = cashflow as unknown as Array<Record<string, unknown>>; headers = 'تاریخ,نوع,مبلغ,مشتری/همکار,پروژه,حساب,توضیحات';
        break;
    }
    const csv = headers + '\n' + rows.map((r) => Object.values(r).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${tab}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'bg-white text-ink-500 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800'}`}>{t.label}</button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv}><Download size={15} />خروجی CSV</Button>
      </div>

      {tab === 'profit' && (
        <Card className="overflow-hidden">
          <SectionHeader title="سود پروژه‌ها" subtitle="درآمد، هزینه و سود هر پروژه" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">کد</th><th className="px-5 py-3 font-medium">عنوان</th><th className="px-5 py-3 font-medium">مشتری</th><th className="px-5 py-3 font-medium">قرارداد</th><th className="px-5 py-3 font-medium">دریافت</th><th className="px-5 py-3 font-medium">هزینه</th><th className="px-5 py-3 font-medium">هزینه همکار</th><th className="px-5 py-3 font-medium">سود</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {profit.map((p) => (
                  <tr key={p.project_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300">{p.project_code}</td>
                    <td className="px-5 py-3 text-sm text-ink-800 dark:text-ink-100">{p.title}</td>
                    <td className="px-5 py-3 text-sm text-ink-500">{p.customer_name ?? '—'}</td>
                    <td className="px-5 py-3 num text-sm text-ink-700 dark:text-ink-200">{formatCurrency(p.contract_amount, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-primary-600 dark:text-primary-400">{formatCurrency(p.total_received, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-rose-600">{formatCurrency(p.total_expenses, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-rose-600">{formatCurrency(p.total_contractor_cost, unit)}</td>
                    <td className="px-5 py-3 num text-sm font-bold"><span className={p.profit >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600'}>{formatCurrency(p.profit, unit)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profit.length === 0 && <p className="py-8 text-center text-sm text-ink-400">داده‌ای موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'receivables' && (
        <Card className="overflow-hidden">
          <SectionHeader title="مطالبات مشتریان" subtitle="مانده حساب و اعتبار هر مشتری" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">مشتری</th><th className="px-5 py-3 font-medium">فاکتور شده</th><th className="px-5 py-3 font-medium">دریافت شده</th><th className="px-5 py-3 font-medium">مانده</th><th className="px-5 py-3 font-medium">اعتبار</th><th className="px-5 py-3 font-medium">سقف اعتبار</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {receivables.map((r) => (
                  <tr key={r.customer_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{r.customer_name}</td>
                    <td className="px-5 py-3 num text-sm text-ink-700 dark:text-ink-200">{formatCurrency(r.total_invoiced, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-primary-600 dark:text-primary-400">{formatCurrency(r.total_receipts, unit)}</td>
                    <td className="px-5 py-3 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(r.outstanding_balance, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-sky-600">{formatCurrency(r.credit_amount, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-ink-500">{formatCurrency(r.credit_limit, unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {receivables.length === 0 && <p className="py-8 text-center text-sm text-ink-400">داده‌ای موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'overdue' && (
        <Card className="overflow-hidden">
          <SectionHeader title="فاکتورهای سررسید گذشته" subtitle="فاکتورهایی که پرداخت نشده و سررسیدشان گذشته" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">شماره فاکتور</th><th className="px-5 py-3 font-medium">مشتری</th><th className="px-5 py-3 font-medium">مبلغ</th><th className="px-5 py-3 font-medium">پرداخت شده</th><th className="px-5 py-3 font-medium">مانده</th><th className="px-5 py-3 font-medium">سررسید</th><th className="px-5 py-3 font-medium">روز تأخیر</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {overdue.map((o) => (
                  <tr key={o.invoice_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300">{o.invoice_number}</td>
                    <td className="px-5 py-3 text-sm text-ink-700 dark:text-ink-200">{o.customer_name ?? '—'}</td>
                    <td className="px-5 py-3 num text-sm text-ink-700 dark:text-ink-200">{formatCurrency(o.total, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-primary-600 dark:text-primary-400">{formatCurrency(o.paid_amount, unit)}</td>
                    <td className="px-5 py-3 num text-sm font-semibold text-rose-600">{formatCurrency(o.balance, unit)}</td>
                    <td className="px-5 py-3 text-sm text-ink-500">{formatDate(o.due_date)}</td>
                    <td className="px-5 py-3 num text-sm text-rose-600">{o.days_overdue.toLocaleString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overdue.length === 0 && <p className="py-8 text-center text-sm text-ink-400">فاکتور سررسید‌گذشته‌ای موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'contractor' && (
        <Card className="overflow-hidden">
          <SectionHeader title="بدهی به همکاران" subtitle="صورت‌حساب و پرداخت‌های هر همکار" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">همکار</th><th className="px-5 py-3 font-medium">کل صورت‌حساب</th><th className="px-5 py-3 font-medium">کل پرداخت</th><th className="px-5 py-3 font-medium">بدهی</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {contractorDebt.map((c) => (
                  <tr key={c.contractor_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{c.contractor_name}</td>
                    <td className="px-5 py-3 num text-sm text-ink-700 dark:text-ink-200">{formatCurrency(c.total_billed, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-primary-600 dark:text-primary-400">{formatCurrency(c.total_paid, unit)}</td>
                    <td className="px-5 py-3 num text-sm font-semibold text-rose-600">{formatCurrency(c.outstanding_debt, unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contractorDebt.length === 0 && <p className="py-8 text-center text-sm text-ink-400">بدهی موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'income' && (
        <Card className="overflow-hidden">
          <SectionHeader title="درآمد براساس نوع خدمت" subtitle="فاکتور و دریافت براساس نوع خدمت" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">نوع خدمت</th><th className="px-5 py-3 font-medium">فاکتور شده</th><th className="px-5 py-3 font-medium">دریافت شده</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {income.map((i) => (
                  <tr key={i.service_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{i.service_name}</td>
                    <td className="px-5 py-3 num text-sm text-ink-700 dark:text-ink-200">{formatCurrency(i.total_invoiced, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-primary-600 dark:text-primary-400">{formatCurrency(i.total_received, unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {income.length === 0 && <p className="py-8 text-center text-sm text-ink-400">داده‌ای موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'expense' && (
        <Card className="overflow-hidden">
          <SectionHeader title="هزینه براساس دسته" subtitle="هزینه‌های تأییدشده براساس دسته‌بندی" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">دسته</th><th className="px-5 py-3 font-medium">مبلغ</th><th className="px-5 py-3 font-medium">تعداد</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {expense.map((e) => (
                  <tr key={e.category_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{e.category_name}</td>
                    <td className="px-5 py-3 num text-sm text-rose-600">{formatCurrency(e.total_expenses, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-ink-500">{e.expense_count.toLocaleString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expense.length === 0 && <p className="py-8 text-center text-sm text-ink-400">داده‌ای موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'bank' && (
        <Card className="overflow-hidden">
          <SectionHeader title="بانک/خزانه" subtitle="موجودی و جریان نقدی هر حساب" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">حساب</th><th className="px-5 py-3 font-medium">بانک</th><th className="px-5 py-3 font-medium">موجودی</th><th className="px-5 py-3 font-medium">ورودی</th><th className="px-5 py-3 font-medium">خروجی</th><th className="px-5 py-3 font-medium">خالص</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {bank.map((b) => (
                  <tr key={b.bank_account_id} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{b.name}</td>
                    <td className="px-5 py-3 text-sm text-ink-500">{b.bank_name}</td>
                    <td className="px-5 py-3 num text-sm font-semibold text-ink-800 dark:text-ink-100">{formatCurrency(b.recorded_balance, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-primary-600 dark:text-primary-400">{formatCurrency(b.total_inflow, unit)}</td>
                    <td className="px-5 py-3 num text-sm text-rose-600">{formatCurrency(b.total_outflow, unit)}</td>
                    <td className="px-5 py-3 num text-sm font-semibold"><span className={b.net_flow >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600'}>{formatCurrency(b.net_flow, unit)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bank.length === 0 && <p className="py-8 text-center text-sm text-ink-400">حسابی موجود نیست</p>}
          </div>
        </Card>
      )}

      {tab === 'cashflow' && (
        <Card className="overflow-hidden">
          <SectionHeader title="جریان نقدی" subtitle="دریافت‌ها، هزینه‌ها و پرداخت‌های همکاران" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right">
              <thead><tr className="border-b border-ink-100 bg-white text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-medium">تاریخ</th><th className="px-5 py-3 font-medium">نوع</th><th className="px-5 py-3 font-medium">مبلغ</th><th className="px-5 py-3 font-medium">طرف حساب</th><th className="px-5 py-3 font-medium">پروژه</th><th className="px-5 py-3 font-medium">توضیحات</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {cashflow.map((cf, idx) => (
                  <tr key={idx} className="hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-sm text-ink-500">{formatDate(cf.flow_date)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cf.flow_type === 'income' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                        {cf.flow_type === 'income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {cf.flow_type === 'income' ? 'دریافت' : cf.flow_type === 'contractor_payment' ? 'پرداخت همکار' : 'هزینه'}
                      </span>
                    </td>
                    <td className={`px-5 py-3 num text-sm font-semibold ${cf.flow_type === 'income' ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600'}`}>{cf.flow_type === 'income' ? '+' : '-'} {formatCurrency(cf.amount, unit)}</td>
                    <td className="px-5 py-3 text-sm text-ink-500">{cf.customer_name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-ink-500">{cf.project_title ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-ink-400">{cf.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cashflow.length === 0 && <p className="py-8 text-center text-sm text-ink-400">تراکنشی موجود نیست</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
