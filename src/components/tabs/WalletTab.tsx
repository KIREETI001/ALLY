'use client';

// Family Care Wallet — the OTLRS payments demo layer.
//
// Launch flow per the Day-2 decision brief: helper payroll (the recurring
// anchor — 12 employer-initiated transactions/yr) + receipt-snap expense
// splitting between siblings. Phase 2 (claim bundles) is LIVE and
// deterministic; Phase 3 (stored value) is a watermarked SIMULATION.
//
// PSA POSTURE (docs/compliance/PSA-READINESS.md): this screen generates
// payment INSTRUCTIONS and records outcomes. Money moves only in each
// person's own banking app (PayNow) or via a licensed partner remitter
// (referral). ALLY never holds funds.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Camera, Check, Copy, FileText, Landmark, Play, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { C } from '@/lib/theme';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase/client';
import { fileToUpload } from '@/lib/upload';
import { equalSplit, fmtSGD, payNowRef, periodLabel, nextPayday, hcgCoverage, CORRIDOR_LABEL } from '@/lib/wallet';
import { SAMPLE_RECEIPT } from '@/lib/demo-data';
import type { Expense, ExpenseSplit, HelperPayroll, PayrollRun, ParsedReceipt, ExpenseCategory } from '@/lib/types';

const CATEGORIES: ExpenseCategory[] = ['Clinic', 'Pharmacy', 'Equipment', 'Groceries', 'Transport', 'Helper', 'Other'];
const HCG_OPTIONS = [
  { label: 'HCG S$600/mo (PCHI ≤ 1,500)', cents: 60000 },
  { label: 'HCG S$400/mo (PCHI ≤ 3,600)', cents: 40000 },
  { label: 'HCG S$200/mo (PCHI ≤ 4,800)', cents: 20000 },
  { label: 'No HCG', cents: 0 },
];

