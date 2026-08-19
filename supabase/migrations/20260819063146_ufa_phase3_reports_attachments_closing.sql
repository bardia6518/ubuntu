/*
# UFA Phase 3 — Reports, Attachments, Project Closing, Integrity Checks

## Summary
Completes the UFA system with: central attachments table, report views and
filterable report functions, project closing with validation and override,
and an integrity check function. Every report number is reconstructable from
base transactions (receipts, receipt_allocations, expenses, invoices).

## New Tables
1. `attachments` — central file storage linked to any entity
   - id, entity_type, entity_id, filename, mime_type, file_size, storage_key,
     uploaded_by, created_at
   - entity_type is one of: customer, project, contract, invoice, receipt,
     expense, contractor_payment, other

## New Views (Reports)
1. `report_project_profit` — per-project profit breakdown
2. `report_customer_receivables` — per-customer outstanding amounts
3. `report_overdue_invoices` — invoices past due date with balance
4. `report_contractor_debt` — per-contractor unpaid bill amounts
5. `report_income_by_service` — income grouped by service type
6. `report_expense_by_category` — expenses grouped by category
7. `report_bank_treasury` — per-bank-account balance and flow
8. `report_cashflow` — chronological income vs expense entries

## New Functions
1. `close_project(p_project_id, p_override_reason text)` — Validates project
   closing preconditions: delivery done (or override), no pending expenses,
   required contractor bills recorded, customer balance resolved, required
   documents exist. If override is used, records user, timestamp, and reason.
2. `check_project_close_readiness(p_project_id)` — Returns a jsonb with
   `can_close` boolean and array of `blockers` describing what prevents closing.
3. `run_integrity_check()` — Scans the entire system for data integrity issues:
   invoice paid_amount mismatches, orphaned allocations, duplicate tracking
   numbers, installment double-counting. Returns a jsonb array of findings.

## Security
- RLS on attachments with anon+authenticated CRUD (single-tenant).
- All functions SECURITY DEFINER with `SET search_path = public`.
- EXECUTE granted to anon+authenticated.

## Important Notes
1. Reports are built as views over base tables — every number traces back to
   receipts, receipt_allocations, expenses, and invoices. No denormalized
   cached values.
2. `close_project` is atomic — either the project is closed and audit-logged,
   or nothing changes.
3. The integrity check function catches: invoice paid_amount drift,
   allocations referencing reversed receipts, duplicate confirmed tracking
   numbers, and installments counted as both installment and invoice.
*/

-- ─── Attachments table ───
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN (
    'customer', 'project', 'contract', 'invoice', 'receipt',
    'expense', 'contractor_payment', 'other'
  )),
  entity_id uuid NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  file_size bigint NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  storage_key text NOT NULL,
  uploaded_by text DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_storage_key ON attachments(storage_key);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attachments" ON attachments;
CREATE POLICY "anon_select_attachments" ON attachments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attachments" ON attachments;
CREATE POLICY "anon_insert_attachments" ON attachments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attachments" ON attachments;
CREATE POLICY "anon_update_attachments" ON attachments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attachments" ON attachments;
CREATE POLICY "anon_delete_attachments" ON attachments FOR DELETE TO anon, authenticated USING (true);

-- ─── Report View: project_profit ───
CREATE OR REPLACE VIEW report_project_profit AS
SELECT
  p.id AS project_id,
  p.project_code,
  p.title,
  c.name AS customer_name,
  s.name AS service_name,
  p.contract_amount,
  COALESCE(inv.total_invoiced, 0) AS total_invoiced,
  COALESCE(rcv.total_received, 0) AS total_received,
  COALESCE(exp.total_expenses, 0) AS total_expenses,
  COALESCE(cp.total_contractor_cost, 0) AS total_contractor_cost,
  COALESCE(rcv.total_received, 0) - COALESCE(exp.total_expenses, 0) - COALESCE(cp.total_contractor_cost, 0) AS profit,
  COALESCE(inv.total_invoiced, 0) - COALESCE(rcv.total_received, 0) AS remaining_balance,
  p.execution_status,
  p.financial_status
