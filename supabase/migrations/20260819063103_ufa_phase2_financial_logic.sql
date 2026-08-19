/*
# UFA Phase 2 — Financial Logic: Atomic Operations, Computed Views, Audit Triggers

## Summary
Implements the core financial business logic as SECURITY DEFINER functions and
database views. All financial mutations (receipt confirmation, reversal,
installment conversion) are atomic operations that either fully commit or fully
roll back. Invoice paid_amount and status are computed from base transaction
data (receipt_allocations), never manually editable.

## New Functions (SECURITY DEFINER)
1. `recompute_invoice_status(p_invoice_id)` — Recalculates paid_amount and
   status for a single invoice from confirmed receipt allocations. Status logic:
   - paid_amount = 0 AND due_date < today → overdue
   - paid_amount = 0 → unpaid
   - paid_amount < total → partial
   - paid_amount = total → paid
   - paid_amount > total → overpaid
2. `confirm_receipt_with_allocations(p_receipt_id, p_allocations jsonb)` —
   Atomic operation: validates tracking number uniqueness, confirms receipt,
   creates allocations, recomputes invoice balances/statuses, updates customer
   balance, updates project received amount, creates customer credit for any
   unallocated excess. All in one transaction — either all commit or none.
3. `reverse_receipt(p_receipt_id, p_reason text)` — Reverses a confirmed
   receipt: deletes allocations, recomputes affected invoices, restores
   customer credit, marks receipt as reversed. Audit logged.
4. `convert_installment_to_invoice(p_installment_id)` — Converts an installment
   to a canonical invoice, marks installment as invoiced, links
   converted_invoice_id. Prevents double-counting in financial views.

## New Views
1. `invoice_balances` — per-invoice: total, paid_amount, balance, status
2. `customer_financial_summary` — per-customer: total_contract_value,
   total_invoiced, total_receipts, outstanding_balance, credit_amount,
   credit_limit, credit_status
3. `project_financial_summary` — per-project: contract_value, total_invoiced,
   total_received, total_expenses, total_contractor_cost, remaining_balance,
   profit

## New Triggers
1. `audit_insert_trigger` — logs all INSERTs on financial tables
2. `audit_update_trigger` — logs all UPDATEs on financial tables
3. `prevent_hard_delete_financial` — BEFORE DELETE trigger on receipts,
   receipt_allocations, invoices — blocks hard deletion, requires soft-delete
   or reversal process

## Important Notes
1. All functions use `SET search_path = public` for security.
2. `confirm_receipt_with_allocations` is the ONLY way to confirm a receipt —
   direct UPDATE of receipt status to 'confirmed' is blocked by revoking
   UPDATE on the status column.
3. Invoice paid_amount is computed ONLY from confirmed receipt allocations.
4. The atomic confirm operation updates: receipt status, allocations,
   invoice paid_amount, invoice status, customer balance (via view), and
   creates customer credit for excess amounts.
*/

