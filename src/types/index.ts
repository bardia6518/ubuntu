// ─── Customer ───
export type CustomerKind = 'person' | 'company';
export type CustomerStatus = 'active' | 'pending' | 'completed';
export type EntityType = 'person' | 'company';
export type CreditStatus = 'ok' | 'has_credit' | 'over_limit';

export interface Customer {
  id: string;
  name: string;
  kind: CustomerKind;
  phone: string;
  email: string;
  status: CustomerStatus;
  balance: number;
  created_at: string;
  // UFA Phase 1 extensions
  customer_code?: string | null;
  entity_type?: EntityType | null;
  legal_name?: string | null;
  trade_name?: string | null;
  contact_person?: string;
  national_id?: string;
  economic_code?: string;
  address?: string;
  credit_limit?: number;
  payment_terms?: string;
}

// ─── Service ───
export interface Service {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

// ─── Project ───
export type ExecutionStatus =
  | 'not_started'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type FinancialStatus =
  | 'no_contract'
  | 'contracted'
  | 'invoicing'
  | 'partial_received'
  | 'fully_received'
  | 'overdue';

export interface Project {
  id: string;
  project_code: string;
  customer_id: string | null;
  service_id: string | null;
  title: string;
  description: string;
  contract_amount: number;
  estimated_cost: number;
  start_date: string | null;
  delivery_deadline: string | null;
  project_manager: string;
  execution_status: ExecutionStatus;
  financial_status: FinancialStatus;
  next_action: string;
  closed_at: string | null;
  closed_by: string | null;
  close_override_reason: string | null;
  created_at: string;
  customers?: { name: string } | null;
  services?: { name: string } | null;
}

// ─── Contract ───
export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated' | 'cancelled';

export interface Contract {
  id: string;
  contract_number: string;
  project_id: string;
  contract_date: string;
  total_amount: number;
  terms: string;
  contract_file_url: string;
  status: ContractStatus;
  created_at: string;
  projects?: { title: string } | null;
}

// ─── Installment ───
export type InstallmentStatus = 'pending' | 'invoiced' | 'paid' | 'overdue';

export interface Installment {
  id: string;
  contract_id: string;
  project_id: string | null;
  title: string;
  amount: number;
  due_date: string;
  status: InstallmentStatus;
  converted_invoice_id: string | null;
  created_at: string;
  contracts?: { contract_number: string } | null;
  projects?: { title: string } | null;
}

// ─── Invoice ───
export type InvoiceStatus =
  | 'draft'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'overpaid';

export type InvoiceType = 'full' | 'quick';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  amount: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  // UFA Phase 1 extensions
  project_id?: string | null;
  service_id?: string | null;
  subject?: string;
  notes?: string;
  invoice_type?: InvoiceType;
  installment_id?: string | null;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  total?: number;
  paid_amount?: number;
  is_cancelled?: boolean;
  customers?: { name: string } | null;
  projects?: { title: string } | null;
  services?: { name: string } | null;
}

// ─── Invoice Item ───
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

// ─── Receipt ───
export type ReceiptStatus = 'pending' | 'confirmed' | 'reversed';
export type ReceiptType =
  | 'invoice_payment'
  | 'prepayment'
  | 'miscellaneous_income'
  | 'unidentified';

export interface Receipt {
  id: string;
  customer_id: string | null;
  project_id: string | null;
  amount: number;
  receipt_date: string;
  bank_account_id: string | null;
  tracking_number: string;
  depositor_name: string;
  description: string;
  status: ReceiptStatus;
  receipt_type: ReceiptType;
  attachment_url: string;
  created_at: string;
  customers?: { name: string } | null;
  projects?: { title: string } | null;
  bank_accounts?: { name: string } | null;
}

// ─── Receipt Allocation ───
export interface ReceiptAllocation {
  id: string;
  receipt_id: string;
  invoice_id: string;
  allocated_amount: number;
  created_at: string;
  invoices?: { invoice_number: string } | null;
}

// ─── Customer Credit ───
export interface CustomerCredit {
  id: string;
  customer_id: string;
  amount: number;
  source_receipt_id: string | null;
  description: string;
  created_at: string;
}

// ─── Expense Category ───
export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

// ─── Expense ───
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: string;
  project_id: string | null;
  category_id: string | null;
  title: string;
  description: string;
  amount: number;
  expense_date: string;
  bank_account_id: string | null;
  status: ExpenseStatus;
  created_at: string;
  projects?: { title: string } | null;
  expense_categories?: { name: string } | null;
  bank_accounts?: { name: string } | null;
}

