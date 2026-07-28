'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, Vote } from 'lucide-react';

type Profile = Record<string, string | null | undefined>;

interface Proposal {
  id: string;
  changes: Profile;
  required_approvals: number;
  approval_count: number;
  resolution: string;
  created_at: string;
}

const FIELDS = [
  ['creditCode', '统一社会信用代码', 'Credit code'],
  ['countryCode', '国家代码', 'Country code'],
  ['countryName', '国家/地区', 'Country / region'],
  ['province', '省/州', 'Province / state'],
  ['city', '城市', 'City'],
  ['legalRepresentative', '法定代表人', 'Legal representative'],
  ['registeredCapital', '注册资金', 'Registered capital'],
  ['businessScope', '经营范围', 'Business scope'],
  ['registeredAddress', '注册地址', 'Registered address'],
  ['establishmentDate', '成立日期', 'Establishment date'],
  ['companyType', '企业类型', 'Company type'],
  ['website', '官方网站', 'Website'],
] as const;

export function CompanyGovernancePanel({
  companyId,
  profile,
  lang,
}: {
  companyId: string;
  profile: Profile;
  lang: 'zh' | 'en';
}) {
  const [field, setField] = useState<(typeof FIELDS)[number][0]>('legalRepresentative');
  const [value, setValue] = useState('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const isSupplement = useMemo(() => !profile[field]?.trim(), [field, profile]);

  const loadProposals = useCallback(async () => {
    const response = await fetch(`/api/companies/${companyId}/proposals`, {
      cache: 'no-store',
    });
    const result = await response.json();
    if (result.success) setProposals(result.data || []);
  }, [companyId]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  async function submitChange(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setBusy('submit');
    setMessage('');
    try {
      const endpoint = isSupplement
        ? `/api/companies/${companyId}/supplements`
        : `/api/companies/${companyId}/proposals`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ changes: { [field]: value.trim() } }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Request failed.');
      setValue('');
      setMessage(
        isSupplement
          ? lang === 'zh'
            ? '空白信息已作为新版本补充。刷新页面可查看。'
            : 'The missing value was appended as a new version.'
          : lang === 'zh'
            ? '修改提案已创建，达到采纳阈值后生效。'
            : 'Change proposal created and awaiting approvals.'
      );
      await loadProposals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setBusy(null);
    }
  }

  async function approve(proposalId: string) {
    setBusy(proposalId);
    setMessage('');
    try {
      const response = await fetch(`/api/company-proposals/${proposalId}/approvals`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Request failed.');
      setMessage(lang === 'zh' ? '已记录匿名采纳凭证。' : 'Anonymous approval recorded.');
      await loadProposals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border border-border bg-card p-5 space-y-5">
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
          <Vote className="w-4 h-4 text-emerald-500" />
          {lang === 'zh' ? '社区维护企业档案' : 'Community-maintained profile'}
        </h4>
        <p className="text-[11px] text-muted-foreground mt-1">
          {lang === 'zh'
            ? '空白字段可直接补充；修改已有字段会创建公开提案，达到采纳阈值后追加新版本。'
            : 'Missing fields can be supplemented immediately. Existing values require an approval proposal.'}
        </p>
      </div>

      <form onSubmit={submitChange} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2">
        <select
          value={field}
          onChange={(event) => setField(event.target.value as typeof field)}
          className="border border-border bg-background px-3 py-2 text-xs"
        >
          {FIELDS.map(([key, zh, en]) => (
            <option key={key} value={key}>
              {lang === 'zh' ? zh : en}
            </option>
          ))}
        </select>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={profile[field] || (lang === 'zh' ? '输入新信息' : 'Enter new value')}
          className="border border-border bg-background px-3 py-2 text-xs outline-none focus:border-emerald-500"
        />
        <button
          disabled={busy !== null || !value.trim()}
          className="bg-emerald-500 text-black px-4 py-2 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {busy === 'submit' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {isSupplement
            ? lang === 'zh'
              ? '补充'
              : 'Supplement'
            : lang === 'zh'
              ? '发起修改'
              : 'Propose'}
        </button>
      </form>

      {message && <p className="text-[11px] font-mono text-emerald-500">{message}</p>}

      {proposals.length > 0 && (
        <div className="space-y-2">
          {proposals.map((proposal) => {
            const pending = proposal.resolution === 'pending';
            return (
              <div key={proposal.id} className="border border-border bg-muted/20 p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-mono break-all">{JSON.stringify(proposal.changes)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {proposal.approval_count}/{proposal.required_approvals} · {proposal.resolution}
                  </p>
                </div>
                {pending && (
                  <button
                    onClick={() => void approve(proposal.id)}
                    disabled={busy !== null}
                    className="border border-emerald-500 text-emerald-500 px-3 py-1.5 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {busy === proposal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {lang === 'zh' ? '匿名采纳' : 'Approve'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