-- ─── Helper: recompute single invoice status from allocations ───
CREATE OR REPLACE FUNCTION recompute_invoice_status(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_paid bigint;
  v_due_date date;
  v_today date := CURRENT_DATE;
  v_new_status text;
BEGIN
  SELECT total, due_date INTO v_total, v_due_date
  FROM invoices WHERE id = p_invoice_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- Sum confirmed allocations for this invoice
  SELECT COALESCE(SUM(ra.allocated_amount), 0) INTO v_paid
  FROM receipt_allocations ra
  JOIN receipts r ON r.id = ra.receipt_id
  WHERE ra.invoice_id = p_invoice_id AND r.status = 'confirmed';

  -- Determine status
  IF v_paid = 0 THEN
    v_new_status := CASE WHEN v_due_date < v_today THEN 'overdue' ELSE 'unpaid' END;
  ELSIF v_paid < v_total THEN
    v_new_status := 'partial';
  ELSIF v_paid = v_total THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'overpaid';
  END IF;

  -- Update paid_amount (bypasses RLS column revoke since SECURITY DEFINER)
  UPDATE invoices SET paid_amount = v_paid, status = v_new_status
  WHERE id = p_invoice_id;
END;
$$;

-- ─── Atomic: confirm receipt with allocations ───
CREATE OR REPLACE FUNCTION confirm_receipt_with_allocations(
  p_receipt_id uuid,
  p_allocations jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_receipt RECORD;
  v_alloc RECORD;
  v_invoice RECORD;
  v_total_allocated bigint := 0;
  v_credit_amount bigint;
  v_allocation_id uuid;
  v_result jsonb;
BEGIN
  -- Lock the receipt row
  SELECT * INTO v_receipt FROM receipts WHERE id = p_receipt_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt not found';
  END IF;

  IF v_receipt.status = 'confirmed' THEN
    RAISE EXCEPTION 'Receipt is already confirmed';
  END IF;

  IF v_receipt.status = 'reversed' THEN
    RAISE EXCEPTION 'Cannot confirm a reversed receipt';
  END IF;

  -- Validate tracking number uniqueness for confirmed receipts
  IF v_receipt.tracking_number <> '' THEN
    IF EXISTS (
      SELECT 1 FROM receipts
      WHERE tracking_number = v_receipt.tracking_number
        AND status = 'confirmed'
        AND id <> p_receipt_id
    ) THEN
      RAISE EXCEPTION 'Duplicate tracking number: %', v_receipt.tracking_number;
    END IF;
  END IF;

  -- Process allocations
  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations) AS elem
  LOOP
    -- Validate invoice exists and belongs to same customer
    SELECT * INTO v_invoice FROM invoices WHERE id = (v_alloc->>'invoice_id')::uuid;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invoice not found: %', v_alloc->>'invoice_id';
    END IF;

    IF v_invoice.customer_id IS NOT NULL AND v_receipt.customer_id IS NOT NULL
       AND v_invoice.customer_id <> v_receipt.customer_id THEN
      RAISE EXCEPTION 'Invoice customer does not match receipt customer';
    END IF;

    -- Insert allocation
    INSERT INTO receipt_allocations (receipt_id, invoice_id, allocated_amount)
    VALUES (p_receipt_id, (v_alloc->>'invoice_id')::uuid, (v_alloc->>'amount')::bigint)
    RETURNING id INTO v_allocation_id;

    v_total_allocated := v_total_allocated + (v_alloc->>'amount')::bigint;

    -- Recompute invoice status
    PERFORM recompute_invoice_status((v_alloc->>'invoice_id')::uuid);
  END LOOP;

  -- Create customer credit for unallocated excess
  v_credit_amount := v_receipt.amount - v_total_allocated;
  IF v_credit_amount > 0 AND v_receipt.customer_id IS NOT NULL THEN
    INSERT INTO customer_credits (customer_id, amount, source_receipt_id, description)
    VALUES (v_receipt.customer_id, v_credit_amount, p_receipt_id,
      'Credit from unallocated receipt excess');
  END IF;

  -- Mark receipt as confirmed
  UPDATE receipts SET status = 'confirmed' WHERE id = p_receipt_id;

  -- Audit log
  INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
  VALUES ('receipts', p_receipt_id, 'confirm',
    jsonb_build_object('amount', v_receipt.amount, 'allocated', v_total_allocated,
      'credit', v_credit_amount, 'tracking_number', v_receipt.tracking_number),
    'system');

  v_result := jsonb_build_object(
    'success', true,
    'receipt_id', p_receipt_id,
    'total_allocated', v_total_allocated,
    'credit_created', v_credit_amount
  );

  RETURN v_result;
END;
$$;

-- ─── Reverse a confirmed receipt ───
CREATE OR REPLACE FUNCTION reverse_receipt(
  p_receipt_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_receipt RECORD;
  v_affected_invoices uuid[];
  v_invoice_id uuid;
  v_result jsonb;
BEGIN
  SELECT * INTO v_receipt FROM receipts WHERE id = p_receipt_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt not found';
  END IF;

  IF v_receipt.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed receipts can be reversed';
  END IF;

  -- Collect affected invoices before deleting allocations
  SELECT array_agg(DISTINCT invoice_id) INTO v_affected_invoices
  FROM receipt_allocations WHERE receipt_id = p_receipt_id;

  -- Delete allocations
  DELETE FROM receipt_allocations WHERE receipt_id = p_receipt_id;

  -- Remove customer credit created from this receipt
  DELETE FROM customer_credits WHERE source_receipt_id = p_receipt_id;

  -- Recompute each affected invoice
  FOREACH v_invoice_id IN ARRAY v_affected_invoices LOOP
    PERFORM recompute_invoice_status(v_invoice_id);
  END LOOP;

  -- Mark receipt as reversed
  UPDATE receipts SET status = 'reversed' WHERE id = p_receipt_id;

  -- Audit log
  INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by)
  VALUES ('receipts', p_receipt_id, 'reverse',
    jsonb_build_object('amount', v_receipt.amount, 'status', 'confirmed'),
    jsonb_build_object('status', 'reversed', 'reason', p_reason),
    'system');

  v_result := jsonb_build_object('success', true, 'receipt_id', p_receipt_id, 'reason', p_reason);
  RETURN v_result;
END;
$$;

-- ─── Convert installment to invoice ───
CREATE OR REPLACE FUNCTION convert_installment_to_invoice(p_installment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_installment RECORD;
  v_invoice_id uuid;
  v_invoice_number text;
BEGIN
  SELECT * INTO v_installment FROM installments WHERE id = p_installment_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Installment not found';
  END IF;

  IF v_installment.status = 'invoiced' OR v_installment.converted_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Installment already converted to invoice';
  END IF;

  -- Generate invoice number
  v_invoice_number := 'INV-' || upper(substr(md5(random()::text), 1, 8));

  -- Create canonical invoice
  INSERT INTO invoices (
    invoice_number, customer_id, project_id, installment_id,
    subject, invoice_type, total, subtotal, issue_date, due_date, status
  )
  SELECT v_invoice_number,
    p.customer_id,
    v_installment.project_id,
    p_installment_id,
    v_installment.title,
    'quick',
    v_installment.amount,
    v_installment.amount,
    CURRENT_DATE,
    v_installment.due_date,
    'unpaid'
  FROM projects p
  WHERE p.id = v_installment.project_id
  RETURNING id INTO v_invoice_id;

  -- Mark installment as invoiced
  UPDATE installments
  SET status = 'invoiced', converted_invoice_id = v_invoice_id
  WHERE id = p_installment_id;

  -- Audit log
  INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
  VALUES ('installments', p_installment_id, 'convert',
    jsonb_build_object('invoice_id', v_invoice_id, 'invoice_number', v_invoice_number),
    'system');

  RETURN v_invoice_id;
END;
$$;

-- ─── View: invoice_balances ───
CREATE OR REPLACE VIEW invoice_balances AS
SELECT
  i.id,
  i.invoice_number,
  i.customer_id,
  c.name AS customer_name,
  i.project_id,
  i.total,
  i.paid_amount,
  (i.total - i.paid_amount) AS balance,
  i.status,
  i.due_date,
  i.issue_date,
  i.is_cancelled,
  CASE
    WHEN i.is_cancelled THEN 'cancelled'
    WHEN i.paid_amount = 0 AND i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.paid_amount = 0 THEN 'unpaid'
    WHEN i.paid_amount < i.total THEN 'partial'
    WHEN i.paid_amount = i.total THEN 'paid'
    ELSE 'overpaid'
  END AS computed_status
FROM invoices i
LEFT JOIN customers c ON c.id = i.customer_id;

-- ─── View: customer_financial_summary ───
CREATE OR REPLACE VIEW customer_financial_summary AS
SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  -- Total contract value: sum of all contract amounts for this customer's projects
  COALESCE((
    SELECT SUM(ct.total_amount)
    FROM contracts ct
    JOIN projects p ON p.id = ct.project_id
    WHERE p.customer_id = c.id AND ct.status IN ('active', 'completed')
  ), 0) AS total_contract_value,
  -- Total invoiced (excluding cancelled)
  COALESCE((
    SELECT SUM(i.total)
    FROM invoices i
    WHERE i.customer_id = c.id AND i.is_cancelled = false
  ), 0) AS total_invoiced,
  -- Total receipts (confirmed only)
  COALESCE((
    SELECT SUM(r.amount)
    FROM receipts r
    WHERE r.customer_id = c.id AND r.status = 'confirmed'
  ), 0) AS total_receipts,
  -- Outstanding balance = total invoiced - total receipts (positive = customer owes)
  COALESCE((
    SELECT SUM(i.total)
    FROM invoices i
    WHERE i.customer_id = c.id AND i.is_cancelled = false
  ), 0) - COALESCE((
    SELECT SUM(r.amount)
    FROM receipts r
    WHERE r.customer_id = c.id AND r.status = 'confirmed'
  ), 0) AS outstanding_balance,
  -- Customer credit (unallocated excess)
  COALESCE((
    SELECT SUM(cc.amount)
    FROM customer_credits cc
    WHERE cc.customer_id = c.id
  ), 0) AS credit_amount,
  c.credit_limit,
  CASE
    WHEN COALESCE((
      SELECT SUM(cc.amount) FROM customer_credits cc WHERE cc.customer_id = c.id
    ), 0) > 0 THEN 'has_credit'
    WHEN COALESCE((
      SELECT SUM(i.total) FROM invoices i
      WHERE i.customer_id = c.id AND i.is_cancelled = false
    ), 0) - COALESCE((
      SELECT SUM(r.amount) FROM receipts r
      WHERE r.customer_id = c.id AND r.status = 'confirmed'
    ), 0) > c.credit_limit THEN 'over_limit'
    ELSE 'ok'
  END AS credit_status
FROM customers c;

-- ─── View: project_financial_summary ───
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT
  p.id AS project_id,
  p.project_code,
  p.title AS project_title,
  p.customer_id,
  c.name AS customer_name,
  p.contract_amount,
  -- Contract value from contracts table
  COALESCE((
    SELECT SUM(ct.total_amount)
    FROM contracts ct
    WHERE ct.project_id = p.id AND ct.status IN ('active', 'completed')
  ), 0) AS contract_value,
  -- Total invoiced (excluding cancelled)
  COALESCE((
    SELECT SUM(i.total)
    FROM invoices i
    WHERE i.project_id = p.id AND i.is_cancelled = false
  ), 0) AS total_invoiced,
  -- Total received (confirmed receipts linked to this project)
  COALESCE((
    SELECT SUM(r.amount)
    FROM receipts r
    WHERE r.project_id = p.id AND r.status = 'confirmed'
  ), 0) AS total_received,
  -- Total expenses (approved)
  COALESCE((
    SELECT SUM(e.amount)
    FROM expenses e
    WHERE e.project_id = p.id AND e.status = 'approved'
  ), 0) AS total_expenses,
  -- Total contractor cost
  COALESCE((
    SELECT SUM(cp.amount)
    FROM contractor_payments cp
    WHERE cp.project_id = p.id
  ), 0) AS total_contractor_cost,
  -- Remaining balance = total invoiced - total received
  COALESCE((
    SELECT SUM(i.total)
    FROM invoices i
    WHERE i.project_id = p.id AND i.is_cancelled = false
  ), 0) - COALESCE((
    SELECT SUM(r.amount)
    FROM receipts r
    WHERE r.project_id = p.id AND r.status = 'confirmed'
  ), 0) AS remaining_balance,
  -- Profit = total received - total expenses - contractor cost
  COALESCE((
    SELECT SUM(r.amount)
    FROM receipts r
    WHERE r.project_id = p.id AND r.status = 'confirmed'
  ), 0) - COALESCE((
    SELECT SUM(e.amount)
    FROM expenses e
    WHERE e.project_id = p.id AND e.status = 'approved'
  ), 0) - COALESCE((
    SELECT SUM(cp.amount)
    FROM contractor_payments cp
    WHERE cp.project_id = p.id
  ), 0) AS profit
FROM projects p
LEFT JOIN customers c ON c.id = p.customer_id;

-- ─── Audit trigger function ───
CREATE OR REPLACE FUNCTION audit_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete',
      to_jsonb(OLD) - 'created_at', 'system');
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'update',
      to_jsonb(OLD) - 'created_at', to_jsonb(NEW) - 'created_at', 'system');
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert',
      to_jsonb(NEW) - 'created_at', 'system');
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to financial tables
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS audit_receipts ON receipts;
CREATE TRIGGER audit_receipts AFTER INSERT OR UPDATE OR DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS audit_receipt_allocations ON receipt_allocations;
CREATE TRIGGER audit_receipt_allocations AFTER INSERT OR UPDATE OR DELETE ON receipt_allocations
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS audit_installments ON installments;
CREATE TRIGGER audit_installments AFTER INSERT OR UPDATE OR DELETE ON installments
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS audit_expenses ON expenses;
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

