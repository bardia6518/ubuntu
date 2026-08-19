import { supabase } from '@/lib/supabase';
import type {
  ConfirmReceiptResult,
  ReverseReceiptResult,
  ProjectCloseReadiness,
  ProjectCloseResult,
  IntegrityCheckResult,
  ReportProjectProfit,
  ReportCustomerReceivables,
  ReportOverdueInvoice,
  ReportContractorDebt,
  ReportIncomeByService,
  ReportExpenseByCategory,
  ReportBankTreasury,
  ReportCashflowEntry,
  Attachment,
  AttachmentEntityType,
} from '@/types';

// ─── Receipt Workflow: Confirm with Allocations (Atomic) ───
export async function confirmReceiptWithAllocations(
  receiptId: string,
  allocations: { invoice_id: string; amount: number }[]
): Promise<ConfirmReceiptResult> {
  const { data, error } = await supabase.rpc('confirm_receipt_with_allocations', {
    p_receipt_id: receiptId,
    p_allocations: allocations,
  });

  if (error) throw error;
  return data as ConfirmReceiptResult;
}

// ─── Receipt Workflow: Reverse a Confirmed Receipt ───
export async function reverseReceipt(
  receiptId: string,
  reason: string
): Promise<ReverseReceiptResult> {
  const { data, error } = await supabase.rpc('reverse_receipt', {
    p_receipt_id: receiptId,
    p_reason: reason,
  });

  if (error) throw error;
  return data as ReverseReceiptResult;
}

// ─── Installment Workflow: Convert to Invoice ───
export async function convertInstallmentToInvoice(
  installmentId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('convert_installment_to_invoice', {
    p_installment_id: installmentId,
  });

  if (error) throw error;
  return data as string;
}

// ─── Project Close: Check Readiness ───
export async function checkProjectCloseReadiness(
  projectId: string
): Promise<ProjectCloseReadiness> {
  const { data, error } = await supabase.rpc('check_project_close_readiness', {
    p_project_id: projectId,
  });

  if (error) throw error;
  return data as ProjectCloseReadiness;
}

// ─── Project Close: Execute ───
export async function closeProject(
  projectId: string,
  overrideReason?: string,
  closedBy?: string
): Promise<ProjectCloseResult> {
  const { data, error } = await supabase.rpc('close_project', {
    p_project_id: projectId,
    p_override_reason: overrideReason ?? null,
    p_closed_by: closedBy ?? 'system',
  });

  if (error) throw error;
  return data as ProjectCloseResult;
}

// ─── Integrity Check ───
export async function runIntegrityCheck(): Promise<IntegrityCheckResult> {
  const { data, error } = await supabase.rpc('run_integrity_check');

  if (error) throw error;
  return data as IntegrityCheckResult;
}

// ─── Reports ───
export async function fetchProjectProfitReport(): Promise<ReportProjectProfit[]> {
  const { data, error } = await supabase.from('report_project_profit').select('*');
  if (error) throw error;
  return data as ReportProjectProfit[];
}

export async function fetchCustomerReceivablesReport(): Promise<ReportCustomerReceivables[]> {
  const { data, error } = await supabase.from('report_customer_receivables').select('*');
  if (error) throw error;
  return data as ReportCustomerReceivables[];
}

export async function fetchOverdueInvoicesReport(): Promise<ReportOverdueInvoice[]> {
  const { data, error } = await supabase.from('report_overdue_invoices').select('*');
  if (error) throw error;
  return data as ReportOverdueInvoice[];
}

export async function fetchContractorDebtReport(): Promise<ReportContractorDebt[]> {
  const { data, error } = await supabase.from('report_contractor_debt').select('*');
  if (error) throw error;
  return data as ReportContractorDebt[];
}

export async function fetchIncomeByServiceReport(): Promise<ReportIncomeByService[]> {
  const { data, error } = await supabase.from('report_income_by_service').select('*');
  if (error) throw error;
  return data as ReportIncomeByService[];
}

export async function fetchExpenseByCategoryReport(): Promise<ReportExpenseByCategory[]> {
  const { data, error } = await supabase.from('report_expense_by_category').select('*');
  if (error) throw error;
  return data as ReportExpenseByCategory[];
}

export async function fetchBankTreasuryReport(): Promise<ReportBankTreasury[]> {
  const { data, error } = await supabase.from('report_bank_treasury').select('*');
  if (error) throw error;
  return data as ReportBankTreasury[];
}

export async function fetchCashflowReport(): Promise<ReportCashflowEntry[]> {
  const { data, error } = await supabase.from('report_cashflow').select('*');
  if (error) throw error;
  return data as ReportCashflowEntry[];
}

// ─── Attachments ───
export async function fetchAttachments(
  entityType: AttachmentEntityType,
  entityId: string
): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Attachment[];
}

export async function createAttachment(
  attachment: Omit<Attachment, 'id' | 'created_at'>
): Promise<Attachment> {
  const { data, error } = await supabase
    .from('attachments')
    .insert(attachment)
    .select()
    .single();

  if (error) throw error;
  return data as Attachment;
}

export async function deleteAttachment(id: string): Promise<void> {
  const { error } = await supabase.from('attachments').delete().eq('id', id);
  if (error) throw error;
}

// ─── Customer Duplicate Check ───
export async function checkCustomerDuplicate(
  field: 'national_id' | 'phone' | 'email',
  value: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from('customers').select('id', { count: 'exact', head: true });

  if (field === 'email') {
    query = query.ilike('email', value);
  } else {
    query = query.eq(field, value);
  }

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}
