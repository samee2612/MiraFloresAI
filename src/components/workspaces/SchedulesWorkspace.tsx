import React, { useState, useMemo } from 'react';
import { useWorkpaper } from '../../store/workpaperStore';
import { WORKPAPER_AREAS, INDEPENDENT_AUDIT_FINDINGS } from '../../engine/reconciliationEngine';
import { WorkpaperAreaId } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Sparkles,
  Search,
  Filter,
  CheckSquare,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const SchedulesWorkspace: React.FC<{ initialArea?: WorkpaperAreaId }> = ({ initialArea }) => {
  const {
    packet,
    openDocument,
    setInspectedLineKey,
    getEffectiveLineValue,
    verifications,
    bulkStampVerification,
    areaSignOffs,
    toggleAreaSignOff,
    applyFindingAdjustment,
    isFindingApplied,
    form8867Completed,
    setForm8867Completed,
  } = useWorkpaper();

  const [selectedArea, setSelectedArea] = useState<WorkpaperAreaId>(initialArea || 'business');
  const [lotSearch, setLotSearch] = useState('');
  const [lotBrokerFilter, setLotBrokerFilter] = useState<'all' | 'northlake' | 'meridian' | 'coinhaven' | 'brightpath' | 'flagged'>('flagged');

  if (!packet) return null;

  const v3 = packet.return_versions[2];
  const currentSignOff = areaSignOffs[selectedArea];
  const areaFindings = INDEPENDENT_AUDIT_FINDINGS.filter((f) => f.areaId === selectedArea);

  // Extract 8949 lots for the high-density lot explorer
  const all8949Lots = useMemo(() => {
    return v3.lines.filter((l) => l.form === 'F8949');
  }, [v3.lines]);

  const filtered8949Lots = useMemo(() => {
    return all8949Lots.filter((l) => {
      if (lotSearch && !l.label.toLowerCase().includes(lotSearch.toLowerCase()) && !l.key.toLowerCase().includes(lotSearch.toLowerCase())) {
        return false;
      }
      if (lotBrokerFilter === 'northlake') return l.key.includes('.N');
      if (lotBrokerFilter === 'meridian') return l.key.includes('.M');
      if (lotBrokerFilter === 'coinhaven') return l.key.includes('.C');
      if (lotBrokerFilter === 'brightpath') return l.key.includes('.X');
      if (lotBrokerFilter === 'flagged') {
        return (
          l.key.includes('.N1') ||
          l.key.includes('.N2') ||
          l.key.includes('.N3') ||
          l.key.includes('.N4') ||
          l.key.includes('.C6') ||
          l.key.includes('.M6') ||
          l.key.includes('.M9') ||
          l.key.includes('.M14') ||
          l.label.includes('disallowed')
        );
      }
      return true;
    });
  }, [all8949Lots, lotSearch, lotBrokerFilter]);

  const renderInteractiveLineRow = (lineKey: string, customNote?: string) => {
    const line = v3.lines.find((l) => l.key === lineKey);
    if (!line) return null;
    const eff = getEffectiveLineValue(lineKey);
    const ver = verifications[lineKey];
    const pyVal = packet.prior_years.return_2024.lines[lineKey];

    return (
      <tr
        key={lineKey}
        onClick={() => setInspectedLineKey(lineKey)}
        className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
      >
        <td className="py-2.5 px-3 font-mono text-xs font-bold text-emerald-400 group-hover:underline whitespace-nowrap">
          {line.key}
        </td>
        <td className="py-2.5 px-3 text-xs text-slate-200">
          <div>{line.label}</div>
          {(customNote || line.note) && (
            <div className="text-[11px] text-slate-400 mt-0.5">{customNote || line.note}</div>
          )}
        </td>
        <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-400">
          {pyVal !== undefined ? (typeof pyVal === 'number' ? `$${pyVal.toLocaleString()}` : pyVal) : '—'}
        </td>
        <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-300">
          {typeof eff.original === 'number' ? `$${eff.original.toLocaleString()}` : eff.original}
        </td>
        <td
          className={`py-2.5 px-3 text-right font-mono text-xs font-bold ${
            eff.hasAdjustment ? 'text-amber-400 bg-amber-500/10' : 'text-white'
          }`}
        >
          {typeof eff.adjusted === 'number' ? `$${eff.adjusted.toLocaleString()}` : eff.adjusted}
        </td>
        <td className="py-2.5 px-3 text-center whitespace-nowrap">
          {ver ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
              <CheckCircle2 className="w-3 h-3" /> {ver.type.split('_')[0]}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-300">Click to trace</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Area Sub-Navigation */}
      <div className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 overflow-y-auto p-3 space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          CPA Workpaper Schedules (10)
        </div>
        {WORKPAPER_AREAS.map((area) => {
          const so = areaSignOffs[area.id];
          const findingsInArea = INDEPENDENT_AUDIT_FINDINGS.filter(
            (f) => f.areaId === area.id && !isFindingApplied(f.id)
          );
          const reopened =
            so?.preparerSignOff.reopenedReason ||
            so?.reviewerSignOff.reopenedReason ||
            so?.partnerSignOff.reopenedReason;

          return (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                selectedArea === area.id
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <span className="truncate">{area.shortLabel}</span>
              <div className="flex items-center gap-1 shrink-0">
                {reopened && (
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500 animate-ping"
                    title={reopened}
                  />
                )}
                {findingsInArea.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    {findingsInArea.length}
                  </span>
                )}
                {so?.reviewerSignOff.signed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Schedule Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Area Sign-Off & Governance Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{currentSignOff.areaLabel}</h2>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> {currentSignOff.actualHours}h /{' '}
                {currentSignOff.budgetHours}h budget
              </span>
            </div>

            {/* Auto-Reopened Sign-Off Alert Banner */}
            {(currentSignOff.preparerSignOff.reopenedReason ||
              currentSignOff.reviewerSignOff.reopenedReason ||
              currentSignOff.partnerSignOff.reopenedReason) && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
                <RefreshCw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  <strong>Sign-Off Automatically Reopened:</strong>{' '}
                  {currentSignOff.reviewerSignOff.reopenedReason ||
                    currentSignOff.preparerSignOff.reopenedReason ||
                    currentSignOff.partnerSignOff.reopenedReason}
                </span>
              </div>
            )}
          </div>

          {/* 3-Tier Sign-Off Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                ['preparer', '1. Preparer', currentSignOff.preparerSignOff],
                ['reviewer', '2. Reviewer', currentSignOff.reviewerSignOff],
                ['partner', '3. Partner', currentSignOff.partnerSignOff],
              ] as const
            ).map(([lvl, label, obj]) => (
              <button
                key={lvl}
                onClick={() => toggleAreaSignOff(selectedArea, lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  obj.signed
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${obj.signed ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>{label}:</span>
                <strong className="text-white">{obj.signed ? obj.byName?.split(' ')[0] : 'Sign Off'}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Area Findings Banner if any */}
        {areaFindings.map((finding) => {
          const applied = isFindingApplied(finding.id);
          return (
            <div
              key={finding.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                applied
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-amber-950/30 border-amber-500/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${applied ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-xs font-mono font-bold text-amber-300">CHECK #{finding.number}</span>
                  <h4 className="text-sm font-bold text-white">{finding.title}</h4>
                </div>
                <p className="text-xs text-slate-300">{finding.summary}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openDocument(finding.primaryDocId, finding.primaryPage, finding.evidenceRefs)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-300 flex items-center gap-1"
                >
                  <FileSearch className="w-3.5 h-3.5" /> View {finding.primaryDocId} P.{finding.primaryPage}
                </button>
                {!applied ? (
                  <button
                    onClick={() => applyFindingAdjustment(finding)}
                    className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Apply Fix
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    ✓ Fix Applied
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* ================================================================= */}
        {/* AREA-SPECIFIC DEEP WORKPAPER VIEWS                                */}
        {/* ================================================================= */}

        {/* 1. SCHEDULE C BUSINESS BOOKS-TO-TAX BRIDGE */}
        {selectedArea === 'business' && (
          <div className="space-y-6">
            {/* Gross Receipts 3-Way Tie-Out Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-mono uppercase text-slate-400">
                  1. QuickBooks P&L Cash Revenue (D14)
                </span>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">$151,300.00</div>
                <p className="text-xs text-slate-400 mt-1">
                  Client Projects ($145,900) + Print & Licensing ($5,400).
                </p>
                <button
                  onClick={() => openDocument('D14', 1, ['ev-0086', 'ev-0087', 'ev-0103'])}
                  className="mt-2 text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1"
                >
                  Trace D14 P&L <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-mono uppercase text-slate-400">
                  2. Third-Party 1099-NEC + Non-1099 Tie-Out
                </span>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">$151,300.00</div>
                <p className="text-xs text-slate-400 mt-1">
                  Five 1099-NECs ($142,000, D16–D20) + 11 small clients without 1099 ($9,300, D15 p.3).
                </p>
                <button
                  onClick={() => openDocument('D15', 3, ['ev-0109', 'ev-0110', 'ev-0111'])}
                  className="mt-2 text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1"
                >
                  Trace D15 Deposit Detail <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-amber-950/25 border border-amber-500/40 rounded-xl p-4">
                <span className="text-[11px] font-mono uppercase text-amber-300">
                  3. Engine v3 Gross Receipts (Double-Count!)
                </span>
                <div className="text-xl font-mono font-bold text-amber-400 mt-1">$163,700.00 (+$12,400)</div>
                <p className="text-xs text-slate-300 mt-1">
                  Paywell 1099-K ($12,400, D21) was already inside Atlas Outdoor Gear’s $41,200 1099-NEC!
                </p>
                <button
                  onClick={() => openDocument('D21', 1, ['ev-0127'])}
                  className="mt-2 text-xs text-amber-300 hover:underline font-mono flex items-center gap-1"
                >
                  Trace D21 1099-K <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mileage Log 4-Page Audit Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Vehicle Mileage Log Reconciliation (D23 — 2021 Toyota RAV4 Hybrid)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Odometer 01/01/2025: 41,220 → 12/31/2025: 58,960 (17,740 total miles). Standard rate: $0.70/mile.
                  </p>
                </div>
                <button
                  onClick={() => openDocument('D23', 3, ['ev-0404'])}
                  className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono"
                >
                  Inspect Duplicate Page 3 Scan (D23) →
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Page 1 (Jan–Apr)</span>
                  <strong className="text-white text-sm">2,600 mi</strong>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Page 2 (May–Aug)</span>
                  <strong className="text-white text-sm">3,700 mi</strong>
                </div>
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/50">
                  <span className="text-rose-300 block">Page 3 (DUPLICATE OF P.2)</span>
                  <strong className="text-rose-400 text-sm line-through">3,700 mi</strong>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Page 4 (Sep–Dec)</span>
                  <strong className="text-white text-sm">1,800 mi</strong>
                </div>
              </div>
            </div>

            {/* Schedule C Line Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-white">
                Schedule C, SE & Form 8995 (QBI) Workpaper Lines
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description & Books-to-Tax Treatment</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'SchC.1',
                    'SchC.8',
                    'SchC.9',
                    'SchC.11',
                    'SchC.13',
                    'SchC.15',
                    'SchC.17',
                    'SchC.18',
                    'SchC.22',
                    'SchC.24a',
                    'SchC.24b',
                    'SchC.25',
                    'SchC.27a.1',
                    'SchC.27a.2',
                    'SchC.28',
                    'SchC.30',
                    'SchC.31',
                    'SchSE.12',
                    'SchSE.13',
                    'F8995.15',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. WAGES, STOCK COMP & AMT */}
        {selectedArea === 'wages_and_stock_compensation' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">
                Equity Compensation & Basis Reconciliation (Corvane Systems D08, D11, D12, D13, D28)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">RSU Vesting (W-2 Box 14 / D11)</span>
                  <strong className="text-base font-mono text-white">$38,200 (2025) + $9,420 (2023)</strong>
                  <p className="text-slate-400 mt-1">
                    Lots N1 (400sh), N3 (400sh), N4 (300sh) sold on D28 with $0 reported basis. D11 provides $47,620
                    adjusted basis.
                  </p>
                </div>
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">ESPP Disqualifying Disposition (D11/D13)</span>
                  <strong className="text-base font-mono text-white">150 sh • $675 W-2 Ord. Income</strong>
                  <p className="text-slate-400 mt-1">
                    Lot N2 purchased 06/28/2024 at $25.50 ($3,825), sold 03/10/2025 for $6,600. Adjusted basis $4,500
                    (matched by engine).
                  </p>
                </div>
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">ISO Exercise & AMT Spread (Form 3921 D12)</span>
                  <strong className="text-base font-mono text-amber-400">1,000 sh × ($52 - $12) = $40,000</strong>
                  <p className="text-slate-400 mt-1">
                    Exercised 07/30/2025 (after move to TX) and held through year-end. Triggers $3,871 Federal AMT
                    (Form 6251) & 2026 MTC carryforward.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'F1040.1a',
                    'F1040.1z',
                    'F8949.B.N1',
                    'F8949.A.N2',
                    'F8949.B.N3',
                    'F8949.E.N4',
                    'F6251.2i',
                    'F6251.7',
                    'F6251.11',
                    'F8959.18',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. INVESTMENTS, 302-LOT FORM 8949 EXPLORER & CRYPTO */}
        {selectedArea === 'investments_and_digital_assets' && (
          <div className="space-y-6">
            {/* Schedule B & D Summary Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-white">
                Schedule B (Interest & Dividends), Schedule D & NIIT (Form 8960)
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'SchB.1.1',
                    'SchB.1.2',
                    'SchB.1.3',
                    'SchB.1.4',
                    'SchB.1.5',
                    'SchB.1.6',
                    'SchB.4',
                    'SchB.5.1',
                    'SchB.5.2',
                    'SchB.6',
                    'SchD.1b',
                    'SchD.7',
                    'SchD.8b',
                    'SchD.15',
                    'SchD.16',
                    'F8960.17',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>

            {/* High-Density Form 8949 Lot Explorer (Handles 302+ lots without swamping review) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Form 8949 High-Density Lot Explorer (302 Extracted Lots + Omitted Meridian Page 32 Lot M18)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Smart exception filtering surfaces RSU $0-basis lots, crypto transfer-in lots, corrected Meridian
                    lots, and wash sales without drowning the reviewer in 260 routine Brightpath direct-indexing trades.
                  </p>
                </div>

                <button
                  onClick={() =>
                    bulkStampVerification(
                      filtered8949Lots.map((l) => l.key),
                      'agreed_to_source',
                      `Bulk verified ${filtered8949Lots.length} lots against 1099-B statements.`
                    )
                  }
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Bulk Verify Shown Lots ({filtered8949Lots.length})
                </button>
              </div>

              {/* Filter Bar */}
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      ['flagged', '⚠️ Exceptions & Wash Sales (28)'],
                      ['northlake', 'Northlake RSU/ESPP (5)'],
                      ['meridian', 'Meridian Corrected D31 (17 + M18)'],
                      ['coinhaven', 'Coinhaven Crypto 1099-DA (12)'],
                      ['brightpath', 'Brightpath Direct-Indexing (260)'],
                      ['all', 'All Lots (302)'],
                    ] as const
                  ).map(([fKey, label]) => (
                    <button
                      key={fKey}
                      onClick={() => setLotBrokerFilter(fKey)}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        lotBrokerFilter === fKey
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={lotSearch}
                    onChange={(e) => setLotSearch(e.target.value)}
                    placeholder="Filter ticker, date, or lot ID..."
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Lot Key</th>
                      <th className="py-2 px-3">Security / Digital Asset & Terms</th>
                      <th className="py-2 px-3 text-right">Engine Gain/(Loss)</th>
                      <th className="py-2 px-3 text-right">Working Gain/(Loss)</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(lotBrokerFilter === 'flagged' || lotBrokerFilter === 'meridian' || lotBrokerFilter === 'all') && (
                      <tr
                        onClick={() => openDocument('D31', 2, [])}
                        className="hover:bg-rose-950/40 cursor-pointer text-xs bg-rose-950/20"
                      >
                        <td className="py-2 px-3 font-mono font-bold text-rose-400 whitespace-nowrap">
                          F8949.D.M18 (OMITTED)
                        </td>
                        <td className="py-2 px-3 text-slate-200">
                          Ironwood REIT (5 sh, acq 10/14/2021, sold 12/29/2025; proceeds $250.00, basis $310.00 — D31 Page 32 unread by OCR)
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">$0 (Omitted)</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">
                          {isFindingApplied('finding-14') ? '-$60' : '$0'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] font-mono text-rose-300 font-bold">
                            {isFindingApplied('finding-14') ? '✓ Added (-$60)' : 'Unread P.32 (D31)'}
                          </span>
                        </td>
                      </tr>
                    )}
                    {filtered8949Lots.map((lot) => {
                      const eff = getEffectiveLineValue(lot.key);
                      const ver = verifications[lot.key];
                      const isFlagged =
                        lot.key.includes('.N1') ||
                        lot.key.includes('.N3') ||
                        lot.key.includes('.N4') ||
                        lot.key.includes('.C6');

                      return (
                        <tr
                          key={lot.key}
                          onClick={() => setInspectedLineKey(lot.key)}
                          className={`hover:bg-slate-800/60 cursor-pointer text-xs ${
                            isFlagged ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {lot.key}
                          </td>
                          <td className="py-2 px-3 text-slate-200">{lot.label}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-300">
                            ${Number(eff.original).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            ${Number(eff.adjusted).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {ver ? (
                              <span className="text-[10px] font-mono text-emerald-400">✓ Verified</span>
                            ) : isFlagged ? (
                              <span className="text-[10px] font-mono text-amber-400 font-bold">Needs Basis Fix</span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500">Trace</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. RENTALS, CONDO SALE, PASSIVE LOSSES & DEPRECIATION BY ASSET */}
        {selectedArea === 'rentals_and_sale' && (
          <div className="space-y-6">
            {/* Depreciation Schedule by Asset (Method, Life, Bonus, Fed vs CA vs AMT, Disposals & Recapture) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    2025 Per-Asset Depreciation & Disposition Schedule (Federal vs. California vs. AMT)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Includes studio equipment (100% Fed bonus vs CA 5-yr MACRS) and Austin Condo 10/15/2025 sale &
                    Section 1250 unrecaptured depreciation ($50,339).
                  </p>
                </div>
                <button
                  onClick={() => openDocument('D51', 1, ['ev-1014', 'ev-1015'])}
                  className="text-xs font-mono text-emerald-400 hover:underline"
                >
                  View Austin Condo Closing Statement (D51) →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                      <th className="py-2 px-3">Asset ID</th>
                      <th className="py-2 px-3">Description & Activity</th>
                      <th className="py-2 px-3">Placed / Method / Life</th>
                      <th className="py-2 px-3 text-right">Cost (Excl. Land)</th>
                      <th className="py-2 px-3 text-right">2025 Fed Depr.</th>
                      <th className="py-2 px-3 text-right">2025 CA Depr.</th>
                      <th className="py-2 px-3 text-right">AMT Diff</th>
                      <th className="py-2 px-3">Disposition / Recapture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {v3.assets.map((asset) => (
                      <tr key={asset.asset_id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{asset.asset_id}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-white">{asset.description}</div>
                          <div className="text-[10px] text-slate-400">{asset.activity}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                          {asset.placed_in_service} • {asset.method} ({asset.life_years}y)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                          ${asset.cost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          ${asset.federal.depreciation_2025.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                          ${asset.california.depreciation_2025.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          ${asset.amt.difference_from_regular.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {asset.disposed ? (
                            <span className="text-amber-300 font-mono">
                              Sold {asset.disposed.date} • Sec 1250 Recapture: $
                              {asset.disposed.depreciation_recapture_1250?.toLocaleString()} • Sec 1231 Gain: $
                              {asset.disposed.section_1231_gain?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-500">In Service</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule E, Form 4797 & Form 8582 Lines */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-white">
                Schedule E (1450 Fremont Way & 1200 Barton Hills 4C), Form 4797 Sale & Form 8582 Passive Loss Release
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'SchE.3A',
                    'SchE.14A',
                    'SchE.18A',
                    'SchE.21A',
                    'SchE.3B',
                    'SchE.18B',
                    'SchE.21B',
                    'F4797.20',
                    'F4797.24',
                    'F4797.26g',
                    'F4797.32',
                    'F8582.1a',
                    'F8582.1b',
                    'F8582.1c',
                    'F8582.3a',
                    'F8582.4',
                    'SchE.22A',
                    'SchE.22B',
                    'SchE.26',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PASS-THROUGHS & MULTI-YEAR S-CORP BASIS (FORM 7203) */}
        {selectedArea === 'pass_throughs_and_basis' && (
          <div className="space-y-6">
            {/* Multi-Year S-Corp Stock Basis Rollforward Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Lindqvist Family Woodworks, Inc. (Form 1120-S, 20% Shareholder) — Multi-Year Basis Reconstruction
                  </h3>
                  <p className="text-xs text-slate-400">
                    Resolved prior preparer’s 2023 gap (D07) by obtaining 2023 K-1 (D40). Triggers $21,215 capital gain
                    for distributions in excess of stock basis on Form 7203.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDocument('D40', 1, ['ev-0983', 'ev-0985'])}
                    className="px-2.5 py-1 rounded bg-slate-800 text-xs font-mono text-emerald-400"
                  >
                    2023 K-1 (D40)
                  </button>
                  <button
                    onClick={() => openDocument('D39', 1, ['ev-0975', 'ev-0977'])}
                    className="px-2.5 py-1 rounded bg-slate-800 text-xs font-mono text-emerald-400"
                  >
                    2025 K-1 (D39)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">2022 Ending Basis (D07)</span>
                  <strong className="text-lg text-white">$21,300</strong>
                  <span className="block text-[10px] text-slate-500 mt-1">Client historical basis worksheet</span>
                </div>
                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/40">
                  <span className="text-emerald-300 block">2023 Rollforward (D40 Found!)</span>
                  <strong className="text-lg text-emerald-400">$15,400</strong>
                  <span className="block text-[10px] text-slate-300 mt-1">
                    +$14,100 Box 1 Inc − $20,000 Box 16D Dist
                  </span>
                </div>
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">2024 Rollforward (D06)</span>
                  <strong className="text-lg text-white">$2,300</strong>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    +$16,900 Box 1 Inc − $30,000 Box 16D Dist
                  </span>
                </div>
                <div className="p-3 rounded bg-amber-950/30 border border-amber-500/40">
                  <span className="text-amber-300 block">2025 Form 7203 Result (D39)</span>
                  <strong className="text-lg text-amber-400">$0 End • $21,215 Gain</strong>
                  <span className="block text-[10px] text-slate-300 mt-1">
                    $2,300 + $18,485 Inc = $20,785 vs $42,000 Dist
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'SchE.28A',
                    'SchE.28B',
                    'SchE.32',
                    'F7203.1',
                    'F7203.3a',
                    'F7203.3c',
                    'F7203.4',
                    'F7203.5',
                    'F7203.6',
                    'F7203.15',
                    'F7203.excess',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. RETIREMENT (8606 / SEP), HSA (8889) & FOREIGN (8938 / FBAR) */}
        {selectedArea === 'retirement_and_foreign' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-white">Backdoor Roth IRA (Form 8606)</h4>
                <p className="text-slate-400 mt-1">
                  2024 nondeductible basis ($7,000 on D06/D42) + 2025 contribution ($7,000 on D43) = $14,000 basis.
                  Converted $14,026 to Roth (D41) → <strong>$26 taxable</strong>.
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-white">SEP-IRA Cap & Excess Carryover (D26)</h4>
                <p className="text-slate-400 mt-1">
                  Erik deposited $18,000 on 04/10/2026. Capped at 20% of net SE income ($15,214 deductible on Sch1.16;{' '}
                  <strong>$2,786 carryover</strong> to 2026 unless MACRS elected on studio equipment).
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-white">Swedish Account (D36) — Form 8938 & FBAR</h4>
                <p className="text-slate-400 mt-1">
                  Sparbanken Norrland max balance SEK 1,452,300 ($149,567 USD) & year-end SEK 1,196,800 ($123,254 USD).
                  Form 8938 included in return; FinCEN Form 114 (FBAR) tracked as outside filing due Oct 15.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'F8606.1',
                    'F8606.2',
                    'F8606.3',
                    'F8606.8',
                    'F8606.18',
                    'Sch1.16',
                    'Sch1.17',
                    'F8889.9',
                    'F8889.14a',
                    'F8889.15',
                    'F8938.1.max',
                    'F8938.1.ye',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. ITEMIZED DEDUCTIONS & CREDITS */}
        {selectedArea === 'deductions_and_credits' && (
          <div className="space-y-6">
            {/* Form 8867 Paid Preparer Due Diligence Interactive Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Form 8867 Paid Preparer’s Due Diligence Checklist
                  (CTC / ODC / AOTC)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo ($2,000 Child Tax Credit) and Ada ($500 Other Dependent Credit; AOTC on D59/D60 phased out at
                  $445k AGI).
                </p>
              </div>
              <button
                onClick={() => setForm8867Completed(!form8867Completed)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  form8867Completed
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-amber-500 text-slate-950 border-amber-400'
                }`}
              >
                {form8867Completed ? '✓ Form 8867 Completed & Verified' : 'Complete Form 8867'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'SchA.5a',
                    'SchA.5b',
                    'SchA.5d',
                    'SchA.5e',
                    'SchA.8a',
                    'SchA.8c',
                    'SchA.8e',
                    'SchA.11',
                    'F8283.A1.stock',
                    'F8283.A1.vehicle',
                    'SchA.12',
                    'SchA.14',
                    'SchA.17',
                    'F8812.14a',
                    'F8863.7',
                    'F2441.1a',
                    'F2441.1b',
                    'F2441.31',
                    'Sch3.1',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. CALIFORNIA 540NR PART-YEAR RESIDENCY SPLIT */}
        {selectedArea === 'california' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Residency Period Proration</span>
                <strong className="text-base font-mono text-white">195 CA Days / 170 TX Days (53.42%)</strong>
                <p className="text-slate-400 mt-1">
                  Moved Sacramento, CA → Austin, TX on 07/15/2025. Portfolio interest, dividends & Schedule C prorated
                  by days.
                </p>
              </div>
              <div className="p-3 rounded bg-amber-950/25 border border-amber-500/40">
                <span className="text-amber-300 block">Halvorsen W-2 Sourcing Fix (D73)</span>
                <strong className="text-base font-mono text-amber-400">$218,400 → $129,569 (-$88,831)</strong>
                <p className="text-slate-300 mt-1">
                  Corvane ($107,100 incl. CA HSA) + Halvorsen CA-period per 07/18 paystub D73 ($22,469) = $129,569.
                </p>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Physical Situs & Transaction Dates</span>
                <strong className="text-base font-mono text-emerald-400">1450 Fremont: 100% CA • Austin Condo: 0% CA</strong>
                <p className="text-slate-400 mt-1">
                  Austin condo Oct 15 sale ($112.5k gain) occurred while TX residents on TX real property → $0 CA
                  source!
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2 px-3">Line</th>
                    <th className="py-2 px-3">Schedule CA (540NR) & Form 540NR Line</th>
                    <th className="py-2 px-3 text-right">2024 Return</th>
                    <th className="py-2 px-3 text-right">2025 Engine v3</th>
                    <th className="py-2 px-3 text-right">2025 Working</th>
                    <th className="py-2 px-3 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    'SchCA540NR.1.A',
                    'SchCA540NR.1.C',
                    'SchCA540NR.1.D',
                    'SchCA540NR.1.E',
                    'SchCA540NR.2b.E',
                    'SchCA540NR.3b.E',
                    'SchCA540NR.7.E',
                    'SchCA540NR.12.E',
                    'SchCA540NR.17.E',
                    'F540NR.17',
                    'F540NR.32',
                    'F540NR.35',
                    'F540NR.40',
                    'ScheduleS.credit',
                    'F540NR.64',
                    'F540NR.71',
                    'F540NR.72',
                    'F540NR.97',
                  ].map((k) => renderInteractiveLineRow(k))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9 & 10. INTAKE / PAYMENTS & FILING */}
        {(selectedArea === 'intake_and_engagement' || selectedArea === 'payments_and_filing') && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-white">
              Form 1040 Summary, Tax Computation, Withholding, Estimated Payments & Form 2210 Penalty
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <th className="py-2 px-3">Line</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">2024 Return</th>
                  <th className="py-2 px-3 text-right">2025 Engine v3</th>
                  <th className="py-2 px-3 text-right">2025 Working</th>
                  <th className="py-2 px-3 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {[
                  'F1040.9',
                  'F1040.10',
                  'F1040.11',
                  'F1040.12',
                  'F1040.13',
                  'F1040.15',
                  'F1040.16',
                  'F1040.17',
                  'F1040.19',
                  'F1040.23',
                  'F1040.24',
                  'F1040.25a',
                  'F1040.26',
                  'F1040.31',
                  'F1040.33',
                  'F1040.37',
                  'F1040.38',
                ].map((k) => renderInteractiveLineRow(k))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