const card: CSSProperties = { background: C.card, borderRadius: 14, padding: 16, marginBottom: 12 };
const inputStyle: CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`,
  fontSize: 13.5, color: C.text, background: 'white', outline: 'none', boxSizing: 'border-box',
};
const btnPri: CSSProperties = {
  background: `linear-gradient(135deg,${C.pri},${C.light})`, color: 'white', border: 'none',
  padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
};
const btnGhost: CSSProperties = {
  background: C.pale, color: C.pri, border: 'none', padding: '8px 12px', borderRadius: 10,
  fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
};

export default function WalletTab() {
  const supabase = createClient();
  const { user, currentCarePlan } = useApp();
  const planId = currentCarePlan?.id ?? null;
  const fileInput = useRef<HTMLInputElement>(null);

  const [payroll, setPayroll] = useState<HelperPayroll | null>(null);
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<Record<string, ExpenseSplit[]>>({});
  const [members, setMembers] = useState<{ label: string; userId: string | null }[]>([]);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [nameDraft, setNameDraft] = useState('');
  const [hcgCents, setHcgCents] = useState(60000);

  // receipt flow
  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // payroll setup form
  const [form, setForm] = useState({ name: '', salary: '650', payday: '28', corridor: 'PH' });

  // Phase 2: claim bundles (deterministic — see lib/claims.ts)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [destination, setDestination] = useState<'insurer' | 'medisave' | 'employer' | 'other'>('insurer');
  const [bundle, setBundle] = useState<{ id: string; bundle_text: string; status: string } | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);

  // Phase 3 preview: SIMULATION ONLY — no persistence, no real balance.
  // Stored-value wallets are a licensed activity (PSA e-money/account issuance);
  // this preview exists to demo the roadmap, clearly watermarked.
  const [simOpen, setSimOpen] = useState(false);
  const [simBalanceCents, setSimBalanceCents] = useState(120000);
  const [simAutopay, setSimAutopay] = useState(true);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const prepareBundle = async () => {
    if (selectedIds.length === 0 || claimBusy) return;
    setClaimBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseIds: selectedIds, destination }),
      });
      const d = await r.json();
      if (!r.ok || !d.bundle) {
        setError(d.error || 'Could not prepare the claim bundle.');
        return;
      }
      setBundle(d.bundle);
    } catch {
      setError('Connection issue — try again.');
    } finally {
      setClaimBusy(false);
    }
  };

  const markBundleSubmitted = async () => {
    if (!bundle) return;
    const { data } = await supabase
      .from('claim_bundles')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', bundle.id)
      .select('id, status')
      .single();
    if (data) setBundle({ ...bundle, status: 'submitted' });
  };

  const load = useCallback(async () => {
    if (!planId) return;
    const [{ data: hp }, { data: exp }, { data: team }] = await Promise.all([
      supabase.from('helper_payroll').select('*').eq('care_plan_id', planId).maybeSingle(),
      supabase.from('expenses').select('*').eq('care_plan_id', planId).order('created_at', { ascending: false }).limit(15),
      supabase.from('care_team').select('user_id, display_initials').eq('care_plan_id', planId),
    ]);
    setPayroll((hp as HelperPayroll) ?? null);
    setExpenses((exp as Expense[]) ?? []);
    setMembers((team ?? []).map((m) => ({ label: m.display_initials as string, userId: m.user_id as string })));
    if (hp) {
      const period = periodLabel(new Date());
      const { data: runs } = await supabase
        .from('payroll_runs').select('*').eq('payroll_id', (hp as HelperPayroll).id)
        .eq('period_label', period).limit(1);
      setRun((runs?.[0] as PayrollRun) ?? null);
    }
    if (exp && exp.length > 0) {
      const ids = (exp as Expense[]).map((e) => e.id);
      const { data: sp } = await supabase.from('expense_splits').select('*').in('expense_id', ids);
      const byExp: Record<string, ExpenseSplit[]> = {};
      for (const s of (sp as ExpenseSplit[]) ?? []) {
        (byExp[s.expense_id] = byExp[s.expense_id] ?? []).push(s);
      }
      setSplits(byExp);
    }
  }, [supabase, planId]);

  useEffect(() => { load(); }, [load]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 1500); } catch { /* noop */ }
  };

  // ── Payroll actions ────────────────────────────────────────────────────────
  const setupPayroll = async () => {
    if (!planId || !user || !form.name.trim()) return;
    setError(null);
    const salaryCents = Math.round(parseFloat(form.salary || '0') * 100);
    if (!salaryCents || salaryCents <= 0) { setError('Enter a valid salary.'); return; }
    const { data, error: err } = await supabase.from('helper_payroll').insert({
      care_plan_id: planId, created_by: user.id, helper_name: form.name.trim(),
      salary_cents: salaryCents, payday_dom: Math.min(28, Math.max(1, parseInt(form.payday) || 28)),
      remit_corridor: form.corridor, remit_share_cents: Math.round(salaryCents * 0.6),
    }).select('*').single();
    if (err || !data) { setError(err?.message || 'Could not save.'); return; }
    setPayroll(data as HelperPayroll);
  };

  const ensureRun = async (hp: HelperPayroll): Promise<PayrollRun | null> => {
    const period = periodLabel(new Date());
    const { data } = await supabase.from('payroll_runs').upsert({
      payroll_id: hp.id, period_label: period, amount_cents: hp.salary_cents,
      idempotency_key: `${hp.id}:${period}`,
    }, { onConflict: 'idempotency_key', ignoreDuplicates: false }).select('*').single();
    return (data as PayrollRun) ?? null;
  };

  const initiateSalary = async () => {
    if (!payroll) return;
    const r = run ?? (await ensureRun(payroll));
    if (!r) return;
    const ref = r.paynow_ref ?? payNowRef('SAL', r.id);
    const { data } = await supabase.from('payroll_runs')
      .update({ status: 'initiated', paynow_ref: ref, initiated_at: new Date().toISOString() })
      .eq('id', r.id).select('*').single();
    if (data) setRun(data as PayrollRun);
  };

  const confirmSalary = async () => {
    if (!run) return;
    const { data } = await supabase.from('payroll_runs')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', run.id).select('*').single();
    if (data) setRun(data as PayrollRun);
  };

  // ── Receipt flow ──────────────────────────────────────────────────────────
  const scan = async (payload: { text?: string; fileBase64?: string; fileMediaType?: string }) => {
    setError(null);
    setScanning(true);
    setParsed(null);
    try {
      const r = await fetch('/api/parse-receipt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok || !d.parsed) { setError(d.error || 'Could not read the receipt.'); return; }
      setParsed(d.parsed as ParsedReceipt);
    } catch {
      setError('Connection issue — try again.');
    } finally {
      setScanning(false);
    }
  };

  const onPickFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const up = await fileToUpload(f);
      await scan({ fileBase64: up.base64, fileMediaType: up.mediaType });
    } catch {
      setError('Could not read that file.');
    }
  };

  const saveExpense = async () => {
    if (!parsed || !planId || !user) return;
    setSaving(true);
    setError(null);
    try {
      const { data: exp, error: e1 } = await supabase.from('expenses').insert({
        care_plan_id: planId, created_by: user.id, merchant: parsed.merchant,
        category: parsed.category, amount_cents: parsed.total_cents, currency: parsed.currency,
        source: 'receipt_snap', receipt_quote: parsed.source_quote,
      }).select('*').single();
      if (e1 || !exp) { setError(e1?.message || 'Could not save expense.'); return; }

      const splitMembers = [
        ...members,
        ...extraNames.map((n) => ({ label: n, userId: null as string | null })),
      ];
      const shares = equalSplit(parsed.total_cents, splitMembers.length > 0 ? splitMembers : [{ label: 'Me', userId: user.id }]);
      const rows = shares.map((s) => ({
        expense_id: (exp as Expense).id, member_label: s.member_label, member_user_id: s.member_user_id,
        share_cents: s.share_cents, paynow_ref: payNowRef('SPL', (exp as Expense).id),
      }));
      const { error: e2 } = await supabase.from('expense_splits').insert(rows);
      if (e2) { setError(e2.message); return; }
      setParsed(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const settleSplit = async (s: ExpenseSplit) => {
    const next = s.status === 'pending'
      ? { status: 'settled', settle_method: 'paynow', settled_at: new Date().toISOString() }
      : { status: 'pending', settle_method: null, settled_at: null };
    await supabase.from('expense_splits').update(next).eq('id', s.id);
    await load();
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const monthKey = periodLabel(new Date());
  const monthSpendCents = expenses
    .filter((e) => (e.expense_date ?? e.created_at).slice(0, 7) === monthKey)
    .reduce((acc, e) => acc + e.amount_cents, 0);
  const coverage = payroll ? hcgCoverage(payroll.salary_cents, hcgCents) : 0;

  if (!planId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 32 }}>
        <div style={{ textAlign: 'center', color: C.sub, fontSize: 14 }}>
          <Wallet size={28} color={C.pri} style={{ marginBottom: 10 }} />
          <div>Activate a care plan first — the wallet builds on it.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: C.bg }}>
      <div style={{ background: `linear-gradient(140deg,${C.dark},${C.pri})`, padding: '48px 20px 16px', color: 'white' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Family Care Wallet</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
          Split costs · pay your helper · one record for the whole family
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 28 }}>
        {error && <div style={{ background: C.errBg, color: C.err, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* PSA posture strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.pale, borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
          <ShieldCheck size={14} color={C.pri} />
          <div style={{ fontSize: 11, color: C.pri, lineHeight: 1.45 }}>
            ALLY never holds money. Payments happen in your own bank app via PayNow; remittance via licensed partners.
          </div>
        </div>

        {/* Month summary */}
        <div style={{ ...card, background: `linear-gradient(135deg, ${C.card}, ${C.pale})` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>This month</div>
            <div style={{ fontSize: 11, color: C.sub }}>{monthKey}</div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{fmtSGD(monthSpendCents)}</div>
              <div style={{ fontSize: 11, color: C.sub }}>care expenses</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{payroll ? fmtSGD(payroll.salary_cents) : '—'}</div>
              <div style={{ fontSize: 11, color: C.sub }}>helper salary</div>
            </div>
          </div>
          {payroll && (
            <div style={{ marginTop: 12 }}>
              <select value={hcgCents} onChange={(e) => setHcgCents(Number(e.target.value))} style={{ ...inputStyle, fontSize: 12.5, padding: '7px 10px' }}>
                {HCG_OPTIONS.map((o) => <option key={o.cents} value={o.cents}>{o.label}</option>)}
              </select>
              <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${coverage}%`, height: '100%', background: C.ok }} />
              </div>
              <div style={{ fontSize: 12, color: C.text, marginTop: 6 }}>
                <b style={{ color: C.ok }}>{coverage}%</b> of {payroll.helper_name}&apos;s salary covered by the Home Caregiving Grant
                <span style={{ color: C.sub }}> · verified Jun 2026, confirm with AIC</span>
              </div>
            </div>
          )}
        </div>

        {/* Helper payroll */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Landmark size={16} color={C.pri} />
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Helper salary</div>
            <div style={{ marginLeft: 'auto', fontSize: 10.5, color: C.sub }}>12 cycles/yr — the recurring anchor</div>
          </div>

          {!payroll ? (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input placeholder="Helper's name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, flex: 2 }} />
                <input placeholder="Salary S$" inputMode="decimal" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value.replace(/[^\d.]/g, '') })} style={{ ...inputStyle, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={form.payday} onChange={(e) => setForm({ ...form, payday: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Payday: {d}th</option>)}
                </select>
                <select value={form.corridor} onChange={(e) => setForm({ ...form, corridor: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                  {Object.entries(CORRIDOR_LABEL).map(([k, v]) => <option key={k} value={k}>Sends money to: {v}</option>)}
                </select>
              </div>
              <button type="button" onClick={setupPayroll} style={{ ...btnPri, width: '100%' }}>Set up helper payroll</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{payroll.helper_name}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>
                    {fmtSGD(payroll.salary_cents)} · next payday {nextPayday(payroll.payday_dom, new Date()).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {(!run || run.status === 'scheduled') && (
                  <button type="button" onClick={initiateSalary} style={btnPri}>Initiate via PayNow</button>
                )}
                {run?.status === 'initiated' && (
                  <button type="button" onClick={confirmSalary} style={{ ...btnPri, background: C.ok }}>Mark paid</button>
                )}
                {run?.status === 'confirmed' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.ok, fontWeight: 700, fontSize: 13 }}>
                    <Check size={15} /> Paid {monthKey}
                  </span>
                )}
              </div>

              {run?.status === 'initiated' && run.paynow_ref && (
                <div style={{ marginTop: 10, background: C.bg, borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>Pay in YOUR bank app via PayNow, with this reference:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ fontSize: 14, fontWeight: 800, color: C.pri }}>{run.paynow_ref}</code>
                    <button type="button" onClick={() => copy(run.paynow_ref!)} style={{ ...btnGhost, padding: '5px 9px', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      <Copy size={12} /> {copied === run.paynow_ref ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {payroll.remit_corridor !== 'NONE' && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                  {payroll.helper_name} sends ~{fmtSGD(payroll.remit_share_cents)} home to {CORRIDOR_LABEL[payroll.remit_corridor]} —
                  licensed partner remitters from ~0.6% all-in.{' '}
                  <span style={{ color: C.pri, fontWeight: 700 }}>Compare rates → (partner referral, Phase 2)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Receipt snap + expenses */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <FileText size={16} color={C.pri} />
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Shared expenses</div>
          </div>

          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={(e) => onPickFile(e.target.files?.[0] ?? undefined)} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={scanning} style={{ ...btnPri, flex: 1, display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center', opacity: scanning ? 0.6 : 1 }}>
              <Camera size={14} /> {scanning ? 'Reading…' : 'Snap a receipt'}
            </button>
            <button type="button" onClick={() => scan({ text: SAMPLE_RECEIPT })} disabled={scanning} style={{ ...btnGhost, display: 'inline-flex', gap: 5, alignItems: 'center' }}>
              <Play size={12} /> Demo receipt
            </button>
          </div>

          {/* Split members */}
          <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 6 }}>Splitting equally between:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {[...members.map((m) => m.label), ...extraNames].map((label, i) => (
              <span key={`${label}-${i}`} style={{ background: C.pale, color: C.pri, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{label}</span>
            ))}
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameDraft.trim()) {
                  setExtraNames((p) => [...p, nameDraft.trim()]);
                  setNameDraft('');
                }
              }}
              placeholder="+ add sibling"
              style={{ ...inputStyle, width: 110, padding: '4px 10px', fontSize: 12, borderRadius: 999 }}
            />
          </div>

          {/* Parsed receipt confirm */}
          {parsed && (
            <div style={{ background: C.bg, borderRadius: 12, padding: 12, marginBottom: 10, borderLeft: parsed.confidence === 'low' ? `3px solid ${C.warn}` : `3px solid ${C.ok}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{parsed.merchant}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.pri }}>{fmtSGD(parsed.total_cents)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <select
                  value={parsed.category}
                  onChange={(e) => setParsed({ ...parsed, category: e.target.value as ExpenseCategory })}
                  style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12.5 }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={saveExpense} disabled={saving} style={{ ...btnPri, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save & split'}
                </button>
              </div>
              {parsed.source_quote && (
                <div style={{ fontSize: 10.5, color: C.sub, fontStyle: 'italic', marginTop: 6 }}>“{parsed.source_quote}”{parsed.confidence === 'low' ? ' · check this — hard to read' : ''}</div>
              )}
            </div>
          )}

          {/* Expense list */}
          {expenses.length === 0 && !parsed && (
            <div style={{ fontSize: 12.5, color: C.sub, textAlign: 'center', padding: '8px 0' }}>No expenses yet — snap the first receipt.</div>
          )}
          {expenses.map((e) => (
            <div key={e.id} style={{ borderTop: `1px solid ${C.border}`, padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                {/* claim-bundle selector */}
                <div
                  onClick={() => toggleSelect(e.id)}
                  title="Select for claim bundle"
                  style={{
                    width: 18, height: 18, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
                    border: `2px solid ${selectedIds.includes(e.id) ? C.pri : C.border}`,
                    background: selectedIds.includes(e.id) ? C.pri : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {selectedIds.includes(e.id) && <Check size={11} color="white" />}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, flex: 1 }}>{e.merchant}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{fmtSGD(e.amount_cents)}</div>
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{e.category} · {(e.expense_date ?? e.created_at).slice(0, 10)}{e.source === 'receipt_snap' ? ' · 📷 snapped' : ''}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {(splits[e.id] ?? []).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => settleSplit(s)}
                    title={s.status === 'pending' ? `PayNow ref ${s.paynow_ref ?? ''} — tap when paid` : 'Tap to mark unpaid'}
                    style={{
                      border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 999,
                      background: s.status === 'settled' ? C.okBg : '#F1F5F9',
                      color: s.status === 'settled' ? '#065F46' : C.sub,
                    }}
                  >
                    {s.member_label} · {fmtSGD(s.share_cents)} {s.status === 'settled' ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Phase 2 — Claim bundle prep (LIVE; deterministic, no AI — lib/claims.ts) */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={15} color={C.pri} />
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>Claim bundle</div>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: C.pri, background: C.pale, padding: '3px 8px', borderRadius: 999 }}>PHASE 2 · LIVE</span>
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
            Tick expenses above, pick a destination, and get a submission-ready summary.
            Assembled from your records without AI — you submit it yourself; ALLY files nothing.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select
              value={destination}
              onChange={(ev) => setDestination(ev.target.value as typeof destination)}
              style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 12.5 }}
            >
              <option value="insurer">Insurer (e.g. CareShield supplement)</option>
              <option value="medisave">MediSave / institution</option>
              <option value="employer">Employer benefits</option>
              <option value="other">Other reimbursement</option>
            </select>
            <button
              type="button"
              onClick={prepareBundle}
              disabled={selectedIds.length === 0 || claimBusy}
              style={{ ...btnPri, opacity: selectedIds.length === 0 || claimBusy ? 0.5 : 1 }}
            >
              {claimBusy ? 'Preparing…' : `Prepare (${selectedIds.length})`}
            </button>
          </div>
          {bundle && (
            <div style={{ marginTop: 12, background: C.bg, borderRadius: 10, padding: 12 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 10.5, lineHeight: 1.5, color: C.text, fontFamily: 'ui-monospace, monospace', maxHeight: 220, overflowY: 'auto' }}>
                {bundle.bundle_text}
              </pre>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="button" onClick={() => copy(bundle.bundle_text)} style={{ ...btnGhost, display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                  <Copy size={12} /> {copied === bundle.bundle_text ? 'Copied' : 'Copy bundle'}
                </button>
                {bundle.status === 'draft' ? (
                  <button type="button" onClick={markBundleSubmitted} style={{ ...btnPri, background: C.ok }}>
                    Mark submitted
                  </button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.ok, fontWeight: 700, fontSize: 12.5 }}>
                    <Check size={14} /> Submitted
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phase 3 — stored-value wallet CONCEPT PREVIEW (simulation only).
            Real stored value = e-money/account issuance under the PSA, a
            licensed activity. Nothing here persists or moves money. */}
        <div style={{ ...card, border: `2px dashed ${C.pur}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={15} color={C.pur} />
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>Family Wallet</div>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 800, color: 'white', background: C.pur, padding: '3px 8px', borderRadius: 999 }}>
              PHASE 3 · SIMULATION
            </span>
          </div>
          {!simOpen ? (
            <>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
                Concept preview: siblings top up a shared balance; helper salary and care
                bills auto-pay from it. Launches only with a licensed partner or our own
                MAS Payment Institution licence.
              </div>
              <button type="button" onClick={() => setSimOpen(true)} style={{ ...btnGhost, marginTop: 10, background: C.purBg, color: C.pur }}>
                Open simulation →
              </button>
            </>
          ) : (
            <div style={{ marginTop: 10 }}>
              <div style={{ background: `linear-gradient(135deg, ${C.pur}, #9F67F0)`, borderRadius: 12, padding: 14, color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 8, right: -26, transform: 'rotate(35deg)', background: 'rgba(255,255,255,.25)', fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 30px' }}>
                  SIMULATION
                </div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>Shared family balance (not real money)</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 2 }}>{fmtSGD(simBalanceCents)}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>
                  {payroll
                    ? simAutopay
                      ? `Auto-pays ${payroll.helper_name} ${fmtSGD(payroll.salary_cents)} on the ${payroll.payday_dom}th — ${Math.floor(simBalanceCents / payroll.salary_cents)} payday${Math.floor(simBalanceCents / payroll.salary_cents) === 1 ? '' : 's'} covered`
                      : 'Auto-pay off'
                    : 'Set up helper payroll to preview auto-pay'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <button type="button" onClick={() => setSimBalanceCents((b) => b + 10000)} style={{ ...btnGhost, background: C.purBg, color: C.pur }}>
                  + S$100 top-up (sim)
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={simAutopay} onChange={(ev) => setSimAutopay(ev.target.checked)} />
                  Auto-pay salary
                </label>
                <button type="button" onClick={() => setSimOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.sub, fontSize: 12, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 8, lineHeight: 1.45 }}>
                Nothing here is stored or transacted. Stored-value wallets require a MAS
                Payment Institution licence (e-money + account issuance) or a licensed
                partner — see docs/compliance/PSA-READINESS.md.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
