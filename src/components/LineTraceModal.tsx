import React, { useState, useEffect } from 'react';
import { useWorkpaper } from '../store/workpaperStore';
import { INDEPENDENT_AUDIT_FINDINGS } from '../engine/reconciliationEngine';
import { TaxEffectCategory, VerificationType } from '../types';
import {
  X,
  FileSearch,
  GitBranch,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export const LineTraceModal: React.FC = () => {
  const {
    inspectedLineKey,
    setInspectedLineKey,
    linesByKey,
    evById,
    docsById,
    openDocument,
    packet,
    getEffectiveLineValue,
    addAdjustment,
    toggleAdjustmentStatus,
    verifications,
    stampVerification,
    applyFindingAdjustment,
    isFindingApplied,
  } = useWorkpaper();

  const line = inspectedLineKey ? linesByKey[inspectedLineKey] : null;
  const eff = inspectedLineKey ? getEffectiveLineValue(inspectedLineKey) : null;

  const [adjValStr, setAdjValStr] = useState<string>('');
  const [adjCategory, setAdjCategory] = useState<TaxEffectCategory>('schc_profit');
  const [adjReason, setAdjReason] = useState<string>('');
  const [verifyNote, setVerifyNote] = useState<string>('');

  useEffect(() => {
    if (line && eff) {
      setAdjValStr(String(eff.adjusted));
      setAdjReason('');
      // Default category guess
      if (line.key.startsWith('SchC')) setAdjCategory('schc_profit');
      else if (line.key.startsWith('SchCA') || line.key.startsWith('F540')) setAdjCategory('ca_source_income');
      else if (line.key.startsWith('SchA') || line.key.startsWith('F8283')) setAdjCategory('itemized');
      else if (line.key.startsWith('SchB')) setAdjCategory('interest');
      else if (line.key.startsWith('F8949') || line.key.startsWith('SchD')) setAdjCategory('stcg');
      else if (line.key.startsWith('Sch1.1')) setAdjCategory('adjustment');
      else setAdjCategory('ordinary_income');
    }
  }, [line, eff]);

  if (!inspectedLineKey || !line || !eff || !packet) return null;

  const v3 = packet.return_versions[2];
  const ruleDesc = line.rule ? packet.engine_reference.rules[line.rule] : null;
  const relatedFindings = INDEPENDENT_AUDIT_FINDINGS.filter((f) => f.lineKey === line.key);
  const currentVerification = verifications[line.key];

  const numericOrig = typeof eff.original === 'number' ? eff.original : 0;
  const numericTarget = parseFloat(adjValStr) || 0;
  const delta = numericTarget - numericOrig;

  const rateObj = v3.tax_effect_rates[adjCategory] || { federal_per_dollar: 0, california_per_dollar: 0 };
  const previewFedEffect =
    adjCategory === 'payment_federal' ? -delta : Math.round(delta * rateObj.federal_per_dollar);
  const previewCaEffect =
    adjCategory === 'payment_california' ? -delta : Math.round(delta * rateObj.california_per_dollar);

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjReason.trim()) {
      alert('Please enter an audit rationale for this adjustment.');
      return;
    }
    addAdjustment({
      lineKey: line.key,
      lineLabel: line.label,
      jurisdiction: line.jurisdiction,
      originalValue: eff.original,
      adjustedValue: typeof eff.original === 'number' ? numericTarget : adjValStr,
      delta,
      category: adjCategory,
      federalTaxEffect: previewFedEffect,
      californiaTaxEffect: previewCaEffect,
      reason: adjReason,
      evidenceRefs: line.sources || [],
    });
    setAdjReason('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                {line.key}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] uppercase font-mono">
                {line.jurisdiction} • Form {line.form}
              </span>
              {currentVerification && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified ({currentVerification.type.replace(/_/g, ' ')})
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-1">{line.label}</h2>
          </div>
          <button
            onClick={() => setInspectedLineKey(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Value Comparison Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 uppercase block">Engine Computed (v3)</span>
              <span className="font-mono text-lg font-bold text-slate-200">
                {typeof eff.original === 'number' ? `$${eff.original.toLocaleString()}` : eff.original}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase block">Workpaper Final Value</span>
              <span
                className={`font-mono text-lg font-bold ${
                  eff.hasAdjustment ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {typeof eff.adjusted === 'number' ? `$${eff.adjusted.toLocaleString()}` : eff.adjusted}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase block">Prior Year (2024 Return)</span>
              <span className="font-mono text-lg font-semibold text-slate-400">
                {packet.prior_years.return_2024.lines[line.key] !== undefined
                  ? `$${Number(packet.prior_years.return_2024.lines[line.key]).toLocaleString()}`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Related Audit Findings Alert */}
          {relatedFindings.map((finding) => {
            const applied = isFindingApplied(finding.id);
            return (
              <div
                key={finding.id}
                className={`p-4 rounded-lg border ${
                  applied
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-amber-950/40 border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${applied ? 'text-emerald-400' : 'text-amber-400'}`}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Independent Audit Check #{finding.number}: {finding.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">{finding.summary}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            openDocument(finding.primaryDocId, finding.primaryPage, finding.evidenceRefs);
                            setInspectedLineKey(null);
                          }}
                          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono flex items-center gap-1"
                        >
                          <FileSearch className="w-3.5 h-3.5" /> Inspect Source {finding.primaryDocId} (P.
                          {finding.primaryPage})
                        </button>
                        {!applied ? (
                          <button
                            onClick={() => applyFindingAdjustment(finding)}
                            className="text-xs px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 shadow"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Apply Fix (
                            {typeof finding.correctValue === 'number'
                              ? `$${finding.correctValue.toLocaleString()}`
                              : finding.correctValue}
                            )
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Adjustment Applied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 1. Evidence & Formula Lineage */}
          <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-emerald-400" /> How This Number Was Built (Calculation & Evidence)
            </h3>

            {line.rule && (
              <div className="text-xs bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="font-mono font-bold text-purple-300">{line.rule}:</span>{' '}
                <span className="text-slate-300">{ruleDesc || 'Engine computation rule'}</span>
              </div>
            )}

            {line.note && (
              <div className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded">
                <strong>Engine Note:</strong> {line.note}
              </div>
            )}

            {/* Upstream Line Inputs */}
            {line.inputs && line.inputs.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Upstream Return Lines ({line.inputs.length}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {line.inputs.map((inpKey) => {
                    const inpLine = linesByKey[inpKey];
                    return (
                      <button
                        key={inpKey}
                        onClick={() => setInspectedLineKey(inpKey)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5"
                      >
                        <span className="text-emerald-400 font-bold">{inpKey}</span>
                        {inpLine && (
                          <span className="text-slate-400">
                            ({typeof inpLine.value === 'number' ? `$${inpLine.value.toLocaleString()}` : inpLine.value})
                          </span>
                        )}
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extracted Values & Source Documents */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Direct Source Evidence ({line.sources?.length || 0} references):
              </span>
              {!line.sources || line.sources.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Computed from upstream lines above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {line.sources.map((src) => {
                    if (src.startsWith('ev-') && evById[src]) {
                      const ev = evById[src];
                      const doc = docsById[ev.document_id];
                      return (
                        <button
                          key={src}
                          onClick={() => {
                            openDocument(ev.document_id, ev.page, [ev.id]);
                            setInspectedLineKey(null);
                          }}
                          className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-amber-300">{ev.id}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                {ev.document_id} P.{ev.page}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 truncate mt-0.5">{ev.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{doc?.title}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-bold text-white block">
                              {typeof ev.value === 'number' ? `$${ev.value.toLocaleString()}` : String(ev.value)}
                            </span>
                            <span className="text-[10px] text-emerald-400 group-hover:underline">Trace Doc →</span>
                          </div>
                        </button>
                      );
                    }
                    // Handle qa-NN, msg-NN, py:/, ref:
                    return (
                      <div
                        key={src}
                        className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{src}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 2. Verification & Tick Marks */}
          <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Record Verification Tick Mark
            </h3>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['agreed_to_source', '✓ Agreed to Source Doc'],
                  ['recomputed', '∑ Independently Recomputed'],
                  ['agreed_to_prior_year', '↺ Agreed to 2024 Return'],
                  ['client_confirmed', '💬 Client Confirmed'],
                  ['judgment_approved', '⚖️ CPA Judgment Approved'],
                ] as Array<[VerificationType, string]>
              ).map(([vType, label]) => (
                <button
                  key={vType}
                  onClick={() => stampVerification(line.key, vType, verifyNote || undefined, line.sources || [])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    currentVerification?.type === vType
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              placeholder="Optional verification memo or evidence reference (e.g. 'Tied to D15 p.3')..."
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          {/* 3. Adjust Without Losing the Original */}
          <form onSubmit={handleSaveAdjustment} className="bg-slate-950/70 rounded-lg border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" /> Adjust Value (Preserves Original & Computes Live Tax Effect)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Adjusted Value</label>
                <input
                  type="text"
                  value={adjValStr}
                  onChange={(e) => setAdjValStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tax Rate Category</label>
                <select
                  value={adjCategory}
                  onChange={(e) => setAdjCategory(e.target.value as TaxEffectCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="schc_profit">Schedule C Profit (35.5% Fed / 3.1% CA)</option>
                  <option value="wages">Wages (31.0% Fed / 9.9% CA)</option>
                  <option value="stcg">Short-Term Cap Gain (34.8% Fed / 3.4% CA)</option>
                  <option value="ltcg">Long-Term Cap Gain (23.8% Fed / 3.4% CA)</option>
                  <option value="interest">Interest / Dividends (34.8% Fed / 6.9% CA)</option>
                  <option value="adjustment">Above-the-Line Adjustment (-31% Fed / -4.2% CA)</option>
                  <option value="itemized">Itemized Deduction (-26% Fed / -4.8% CA)</option>
                  <option value="salt">SALT Deduction (0% Fed Cap / -4.8% CA)</option>
                  <option value="ca_source_income">CA-Source Income Only (0% Fed / 6.4% CA)</option>
                  <option value="payment_federal">Federal Tax Payment (1:1 Balance Due)</option>
                  <option value="payment_california">California Tax Payment (1:1 Balance Due)</option>
                </select>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase">Estimated Tax Effect</span>
                <div className="font-mono text-xs font-bold mt-0.5 flex items-center gap-3">
                  <span className={previewFedEffect <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    Fed: {previewFedEffect >= 0 ? `+$${previewFedEffect.toLocaleString()}` : `-$${Math.abs(previewFedEffect).toLocaleString()}`}
                  </span>
                  <span className={previewCaEffect <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    CA: {previewCaEffect >= 0 ? `+$${previewCaEffect.toLocaleString()}` : `-$${Math.abs(previewCaEffect).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Required: Explain why this adjustment is made and cite supporting document..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
              >
                Record Adjustment
              </button>
            </div>

            {/* Existing Adjustments History on this Line */}
            {eff.activeAdjustments.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Active Adjustment Audit Trail:</span>
                {eff.activeAdjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-2 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-300">
                        {adj.originalValue} → {adj.adjustedValue}
                      </span>{' '}
                      <span className="text-slate-300">({adj.reason})</span>
                      <span className="block text-[10px] text-slate-400">
                        By {adj.authorName} at {new Date(adj.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAdjustmentStatus(adj.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" /> Undo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
