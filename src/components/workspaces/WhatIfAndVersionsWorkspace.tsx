import React, { useState } from 'react';
import { useWorkpaper } from '../../store/workpaperStore';
import {
  Sliders,
  GitCompare,
  Scale,
  CheckCircle2,
  Eye,
  Plus,
  CalendarClock,
  Sparkles,
} from 'lucide-react';

export const WhatIfAndVersionsWorkspace: React.FC = () => {
  const {
    packet,
    activeWhatIfIds,
    toggleWhatIf,
    seenLineChanges,
    markLineChangeSeen,
    markAllChangesSeen,
    setInspectedLineKey,
    judgments,
    addJudgment,
    liveSummary,
  } = useWorkpaper();

  const [diffVersion, setDiffVersion] = useState<'v2_vs_v1' | 'v3_vs_v2'>('v3_vs_v2');
  const [newJudgTitle, setNewJudgTitle] = useState('');
  const [newJudgAuth, setNewJudgAuth] = useState('');
  const [newJudgPos, setNewJudgPos] = useState('');

  if (!packet) return null;

  const v1 = packet.return_versions[0];
  const v2 = packet.return_versions[1];
  const v3 = packet.return_versions[2];

  const activeChangesList = diffVersion === 'v3_vs_v2' ? v3.changes_from_previous : v2.changes_from_previous;
  const unseenCount = v3.changes_from_previous.filter((c) => !seenLineChanges[c.key]).length;

  const handleAddJudgment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgTitle.trim() || !newJudgPos.trim()) return;
    addJudgment({
      areaId: 'business',
      title: newJudgTitle,
      authority: newJudgAuth || 'IRC § 162 / Treas. Reg.',
      optionsConsidered: 'Evaluated alternative treatments via What-If engine.',
      positionTaken: newJudgPos,
      confidenceLevel: 'substantial_authority',
      evidenceRefs: [],
    });
    setNewJudgTitle('');
    setNewJudgAuth('');
    setNewJudgPos('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* SECTION 1: Interactive What-If Tax Strategy Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Interactive What-If & Election Simulator (Engine Pre-Computed Alternatives)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle tax elections and judgment calls below to simulate instant Federal and California tax effects on
              the live return.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            Simulated Fed Tax: <strong className="text-emerald-400">${liveSummary.federal.total_tax.toLocaleString()}</strong>{' '}
            • CA Tax: <strong className="text-emerald-400">${liveSummary.california.total_tax.toLocaleString()}</strong>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {packet.what_if.alternatives.map((alt) => {
            const isSelected = activeWhatIfIds.includes(alt.id);
            const fedDiff = alt.federal.total_tax_change || 0;
            const caDiff = alt.california.total_tax_change || 0;
            const penDiff = alt.federal.penalty_change || 0;

            return (
              <div
                key={alt.id}
                onClick={() => toggleWhatIf(alt.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">{alt.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected ? '✓ Active in Live Return' : 'Click to Simulate'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{alt.description}</h3>
                  {alt.note && <p className="text-xs text-amber-300/90 mt-1">{alt.note}</p>}

                  {/* Changed Lines Preview */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {alt.changed_lines.slice(0, 5).map((cl) => (
                      <span
                        key={cl.key}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300"
                      >
                        {cl.key}: {cl.base} → <strong className="text-white">{cl.alternative}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Tax Impact vs. v3 Base:</span>
                  <div className="flex items-center gap-3 font-bold">
                    <span className={fedDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      Fed: {fedDiff >= 0 ? `+$${fedDiff.toLocaleString()}` : `-$${Math.abs(fedDiff).toLocaleString()}`}
                    </span>
                    <span className={caDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      CA: {caDiff >= 0 ? `+$${caDiff.toLocaleString()}` : `-$${Math.abs(caDiff).toLocaleString()}`}
                    </span>
                    {penDiff !== 0 && (
                      <span className="text-emerald-400">Penalty: -${Math.abs(penDiff).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* April 14 Extension Estimate Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-300 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> APRIL 14 EXTENSION ESTIMATE (FROM V2)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                  Filed 2026-04-14
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Form 4868 ($36,000 Paid) & California FTB 3519 ($0 Paid)
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {packet.what_if.extension.basis_for_buffer}
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>v2 Balance Due: $35,070 + $930 buffer</span>
              <strong className="text-emerald-400">Fed Paid: $36,000 • CA Overpaid: -$9,131</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Return Version Comparison (v1 -> v2 -> v3) & "What Changed Since I Last Looked" */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Version Comparison (v1 → v2 → v3) & “What Changed Since I Last Looked”
              </h3>
              {unseenCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                  {unseenCount} unseen changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track every line item added, modified, or removed across engine recomputations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiffVersion('v2_vs_v1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                diffVersion === 'v2_vs_v1'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              v2 vs v1 (Mar 19 Corrected 1099)
            </button>
            <button
              onClick={() => setDiffVersion('v3_vs_v2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                diffVersion === 'v3_vs_v2'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              v3 vs v2 (Jun 23 K-1s, SEP & Extension)
            </button>
            <button
              onClick={markAllChangesSeen}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Mark All Seen
            </button>
          </div>
        </div>

        {/* Version Summary Cards */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 bg-slate-950/40 text-xs">
          {[v1, v2, v3].map((ver) => (
            <div key={ver.version} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400 uppercase">{ver.version}</span>
                <span className="font-mono text-[11px] text-slate-400">{ver.computed_at.slice(0, 10)}</span>
              </div>
              <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{ver.trigger}</p>
              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between font-mono">
                <span>Fed Tax: ${ver.summary.federal.total_tax.toLocaleString()}</span>
                <span>CA Tax: ${ver.summary.california.total_tax.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Diff Table */}
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <tr>
                <th className="py-2 px-4">Line Key</th>
                <th className="py-2 px-4">Change Type</th>
                <th className="py-2 px-4 text-right">Previous Value</th>
                <th className="py-2 px-4 text-right">New Value</th>
                <th className="py-2 px-4 text-right">Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeChangesList.map((ch) => {
                const seen = seenLineChanges[ch.key];
                return (
                  <tr
                    key={ch.key}
                    onClick={() => {
                      markLineChangeSeen(ch.key);
                      setInspectedLineKey(ch.key);
                    }}
                    className={`hover:bg-slate-800/60 cursor-pointer ${!seen ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{ch.key}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          ch.change === 'added'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {ch.change}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                      {ch.old !== null && ch.old !== undefined
                        ? typeof ch.old === 'number'
                          ? `$${ch.old.toLocaleString()}`
                          : String(ch.old)
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                      {typeof ch.new === 'number' ? `$${ch.new.toLocaleString()}` : String(ch.new)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {!seen ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
                          NEW SINCE LAST LOOKED
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[10px]">✓ Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Judgment Calls, Elections & Due Diligence Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" /> Tax Judgment Calls, Statutory Elections & Penalty Positions
            </h3>
            <p className="text-xs text-slate-400">
              Permanent audit defense record of technical positions, statutory elections, and penalty safe harbors.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {judgments.map((j) => (
            <div key={j.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-white text-sm">{j.title}</h4>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[10px]">
                  {j.authority}
                </span>
              </div>
              <p className="text-slate-400">
                <strong>Options Considered:</strong> {j.optionsConsidered}
              </p>
              <p className="text-emerald-300">
                <strong>Position & Rationale:</strong> {j.positionTaken}
              </p>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                <span>
                  Documented by <strong className="text-slate-300">{j.documentedBy}</strong> on{' '}
                  {j.documentedAt.slice(0, 10)}
                </span>
                <span className="font-mono">Standard: {j.confidenceLevel.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Judgment Form */}
        <form onSubmit={handleAddJudgment} className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="text"
            value={newJudgTitle}
            onChange={(e) => setNewJudgTitle(e.target.value)}
            placeholder="Election or Judgment Title..."
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
          />
          <input
            type="text"
            value={newJudgAuth}
            onChange={(e) => setNewJudgAuth(e.target.value)}
            placeholder="IRC / Reg Citation..."
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
          />
          <input
            type="text"
            value={newJudgPos}
            onChange={(e) => setNewJudgPos(e.target.value)}
            placeholder="Technical position & tax impact..."
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Record Judgment Memo
          </button>
        </form>
      </div>
    </div>
  );
};