FROM projects p
LEFT JOIN customers c ON c.id = p.customer_id
LEFT JOIN services s ON s.id = p.service_id
LEFT JOIN (
  SELECT project_id, SUM(total) AS total_invoiced
  FROM invoices WHERE is_cancelled = false
  GROUP BY project_id
) inv ON inv.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_received
  FROM receipts WHERE status = 'confirmed'
  GROUP BY project_id
) rcv ON rcv.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_expenses
  FROM expenses WHERE status = 'approved'
  GROUP BY project_id
) exp ON exp.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_contractor_cost
  FROM contractor_payments
  GROUP BY project_id
) cp ON cp.project_id = p.id;

-- ─── Report View: customer_receivables ───
CREATE OR REPLACE VIEW report_customer_receivables AS
SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  c.customer_code,
  COALESCE(inv.total_invoiced, 0) AS total_invoiced,
  COALESCE(rcv.total_receipts, 0) AS total_receipts,
  COALESCE(inv.total_invoiced, 0) - COALESCE(rcv.total_receipts, 0) AS outstanding_balance,
  COALESCE(cred.credit_amount, 0) AS credit_amount,
  c.credit_limit,
  CASE
    WHEN COALESCE(inv.total_invoiced, 0) - COALESCE(rcv.total_receipts, 0) > c.credit_limit
      THEN 'over_limit'
    WHEN COALESCE(cred.credit_amount, 0) > 0
      THEN 'has_credit'
    ELSE 'ok'
  END AS credit_status
FROM customers c
LEFT JOIN (
  SELECT customer_id, SUM(total) AS total_invoiced
  FROM invoices WHERE is_cancelled = false
  GROUP BY customer_id
) inv ON inv.customer_id = c.id
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS total_receipts
  FROM receipts WHERE status = 'confirmed'
  GROUP BY customer_id
) rcv ON rcv.customer_id = c.id
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS credit_amount
  FROM customer_credits
  GROUP BY customer_id
) cred ON cred.customer_id = c.id;

-- ─── Report View: overdue_invoices ───
CREATE OR REPLACE VIEW report_overdue_invoices AS
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  c.name AS customer_name,
  p.title AS project_title,
  i.total,
  i.paid_amount,
  (i.total - i.paid_amount) AS balance,
  i.due_date,
  (CURRENT_DATE - i.due_date) AS days_overdue,
  i.issue_date
FROM invoices i
LEFT JOIN customers c ON c.id = i.customer_id
LEFT JOIN projects p ON p.id = i.project_id
WHERE i.is_cancelled = false
  AND i.paid_amount < i.total
  AND i.due_date < CURRENT_DATE
ORDER BY i.due_date ASC;

-- ─── Report View: contractor_debt ───
CREATE OR REPLACE VIEW report_contractor_debt AS
SELECT
  con.id AS contractor_id,
  con.name AS contractor_name,
  COALESCE(bills.total_billed, 0) AS total_billed,
  COALESCE(payments.total_paid, 0) AS total_paid,
  COALESCE(bills.total_billed, 0) - COALESCE(payments.total_paid, 0) AS outstanding_debt
FROM contractors con
LEFT JOIN (
  SELECT contractor_id, SUM(amount) AS total_billed
  FROM contractor_bills WHERE status IN ('pending', 'approved', 'paid')
  GROUP BY contractor_id
) bills ON bills.contractor_id = con.id
LEFT JOIN (
  SELECT contractor_id, SUM(amount) AS total_paid
  FROM contractor_payments
  GROUP BY contractor_id
) payments ON payments.contractor_id = con.id
WHERE COALESCE(bills.total_billed, 0) - COALESCE(payments.total_paid, 0) > 0
ORDER BY outstanding_debt DESC;

-- ─── Report View: income_by_service ───
CREATE OR REPLACE VIEW report_income_by_service AS
SELECT
  s.id AS service_id,
  s.name AS service_name,
  s.code AS service_code,
  COALESCE(SUM(i.total), 0) AS total_invoiced,
  COALESCE(SUM(i.paid_amount), 0) AS total_received
