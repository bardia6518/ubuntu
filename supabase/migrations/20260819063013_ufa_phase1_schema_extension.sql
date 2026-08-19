/*
# UFA Phase 1 — Schema Extension: Core Financial Data Model

## Summary
Extends the existing finance schema with the full UFA data model: services,
projects, contracts, installments, invoice line items, receipts, receipt
allocations, customer credits, expenses, expense categories, contractors,
contractor bills, contractor payments, and audit log. Also extends the
existing `customers` and `invoices` tables with the fields required by the spec.

## Tables Modified
1. `customers` — added: customer_code, entity_type, legal_name, trade_name,
   contact_person, national_id, economic_code, address, credit_limit,
   payment_terms.
2. `invoices` — added: project_id, service_id, subject, notes, invoice_type,
   installment_id, subtotal, discount_amount, tax_amount, total, paid_amount,
   is_cancelled. Status CHECK replaced with UFA status set; existing rows
   mapped (pending→unpaid, overdue→overdue, paid→paid).

## New Tables
1. `services` — catalog of service types
2. `projects` — central hub for financial operations
3. `contracts` — linked to a project
4. `installments` — linked to a contract
5. `invoice_items` — line items for invoices
6. `receipts` — customer payment records
7. `receipt_allocations` — allocation of a receipt to one or more invoices
8. `customer_credits` — unallocated or excess payments
9. `expense_categories` — categories for expenses
10. `expenses` — project/company costs
11. `contractors` — external partners/contractors
12. `contractor_bills` — bills from contractors
13. `contractor_payments` — payments to contractors
14. `audit_log` — immutable audit trail

## Security
- RLS enabled on all new tables with anon+authenticated full CRUD (single-tenant,
  no auth screen, intentionally shared workspace data).
- Column-level UPDATE revoked on `invoices.paid_amount` — managed only by
  SECURITY DEFINER functions.

## Important Notes
1. All monetary columns use `bigint` (integer Tomans) — no floating-point.
2. `invoices.paid_amount` is NOT client-writable; computed from confirmed
   receipt allocations by the confirm_receipt_with_allocations RPC.
3. `installments.converted_invoice_id` tracks installment→invoice conversion,
   preventing double-counting in financial views.
4. Duplicate tracking numbers prevented by partial unique index on confirmed
   receipts only.
*/

-- ─── Extend customers table ───
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_code text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'person';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trade_name text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person text DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS national_id text DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS economic_code text DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit bigint DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT '';

-- Backfill entity_type from kind for existing rows
UPDATE customers SET entity_type = kind WHERE entity_type IS NULL AND kind IS NOT NULL;

-- Unique indexes for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS customers_national_id_key
  ON customers (national_id) WHERE national_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_key
  ON customers (phone) WHERE phone <> '';
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_key
  ON customers (lower(email)) WHERE email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_code_key
  ON customers (customer_code) WHERE customer_code IS NOT NULL;

-- ─── Extend invoices table ───
-- Step 1: Drop old status constraint FIRST
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Step 2: Map existing statuses to new vocabulary
UPDATE invoices SET status = 'unpaid' WHERE status = 'pending';

-- Step 3: Add new status constraint
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled', 'overpaid'));

-- Step 4: Add new columns (without inline CHECK to avoid re-validation issues)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subject text DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'full';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS installment_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal bigint DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount bigint DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount bigint DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total bigint DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount bigint DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false;