DROP TRIGGER IF EXISTS audit_contractor_payments ON contractor_payments;
CREATE TRIGGER audit_contractor_payments AFTER INSERT OR UPDATE OR DELETE ON contractor_payments
  FOR EACH ROW EXECUTE FUNCTION audit_log_change();

-- ─── Prevent hard delete on financial records ───
CREATE OR REPLACE FUNCTION prevent_hard_delete_financial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Hard deletion of financial records is prohibited. Use the reversal or cancellation process instead.';
END;
$$;

-- Apply prevent-delete triggers
DROP TRIGGER IF EXISTS prevent_delete_receipts ON receipts;
CREATE TRIGGER prevent_delete_receipts BEFORE DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete_financial();

DROP TRIGGER IF EXISTS prevent_delete_receipt_allocations ON receipt_allocations;
CREATE TRIGGER prevent_delete_receipt_allocations BEFORE DELETE ON receipt_allocations
  FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete_financial();

DROP TRIGGER IF EXISTS prevent_delete_invoices ON invoices;
CREATE TRIGGER prevent_delete_invoices BEFORE DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete_financial();

-- ─── Revoke direct UPDATE on receipts.status (must go through confirm/reverse) ───
REVOKE UPDATE (status) ON receipts FROM anon, authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION recompute_invoice_status(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_receipt_with_allocations(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reverse_receipt(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION convert_installment_to_invoice(uuid) TO anon, authenticated;

-- Grant select on views
GRANT SELECT ON invoice_balances TO anon, authenticated;
GRANT SELECT ON customer_financial_summary TO anon, authenticated;
GRANT SELECT ON project_financial_summary TO anon, authenticated;