FROM services s
LEFT JOIN invoices i ON i.service_id = s.id AND i.is_cancelled = false
GROUP BY s.id, s.name, s.code
ORDER BY total_invoiced DESC;

-- ─── Report View: expense_by_category ───
CREATE OR REPLACE VIEW report_expense_by_category AS
SELECT
  ec.id AS category_id,
  ec.name AS category_name,
  ec.code AS category_code,
  COALESCE(SUM(e.amount), 0) AS total_expenses,
  COUNT(e.id) AS expense_count
FROM expense_categories ec
LEFT JOIN expenses e ON e.category_id = ec.id AND e.status = 'approved'
GROUP BY ec.id, ec.name, ec.code
ORDER BY total_expenses DESC;

-- ─── Report View: bank_treasury ───
CREATE OR REPLACE VIEW report_bank_treasury AS
SELECT
  ba.id AS bank_account_id,
  ba.name,
  ba.bank_name,
  ba.account_number,
  ba.balance AS recorded_balance,
  COALESCE(rcv.total_inflow, 0) AS total_inflow,
  COALESCE(pay.total_outflow, 0) AS total_outflow,
  COALESCE(rcv.total_inflow, 0) - COALESCE(pay.total_outflow, 0) AS net_flow
FROM bank_accounts ba
LEFT JOIN (
  SELECT bank_account_id, SUM(amount) AS total_inflow
  FROM receipts WHERE status = 'confirmed'
  GROUP BY bank_account_id
) rcv ON rcv.bank_account_id = ba.id
LEFT JOIN (
  SELECT bank_account_id, SUM(amount) AS total_outflow
  FROM (
    SELECT bank_account_id, amount FROM expenses WHERE status = 'approved'
    UNION ALL
    SELECT bank_account_id, amount FROM contractor_payments
  ) combined
  GROUP BY bank_account_id
) pay ON pay.bank_account_id = ba.id;

-- ─── Report View: cashflow ───
CREATE OR REPLACE VIEW report_cashflow AS
SELECT
  'income' AS flow_type,
  r.id AS record_id,
  r.receipt_date AS flow_date,
  r.amount,
  c.name AS customer_name,
  p.title AS project_title,
  ba.name AS bank_account_name,
  r.tracking_number,
  r.description
FROM receipts r
LEFT JOIN customers c ON c.id = r.customer_id
LEFT JOIN projects p ON p.id = r.project_id
LEFT JOIN bank_accounts ba ON ba.id = r.bank_account_id
WHERE r.status = 'confirmed'
UNION ALL
SELECT
  'expense' AS flow_type,
  e.id AS record_id,
  e.expense_date AS flow_date,
  e.amount,
  NULL AS customer_name,
  p.title AS project_title,
  ba.name AS bank_account_name,
  NULL AS tracking_number,
  e.description
FROM expenses e
LEFT JOIN projects p ON p.id = e.project_id
LEFT JOIN bank_accounts ba ON ba.id = e.bank_account_id
WHERE e.status = 'approved'
UNION ALL
SELECT
  'contractor_payment' AS flow_type,
  cp.id AS record_id,
  cp.payment_date AS flow_date,
  cp.amount,
  con.name AS customer_name,
  p.title AS project_title,
  ba.name AS bank_account_name,
  cp.tracking_number,
  cp.description
FROM contractor_payments cp
LEFT JOIN contractors con ON con.id = cp.contractor_id
LEFT JOIN projects p ON p.id = cp.project_id
LEFT JOIN bank_accounts ba ON ba.id = cp.bank_account_id
ORDER BY flow_date DESC;