-- Add invoice_type CHECK constraint separately
DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_type_check
    CHECK (invoice_type IN ('full', 'quick'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill total from amount for existing rows
UPDATE invoices SET total = amount::bigint WHERE total = 0 AND amount > 0;

-- ─── Services table ───
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Projects table ───
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  contract_amount bigint NOT NULL DEFAULT 0,
  estimated_cost bigint NOT NULL DEFAULT 0,
  start_date date,
  delivery_deadline date,
  project_manager text DEFAULT '',
  execution_status text NOT NULL DEFAULT 'not_started',
  financial_status text NOT NULL DEFAULT 'no_contract',
  next_action text DEFAULT '',
  closed_at timestamptz,
  closed_by text,
  close_override_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add CHECK constraints for projects separately
DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_execution_status_check
    CHECK (execution_status IN ('not_started', 'in_progress', 'delivered', 'completed', 'on_hold', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_financial_status_check
    CHECK (financial_status IN ('no_contract', 'contracted', 'invoicing', 'partial_received', 'fully_received', 'overdue'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);

-- Now add FKs for invoices (projects table now exists)
DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT invoices_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT invoices_service_id_fkey
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- ─── Contracts table ───
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount bigint NOT NULL DEFAULT 0,
  terms text DEFAULT '',
  contract_file_url text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check
    CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);

-- ─── Installments table ───
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount bigint NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  converted_invoice_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE installments ADD CONSTRAINT installments_status_check
    CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_installments_contract_id ON installments(contract_id);
CREATE INDEX IF NOT EXISTS idx_installments_project_id ON installments(project_id);

-- Add installment FK to invoices now that installments exists
DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT invoices_installment_id_fkey
    FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- ─── Invoice items table ───
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price bigint NOT NULL DEFAULT 0,
  line_total bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_quantity_check CHECK (quantity > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_unit_price_check CHECK (unit_price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ─── Receipts table ───
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  amount bigint NOT NULL DEFAULT 0,
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  tracking_number text DEFAULT '',
  depositor_name text DEFAULT '',
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  receipt_type text NOT NULL DEFAULT 'invoice_payment',
  attachment_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE receipts ADD CONSTRAINT receipts_amount_check CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE receipts ADD CONSTRAINT receipts_status_check
    CHECK (status IN ('pending', 'confirmed', 'reversed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE receipts ADD CONSTRAINT receipts_receipt_type_check
    CHECK (receipt_type IN ('invoice_payment', 'prepayment', 'miscellaneous_income', 'unidentified'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(project_id);

-- Duplicate tracking number prevention (only for confirmed receipts)
CREATE UNIQUE INDEX IF NOT EXISTS receipts_tracking_number_confirmed_key
  ON receipts (tracking_number) WHERE tracking_number <> '' AND status = 'confirmed';

-- ─── Receipt allocations table ───
CREATE TABLE IF NOT EXISTS receipt_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE receipt_allocations ADD CONSTRAINT receipt_allocations_allocated_amount_check
    CHECK (allocated_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_receipt_allocations_receipt_id ON receipt_allocations(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_allocations_invoice_id ON receipt_allocations(invoice_id);

-- ─── Customer credits table ───
CREATE TABLE IF NOT EXISTS customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount bigint NOT NULL DEFAULT 0,
  source_receipt_id uuid REFERENCES receipts(id) ON DELETE SET NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_id ON customer_credits(customer_id);

-- ─── Expense categories table ───
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Expenses table ───
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  amount bigint NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE expenses ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE expenses ADD CONSTRAINT expenses_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);

-- ─── Contractors table ───
CREATE TABLE IF NOT EXISTS contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  national_id text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE contractors ADD CONSTRAINT contractors_status_check
    CHECK (status IN ('active', 'inactive'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Contractor bills table ───
CREATE TABLE IF NOT EXISTS contractor_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  bill_number text NOT NULL,
  amount bigint NOT NULL DEFAULT 0,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE contractor_bills ADD CONSTRAINT contractor_bills_amount_check CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contractor_bills ADD CONSTRAINT contractor_bills_status_check
    CHECK (status IN ('pending', 'approved', 'paid', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contractor_bills_contractor_id ON contractor_bills(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_bills_project_id ON contractor_bills(project_id);

-- ─── Contractor payments table ───
CREATE TABLE IF NOT EXISTS contractor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  bill_id uuid REFERENCES contractor_bills(id) ON DELETE SET NULL,
  amount bigint NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  tracking_number text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE contractor_payments ADD CONSTRAINT contractor_payments_amount_check CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contractor_payments_contractor_id ON contractor_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_project_id ON contractor_payments(project_id);

-- ─── Audit log table ───
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by text DEFAULT 'system'
);

DO $$ BEGIN
  ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check
    CHECK (action IN ('insert', 'update', 'delete', 'confirm', 'reverse', 'convert', 'cancel', 'close_project', 'override_close'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- ─── Enable RLS on all new tables ───
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies (anon+authenticated, single-tenant shared workspace) ───
-- services
DROP POLICY IF EXISTS "anon_select_services" ON services;
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_services" ON services;
CREATE POLICY "anon_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_services" ON services;
CREATE POLICY "anon_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_services" ON services;
CREATE POLICY "anon_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- projects
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

-- contracts
DROP POLICY IF EXISTS "anon_select_contracts" ON contracts;
CREATE POLICY "anon_select_contracts" ON contracts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contracts" ON contracts;
CREATE POLICY "anon_insert_contracts" ON contracts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contracts" ON contracts;
CREATE POLICY "anon_update_contracts" ON contracts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contracts" ON contracts;
CREATE POLICY "anon_delete_contracts" ON contracts FOR DELETE TO anon, authenticated USING (true);

-- installments
DROP POLICY IF EXISTS "anon_select_installments" ON installments;
CREATE POLICY "anon_select_installments" ON installments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_installments" ON installments;
CREATE POLICY "anon_insert_installments" ON installments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_installments" ON installments;
CREATE POLICY "anon_update_installments" ON installments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_installments" ON installments;
CREATE POLICY "anon_delete_installments" ON installments FOR DELETE TO anon, authenticated USING (true);

-- invoice_items
DROP POLICY IF EXISTS "anon_select_invoice_items" ON invoice_items;
CREATE POLICY "anon_select_invoice_items" ON invoice_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE TO anon, authenticated USING (true);

-- receipts
DROP POLICY IF EXISTS "anon_select_receipts" ON receipts;
CREATE POLICY "anon_select_receipts" ON receipts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_receipts" ON receipts;
CREATE POLICY "anon_insert_receipts" ON receipts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_receipts" ON receipts;
CREATE POLICY "anon_update_receipts" ON receipts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_receipts" ON receipts;
CREATE POLICY "anon_delete_receipts" ON receipts FOR DELETE TO anon, authenticated USING (true);

-- receipt_allocations
DROP POLICY IF EXISTS "anon_select_receipt_allocations" ON receipt_allocations;
CREATE POLICY "anon_select_receipt_allocations" ON receipt_allocations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_receipt_allocations" ON receipt_allocations;
CREATE POLICY "anon_insert_receipt_allocations" ON receipt_allocations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_receipt_allocations" ON receipt_allocations;
CREATE POLICY "anon_update_receipt_allocations" ON receipt_allocations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_receipt_allocations" ON receipt_allocations;
CREATE POLICY "anon_delete_receipt_allocations" ON receipt_allocations FOR DELETE TO anon, authenticated USING (true);

-- customer_credits
DROP POLICY IF EXISTS "anon_select_customer_credits" ON customer_credits;
CREATE POLICY "anon_select_customer_credits" ON customer_credits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customer_credits" ON customer_credits;
CREATE POLICY "anon_insert_customer_credits" ON customer_credits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customer_credits" ON customer_credits;
CREATE POLICY "anon_update_customer_credits" ON customer_credits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customer_credits" ON customer_credits;
CREATE POLICY "anon_delete_customer_credits" ON customer_credits FOR DELETE TO anon, authenticated USING (true);

-- expense_categories
DROP POLICY IF EXISTS "anon_select_expense_categories" ON expense_categories;
CREATE POLICY "anon_select_expense_categories" ON expense_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expense_categories" ON expense_categories;
CREATE POLICY "anon_insert_expense_categories" ON expense_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expense_categories" ON expense_categories;
CREATE POLICY "anon_update_expense_categories" ON expense_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expense_categories" ON expense_categories;
CREATE POLICY "anon_delete_expense_categories" ON expense_categories FOR DELETE TO anon, authenticated USING (true);

-- expenses
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- contractors
DROP POLICY IF EXISTS "anon_select_contractors" ON contractors;
CREATE POLICY "anon_select_contractors" ON contractors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contractors" ON contractors;
CREATE POLICY "anon_insert_contractors" ON contractors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contractors" ON contractors;
CREATE POLICY "anon_update_contractors" ON contractors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contractors" ON contractors;
CREATE POLICY "anon_delete_contractors" ON contractors FOR DELETE TO anon, authenticated USING (true);

-- contractor_bills
DROP POLICY IF EXISTS "anon_select_contractor_bills" ON contractor_bills;
CREATE POLICY "anon_select_contractor_bills" ON contractor_bills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contractor_bills" ON contractor_bills;
CREATE POLICY "anon_insert_contractor_bills" ON contractor_bills FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contractor_bills" ON contractor_bills;
CREATE POLICY "anon_update_contractor_bills" ON contractor_bills FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contractor_bills" ON contractor_bills;
CREATE POLICY "anon_delete_contractor_bills" ON contractor_bills FOR DELETE TO anon, authenticated USING (true);

-- contractor_payments
DROP POLICY IF EXISTS "anon_select_contractor_payments" ON contractor_payments;
CREATE POLICY "anon_select_contractor_payments" ON contractor_payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contractor_payments" ON contractor_payments;
CREATE POLICY "anon_insert_contractor_payments" ON contractor_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contractor_payments" ON contractor_payments;
CREATE POLICY "anon_update_contractor_payments" ON contractor_payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contractor_payments" ON contractor_payments;
CREATE POLICY "anon_delete_contractor_payments" ON contractor_payments FOR DELETE TO anon, authenticated USING (true);

-- audit_log (read + insert for anon; no direct update/delete)
DROP POLICY IF EXISTS "anon_select_audit_log" ON audit_log;
CREATE POLICY "anon_select_audit_log" ON audit_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_log" ON audit_log;
CREATE POLICY "anon_insert_audit_log" ON audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ─── Revoke direct UPDATE on computed columns ───
REVOKE UPDATE (paid_amount) ON invoices FROM anon, authenticated;

-- ─── Seed default services ───
INSERT INTO services (name, code, is_active) VALUES
  ('طراحی وب‌سایت', 'web_design', true),
  ('بازطراحی وب‌سایت', 'redesign', true),
  ('سئو (SEO)', 'seo', true),
  ('پشتیبانی', 'support', true),
  ('هاستینگ', 'hosting', true),
  ('دامنه', 'domain', true),
  ('سرور', 'server', true),
  ('طراحی گرافیک', 'graphic_design', true),
  ('سایر خدمات', 'other', true)
ON CONFLICT (code) DO NOTHING;

-- ─── Seed default expense categories ───
INSERT INTO expense_categories (name, code) VALUES
  ('دستمزد', 'labor'),
  ('هاست و دامنه', 'hosting_domain'),
  ('خرید نرم‌افزار', 'software'),
  ('سخت‌افزار', 'hardware'),
  ('تبلیغات', 'marketing'),
  ('اداری', 'administrative'),
  ('سایر', 'other')
ON CONFLICT (code) DO NOTHING;
