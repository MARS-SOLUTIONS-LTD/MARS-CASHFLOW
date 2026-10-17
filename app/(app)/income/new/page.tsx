'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { parseMoney, formatMoney } from '@/lib/finance/money';
import { splitIncome, DEFAULT_ALLOCATION } from '@/lib/finance/allocation';
import { useAuth } from '@/lib/hooks/useAuth';
import { addIncome } from '@/lib/firebase/firestore';
import { todayISO } from '@/lib/utils/date';

export default function NewIncomePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? 'UGX';

  const [amountStr, setAmountStr] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(todayISO());
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const amount = useMemo(() => parseMoney(amountStr, currency), [amountStr, currency]);

  // TODO: fetch the user's active allocation plan by id (profile.activeAllocationId) and
  // use its config here. For now, fall back to DEFAULT_ALLOCATION so the UI remains functional.
  const allocation = useMemo(() => DEFAULT_ALLOCATION, [profile]);

  const breakdown = useMemo(() => {
    if (amount == null || amount <= 0) return null;
    try {
      return splitIncome(amount, allocation);
    } catch {
      return null;
    }
  }, [amount, allocation]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (amount == null || amount <= 0) return setError('Enter a valid amount.');
    if (!source.trim()) return setError('Income source is required.');
    if (!user) return setError('You must be signed in.');

    setSaving(true);
    try {
      await addIncome({
        userId: user.uid,
        amount,
        currency,
        source: source.trim(),
        date,
        description: desc.trim() || undefined,
        // including a snapshot so server-side/store code can persist the allocation used
        allocationSnapshot: allocation,
      } as any);

      setSaved(true);
      // navigate back to dashboard after successful save
      router.push('/home');
    } catch (err: any) {
      setError(err?.message ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (saved) return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Income recorded</h1>
      <p className="text-muted-foreground">
        Saved as a separate record for {date}. Your history is preserved.
      </p>
      <Link href="/home" className="text-primary underline">Back to dashboard</Link>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">Record income</h1>

      <label className="block">
        <span className="text-sm">Amount ({currency})</span>
        <input
          inputMode="decimal"
          placeholder="100,000"
          value={amountStr}
          onChange={e => setAmountStr(e.target.value)}
          aria-label={`Amount in ${currency}. Use numbers only.`}
          className="mt-1 w-full rounded-xl border px-3 py-3 text-lg tabular-nums"
        />
      </label>

      <label className="block">
        <span className="text-sm">Source</span>
        <input
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Salary, client payment, sale…"
          className="mt-1 w-full rounded-xl border px-3 py-3"
        />
      </label>

      <label className="block">
        <span className="text-sm">Date received</span>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
               className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>

      <label className="block">
        <span className="text-sm">Description (optional)</span>
        <textarea value={desc} onChange={e => setDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-3" rows={2} />
      </label>

      {breakdown && (
        <section className="rounded-2xl border bg-card p-4 space-y-2">
          <h2 className="font-medium">Suggested allocation</h2>
          <Row label="Investment (30%)" value={formatMoney(breakdown.investment, currency)} />
          <Row label="Personal (70%)"   value={formatMoney(breakdown.personalTotal, currency)} />
          <div className="pl-3 border-l space-y-1 text-sm">
            <Row label="Needs"        value={formatMoney(breakdown.personal.needs, currency)} />
            <Row label="Savings"      value={formatMoney(breakdown.personal.savings, currency)} />
            <Row label="Wants"        value={formatMoney(breakdown.personal.wants, currency)} />
            <Row label="Self-growth"  value={formatMoney(breakdown.personal.selfGrowth, currency)} />
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            This is a suggestion. You decide what to do with your money.
          </p>
        </section>
      )}

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium disabled:opacity-50">
        {saving ? 'Saving…' : 'Save income'}
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between tabular-nums"><span>{label}</span><span>{value}</span></div>;
}