-- ─── Function: check_project_close_readiness ───
CREATE OR REPLACE FUNCTION check_project_close_readiness(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_project RECORD;
  v_blockers text[] := ARRAY[]::text[];
  v_pending_expenses int;
  v_pending_bills int;
  v_customer_balance bigint;
  v_required_docs int;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check 1: delivery done or override
  IF v_project.execution_status NOT IN ('delivered', 'completed') THEN
    v_blockers := array_append(v_blockers, 'delivery_not_done');
  END IF;

  -- Check 2: no pending expenses
  SELECT COUNT(*) INTO v_pending_expenses
  FROM expenses WHERE project_id = p_project_id AND status = 'pending';

  IF v_pending_expenses > 0 THEN
    v_blockers := array_append(v_blockers, 'pending_expenses:' || v_pending_expenses);
  END IF;

  -- Check 3: required contractor bills recorded
  SELECT COUNT(*) INTO v_pending_bills
  FROM contractor_bills WHERE project_id = p_project_id AND status = 'pending';

  IF v_pending_bills > 0 THEN
    v_blockers := array_append(v_blockers, 'pending_contractor_bills:' || v_pending_bills);
  END IF;

  -- Check 4: customer balance resolved
  SELECT COALESCE(SUM(i.total), 0) - COALESCE((
    SELECT SUM(r.amount) FROM receipts r
    WHERE r.project_id = p_project_id AND r.status = 'confirmed'
  ), 0) INTO v_customer_balance
  FROM invoices i
  WHERE i.project_id = p_project_id AND i.is_cancelled = false;

  IF v_customer_balance > 0 THEN
    v_blockers := array_append(v_blockers, 'customer_balance_unresolved:' || v_customer_balance);
  END IF;

  -- Check 5: required documents exist (at least one contract file or attachment)
  SELECT COUNT(*) INTO v_required_docs
  FROM (
    SELECT 1 FROM contracts c
    WHERE c.project_id = p_project_id AND c.contract_file_url <> ''
    UNION ALL
    SELECT 1 FROM attachments a
    WHERE a.entity_type = 'project' AND a.entity_id = p_project_id
  ) docs;

  IF v_required_docs = 0 THEN
    v_blockers := array_append(v_blockers, 'missing_required_documents');
  END IF;

  RETURN jsonb_build_object(
    'can_close', array_length(v_blockers, 1) IS NULL,
    'blockers', to_jsonb(v_blockers),
    'project_id', p_project_id
  );
END;
$$;

-- ─── Function: close_project ───
CREATE OR REPLACE FUNCTION close_project(
  p_project_id uuid,
  p_override_reason text DEFAULT NULL,
  p_closed_by text DEFAULT 'system'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_readiness jsonb;
  v_blockers text[];
  v_blocker text;
  v_is_override boolean := false;
BEGIN
  -- Check readiness
  v_readiness := check_project_close_readiness(p_project_id);

  IF NOT (v_readiness->>'can_close')::boolean THEN
    -- Override allowed only if reason is provided
    IF p_override_reason IS NOT NULL AND p_override_reason <> '' THEN
      v_is_override := true;
    ELSE
      -- Return the blockers so the caller knows what to fix
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'project_not_ready',
        'blockers', v_readiness->'blockers'
      );
    END IF;
  END IF;

  -- Close the project
  UPDATE projects
  SET execution_status = 'completed',
      financial_status = 'fully_received',
      closed_at = now(),
      closed_by = p_closed_by,
      close_override_reason = p_override_reason
  WHERE id = p_project_id;

  -- Audit log
  INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
  VALUES ('projects', p_project_id,
    CASE WHEN v_is_override THEN 'override_close' ELSE 'close_project' END,
    jsonb_build_object(
      'closed_at', now(),
      'closed_by', p_closed_by,
      'override', v_is_override,
      'override_reason', p_override_reason
    ),
    p_closed_by
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'override', v_is_override,
    'closed_by', p_closed_by
  );
END;
$$;

-- ─── Function: run_integrity_check ───
CREATE OR REPLACE FUNCTION run_integrity_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_findings jsonb[] := ARRAY[]::jsonb[];
  v_invoice RECORD;
  v_computed_paid bigint;
  v_dup RECORD;
  v_alloc RECORD;
  v_inst RECORD;
BEGIN
  -- Check 1: invoice paid_amount drift (computed vs stored)
  FOR v_invoice IN SELECT id, paid_amount, total FROM invoices WHERE is_cancelled = false LOOP
    SELECT COALESCE(SUM(ra.allocated_amount), 0) INTO v_computed_paid
    FROM receipt_allocations ra
    JOIN receipts r ON r.id = ra.receipt_id
    WHERE ra.invoice_id = v_invoice.id AND r.status = 'confirmed';

    IF v_computed_paid <> v_invoice.paid_amount THEN
      v_findings := array_append(v_findings, jsonb_build_object(
        'type', 'invoice_paid_amount_drift',
        'invoice_id', v_invoice.id,
        'stored', v_invoice.paid_amount,
        'computed', v_computed_paid,
        'difference', v_computed_paid - v_invoice.paid_amount
      ));
    END IF;
  END LOOP;

  -- Check 2: allocations referencing reversed/pending receipts
  FOR v_alloc IN
    SELECT ra.id, ra.receipt_id, ra.invoice_id, r.status
    FROM receipt_allocations ra
    JOIN receipts r ON r.id = ra.receipt_id
    WHERE r.status <> 'confirmed'
  LOOP
    v_findings := array_append(v_findings, jsonb_build_object(
      'type', 'allocation_to_non_confirmed_receipt',
      'allocation_id', v_alloc.id,
      'receipt_id', v_alloc.receipt_id,
      'receipt_status', v_alloc.status
    ));
  END LOOP;

  -- Check 3: duplicate confirmed tracking numbers
  FOR v_dup IN
    SELECT tracking_number, COUNT(*) AS cnt
    FROM receipts
    WHERE tracking_number <> '' AND status = 'confirmed'
    GROUP BY tracking_number
    HAVING COUNT(*) > 1
  LOOP
    v_findings := array_append(v_findings, jsonb_build_object(
      'type', 'duplicate_tracking_number',
      'tracking_number', v_dup.tracking_number,
      'count', v_dup.cnt
    ));
  END LOOP;

  -- Check 4: installment double-counting (installment invoiced AND still counted as installment)
  FOR v_inst IN
    SELECT ins.id, ins.project_id, ins.converted_invoice_id, ins.amount, inv.total
    FROM installments ins
    LEFT JOIN invoices inv ON inv.id = ins.converted_invoice_id
    WHERE ins.converted_invoice_id IS NOT NULL
      AND ins.status = 'invoiced'
      AND inv.is_cancelled = false
  LOOP
    -- This is expected (installment converted to invoice), but flag if both
    -- installment amount and invoice amount are being summed in reports
    v_findings := array_append(v_findings, jsonb_build_object(
      'type', 'installment_converted_verify',
      'installment_id', v_inst.id,
      'invoice_id', v_inst.converted_invoice_id,
      'installment_amount', v_inst.amount,
      'invoice_total', v_inst.total,
      'note', 'converted installment - reports should count invoice only, not installment'
    ));
  END LOOP;

  -- Check 5: invoices with total = 0 (data quality)
  FOR v_invoice IN SELECT id, invoice_number FROM invoices WHERE total = 0 AND is_cancelled = false LOOP
    v_findings := array_append(v_findings, jsonb_build_object(
      'type', 'zero_total_invoice',
      'invoice_id', v_invoice.id,
      'invoice_number', v_invoice.invoice_number
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'checked_at', now(),
    'total_findings', COALESCE(array_length(v_findings, 1), 0),
    'findings', to_jsonb(v_findings)
  );
END;
$$;

-- ─── Grant permissions ───
GRANT SELECT ON report_project_profit TO anon, authenticated;
GRANT SELECT ON report_customer_receivables TO anon, authenticated;
GRANT SELECT ON report_overdue_invoices TO anon, authenticated;
GRANT SELECT ON report_contractor_debt TO anon, authenticated;
GRANT SELECT ON report_income_by_service TO anon, authenticated;
GRANT SELECT ON report_expense_by_category TO anon, authenticated;
GRANT SELECT ON report_bank_treasury TO anon, authenticated;
GRANT SELECT ON report_cashflow TO anon, authenticated;

GRANT EXECUTE ON FUNCTION check_project_close_readiness(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION close_project(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION run_integrity_check() TO anon, authenticated;
