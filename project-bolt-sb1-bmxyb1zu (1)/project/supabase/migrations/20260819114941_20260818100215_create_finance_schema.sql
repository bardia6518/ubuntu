/*
# Finance & Accounting dashboard schema

## Summary
Creates the full data model behind the finance dashboard: customers, invoices,
bank accounts, financial calendar events, team members, and a single company
settings row. This is a single-tenant application (no sign-in screen), so all
data is shared across everyone who opens the app and every table is readable
and writable by the anon key.

## New Tables
1. `customers` — client/vendor directory
2. `invoices` — sales invoices
3. `bank_accounts` — company bank/cash accounts
4. `calendar_events` — upcoming/past financial events
5. `team_members` — collaborators with access to the workspace
6. `company_settings` — single row of workspace-wide settings

## Security
Row Level Security is enabled on every table. Because this app has no login
screen, every policy grants `anon, authenticated` access with `true`
predicates — the data is intentionally shared workspace data, not scoped to
an individual user.
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'person' CHECK (kind IN ('person', 'company')),
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed')),
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'income' CHECK (kind IN ('income', 'expense')),
  amount numeric NOT NULL DEFAULT 0,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'accountant', 'viewer')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'شرکت من',
  currency_label text NOT NULL DEFAULT 'تومان',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO company_settings (company_name, currency_label)
SELECT 'شرکت بردیا', 'تومان'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_select_bank_accounts" ON bank_accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_insert_bank_accounts" ON bank_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_update_bank_accounts" ON bank_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_delete_bank_accounts" ON bank_accounts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_calendar_events" ON calendar_events;
CREATE POLICY "anon_select_calendar_events" ON calendar_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_calendar_events" ON calendar_events;
CREATE POLICY "anon_insert_calendar_events" ON calendar_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_calendar_events" ON calendar_events;
CREATE POLICY "anon_update_calendar_events" ON calendar_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_calendar_events" ON calendar_events;
CREATE POLICY "anon_delete_calendar_events" ON calendar_events FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_team_members" ON team_members;
CREATE POLICY "anon_select_team_members" ON team_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_team_members" ON team_members;
CREATE POLICY "anon_insert_team_members" ON team_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_team_members" ON team_members;
CREATE POLICY "anon_update_team_members" ON team_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_team_members" ON team_members;
CREATE POLICY "anon_delete_team_members" ON team_members FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_company_settings" ON company_settings;
CREATE POLICY "anon_select_company_settings" ON company_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_company_settings" ON company_settings;
CREATE POLICY "anon_update_company_settings" ON company_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);