// ─── Contractor ───
export interface Contractor {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  national_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

// ─── Contractor Bill ───
export type ContractorBillStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface ContractorBill {
  id: string;
  contractor_id: string;
  project_id: string | null;
  bill_number: string;
  amount: number;
  bill_date: string;
  status: ContractorBillStatus;
  description: string;
  created_at: string;
  contractors?: { name: string } | null;
  projects?: { title: string } | null;
}

// ─── Contractor Payment ───
export interface ContractorPayment {
  id: string;
  contractor_id: string;
  project_id: string | null;
  bill_id: string | null;
  amount: number;
  payment_date: string;
  bank_account_id: string | null;
  tracking_number: string;
  description: string;
  created_at: string;
  contractors?: { name: string } | null;
  projects?: { title: string } | null;
  bank_accounts?: { name: string } | null;
}

// ─── Attachment ───
export type AttachmentEntityType =
  | 'customer'
  | 'project'
  | 'contract'
  | 'invoice'
  | 'receipt'
  | 'expense'
  | 'contractor_payment'
  | 'other';

export interface Attachment {
  id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  storage_key: string;
  uploaded_by: string;
  created_at: string;
}

// ─── Audit Log ───
export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_at: string;
  changed_by: string;
}

// ─── Bank Account ───
export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  balance: number;
  created_at: string;
}

// ─── Calendar Event ───
export type EventKind = 'income' | 'expense';
export type EventStatus = 'upcoming' | 'completed' | 'overdue';

export interface CalendarEvent {
  id: string;
  title: string;
  kind: EventKind;
  amount: number;
  event_date: string;
  status: EventStatus;
  created_at: string;
}

// ─── Team Member ───
export type TeamRole = 'admin' | 'accountant' | 'viewer';
export type TeamStatus = 'active' | 'invited';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  created_at: string;
}

// ─── Company Settings ───
export interface CompanySettings {
  id: string;
  company_name: string;
  currency_label: string;
  updated_at: string;
}

// ─── Report View Types ───
export interface ReportProjectProfit {
  project_id: string;
  project_code: string;
  title: string;
  customer_name: string | null;
  service_name: string | null;
  contract_amount: number;
  total_invoiced: number;
  total_received: number;
  total_expenses: number;
  total_contractor_cost: number;
  profit: number;
  remaining_balance: number;
  execution_status: ExecutionStatus;
  financial_status: FinancialStatus;
}

export interface ReportCustomerReceivables {
  customer_id: string;
  customer_name: string;
  customer_code: string | null;
  total_invoiced: number;
  total_receipts: number;
  outstanding_balance: number;
  credit_amount: number;
  credit_limit: number;
  credit_status: CreditStatus;
}

export interface ReportOverdueInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string | null;
  project_title: string | null;
  total: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  days_overdue: number;
  issue_date: string;
}

export interface ReportContractorDebt {
  contractor_id: string;
  contractor_name: string;
  total_billed: number;
  total_paid: number;
  outstanding_debt: number;
}

export interface ReportIncomeByService {
  service_id: string;
  service_name: string;
  service_code: string;
  total_invoiced: number;
  total_received: number;
}

export interface ReportExpenseByCategory {
  category_id: string;
  category_name: string;
  category_code: string;
  total_expenses: number;
  expense_count: number;
}

export interface ReportBankTreasury {
  bank_account_id: string;
  name: string;
  bank_name: string;
  account_number: string;
  recorded_balance: number;
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
}

export interface ReportCashflowEntry {
  flow_type: 'income' | 'expense' | 'contractor_payment';
  record_id: string;
  flow_date: string;
  amount: number;
  customer_name: string | null;
  project_title: string | null;
  bank_account_name: string | null;
  tracking_number: string | null;
  description: string;
}

// ─── RPC Result Types ───
export interface ConfirmReceiptResult {
  success: boolean;
  receipt_id: string;
  total_allocated: number;
  credit_created: number;
}

export interface ReverseReceiptResult {
  success: boolean;
  receipt_id: string;
  reason: string;
}

export interface ProjectCloseReadiness {
  can_close: boolean;
  blockers: string[];
  project_id: string;
}

export interface ProjectCloseResult {
  success: boolean;
  project_id: string;
  override: boolean;
  closed_by: string;
  reason?: string;
  blockers?: string[];
}

export interface IntegrityFinding {
  type: string;
  [key: string]: unknown;
}

export interface IntegrityCheckResult {
  checked_at: string;
  total_findings: number;
  findings: IntegrityFinding[];
}

// ─── View ───
export type View =
  | 'dashboard'
  | 'customers'
  | 'invoices'
  | 'calendar'
  | 'bank-accounts'
  | 'team'
  | 'reports'
  | 'settings'
  | 'projects'
  | 'contracts'
  | 'installments'
  | 'receipts'
  | 'expenses'
  | 'contractors'
  | 'attachments'
  | 'audit-log';
