import React, { useState } from 'react';
import { useWorkpaper } from '../../store/workpaperStore';
import { WORKPAPER_AREAS } from '../../engine/reconciliationEngine';
import { WorkpaperAreaId } from '../../types';
import {
  Play,
  CheckCircle2,
  AlertOctagon,
  MessageSquare,
  ShieldAlert,
  Lock,
  Unlock,
  FileCheck2,
  Send,
  Clock,
  Eye,
  FileSearch,
  Calendar,
  Award,
} from 'lucide-react';

export const WorkflowAndFilingWorkspace: React.FC = () => {
  const {
    packet,
    timelineCursorIndex,
    setTimelineCursorIndex,
    reviewNotes,
    addReviewNote,
    updateReviewNoteStatus,
    areaSignOffs,
    toggleAreaSignOff,
    clientQuestions,
    addClientQuestion,
    sensitiveLogs,
    returnFrozenAtFiling,
    setReturnFrozenAtFiling,
    amendingOnTopMode,
    setAmendingOnTopMode,
    openDocument,
    setInspectedLineKey,
    liveSummary,
  } = useWorkpaper();

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [newNoteArea, setNewNoteArea] = useState<WorkpaperAreaId>('business');
  const [newNoteSev, setNewNoteSev] = useState<'blocking' | 'review' | 'fyi'>('blocking');
  const [newQuestionText, setNewQuestionText] = useState('');

  if (!packet) return null;

  const timeline = packet.timeline;
  const activeEvent = timeline[timelineCursorIndex] || timeline[timeline.length - 1];
  const v3 = packet.return_versions[2];

  const openBlockingCount = reviewNotes.filter((n) => n.severity === 'blocking' && n.status === 'open').length;

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    addReviewNote({
      areaId: newNoteArea,
      title: newNoteTitle,
      body: newNoteBody || newNoteTitle,
      severity: newNoteSev,
      assignedToId: 'st-01',
    });
    setNewNoteTitle('');
    setNewNoteBody('');
  };

  const handleAskClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    addClientQuestion('business', newQuestionText);
    setNewQuestionText('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* SECTION 1: Interactive Season Timeline Replay (Jan 2026 -> Jan 2028 IRS Exam) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Season Timeline Replay & Filing State Machine (29 Events: Jan 2026 – Jan 2028)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scrub through the engagement lifecycle: intake → v1/v2/v3 recomputes → April extension → Form 8879
              approval → July 13 e-file rejection → acceptance → 2028 IRS Letter 566 examination.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReturnFrozenAtFiling(!returnFrozenAtFiling)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                returnFrozenAtFiling
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {returnFrozenAtFiling ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {returnFrozenAtFiling ? 'Return Frozen at Filing' : 'Working Return Unfrozen'}
            </button>

            {returnFrozenAtFiling && (
              <button
                onClick={() => setAmendingOnTopMode(!amendingOnTopMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  amendingOnTopMode
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {amendingOnTopMode ? '✓ 1040-X Amend-on-Top Active' : 'Enable Amend on Top (1040-X)'}
              </button>
            )}
          </div>
        </div>

        {/* Scrubber Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={timeline.length - 1}
            value={timelineCursorIndex}
            onChange={(e) => setTimelineCursorIndex(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Jan 12, 2026 (Engagement)</span>
            <span>Mar 04 (v1)</span>
            <span>Apr 14 (Extension)</span>
            <span>Jun 23 (v3 Now)</span>
            <span>Jul 13 (E-File Reject)</span>
            <span>Jul 14 (Accepted)</span>
            <span>Jan 26, 2028 (IRS Exam)</span>
          </div>
        </div>

        {/* Active Timeline Event Banner */}
        <div className="p-4 rounded-lg bg-slate-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                Event {timelineCursorIndex + 1}/{timeline.length} • {activeEvent.id}
              </span>
              <span className="font-mono text-xs text-slate-400">{activeEvent.at}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono text-xs font-semibold">
                {activeEvent.event}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1.5">
              {activeEvent.detail || `Event triggered: ${activeEvent.event.replace(/_/g, ' ')}`}
            </p>
          </div>
          {activeEvent.refs && activeEvent.refs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {activeEvent.refs.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    if (r.startsWith('D')) openDocument(r, 1, []);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-xs"
                >
                  Ref: {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: 2028 IRS Letter 566 Examination Self-Contained Audit Defense Dossier */}
      <div className="bg-slate-900 border-2 border-purple-500/40 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 bg-purple-950/30 border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-300" />
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-mono text-xs font-bold">
                IRS NOTICE N-2025-L566 • DATED 2028-01-20 • DUE 2028-02-19
              </span>
              <h3 className="text-base font-bold text-white">
                Self-Contained IRS Correspondence Examination Defense Record (D72)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Years later, an IRS examiner or new preparer can answer Notice Letter 566 in 60 seconds with every number,
              reconciliation, and signed acknowledgment linked below.
            </p>
          </div>
          <button
            onClick={() => openDocument('D72', 1, [])}
            className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono"
          >
            Inspect D72 Notice →
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Exam Item 1: Noncash Charity */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                EXAM ITEM 1 • SCHEDULE A LINE 12 / FORM 8283
              </span>
              <span className="font-mono text-emerald-400 font-bold">Substantiated: $17,400</span>
            </div>
            <h4 className="font-bold text-white text-sm">
              Noncash Charitable Contributions: Substantiation & Statutory Valuation
            </h4>
            <p className="text-slate-300 leading-relaxed">
              1. <strong>Austin Community Foundation Donor-Advised Fund ($14,500, D65):</strong> 200 shares of Northlake
              Total Market Index Fund donated 12/05/2025. Acquired 04/2019 (cost basis $9,300, LTCG property). Valued at
              high/low average $72.50/sh = $14,500. Contemporaneous acknowledgment confirms no goods or services.
            </p>
            <p className="text-slate-300 leading-relaxed">
              2. <strong>Lone Star Kids Auto Donation ($2,900, D66 Form 1098-C):</strong> 2012 Subaru Outback (VIN
              4S4BRBCC2C3209921) donated 08/20/2025. Sold at arm’s-length auction 09/09/2025 for{' '}
              <strong>$2,900.00 gross proceeds (Box 4c)</strong>. Our workpaper caught the engine’s $6,000 KBB error and
              limited the deduction to $2,900 per IRC § 170(f)(12).
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => openDocument('D65', 1, ['ev-1050', 'ev-1052'])}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
              >
                Exhibit A: D65 Stock Ack ($14,500)
              </button>
              <button
                onClick={() => openDocument('D66', 1, ['ev-1055'])}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
              >
                Exhibit B: D66 Form 1098-C ($2,900)
              </button>
            </div>
          </div>

          {/* Exam Item 2: Schedule C Gross Receipts vs 1099-NEC + 1099-K */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                EXAM ITEM 2 • SCHEDULE C LINE 1 GROSS RECEIPTS
              </span>
              <span className="font-mono text-emerald-400 font-bold">Exact Tie-Out: $151,300</span>
            </div>
            <h4 className="font-bold text-white text-sm">
              Reconciliation of Books Revenue ($151,300) to Forms 1099-NEC ($142,000) & Form 1099-K ($12,400)
            </h4>
            <div className="font-mono bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Five Forms 1099-NEC (D16–D20: Fennimore, Atlas, Sable, Riverbend, Quill):</span>
                <strong>$142,000.00</strong>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Form 1099-K (D21 Paywell Payments — 6 card txns from Atlas Outdoor Gear):</span>
                <strong>$12,400.00</strong>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Less: Duplicate 1099-K already included in Atlas 1099-NEC ($41,200, D15 p.3):</span>
                <strong>($12,400.00)</strong>
              </div>
              <div className="flex justify-between">
                <span>Plus: Receipts from 11 clients not required to issue Form 1099 (D15 p.3):</span>
                <strong>+$9,300.00</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700 text-white font-bold">
                <span>Total True Gross Receipts Reported on Schedule C Line 1 (D14 P&L):</span>
                <span>$151,300.00</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => openDocument('D15', 3, ['ev-0109', 'ev-0110', 'ev-0111'])}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
              >
                Exhibit C: D15 QBO Deposit Proof
              </button>
              <button
                onClick={() => openDocument('D17', 1, ['ev-0116'])}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
              >
                Exhibit D: D17 Atlas 1099-NEC ($41.2k)
              </button>
              <button
                onClick={() => openDocument('D21', 1, ['ev-0127'])}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
              >
                Exhibit E: D21 Paywell 1099-K ($12.4k)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Review Notes (Blocking vs. General) & Client Evidence Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" /> Review Notes ({openBlockingCount} Blocking Open)
              </h3>
              <p className="text-xs text-slate-400">
                Blocking notes prevent Reviewer/Partner sign-off and e-file transmission until addressed.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {reviewNotes.map((rn) => (
              <div
                key={rn.id}
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  rn.status === 'open' && rn.severity === 'blocking'
                    ? 'bg-rose-950/25 border-rose-500/40'
                    : rn.status === 'addressed'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-950 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] uppercase font-bold ${
                        rn.severity === 'blocking' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {rn.severity}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400">{rn.lineKey}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['open', 'addressed', 'cleared'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => updateReviewNoteStatus(rn.id, st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          rn.status === st
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="font-bold text-white">{rn.title}</div>
                <p className="text-slate-300">{rn.body}</p>
                {rn.resolutionNote && (
                  <p className="text-emerald-300 text-[11px]">
                    <strong>Resolution ({rn.resolvedByName}):</strong> {rn.resolutionNote}
                  </p>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateNote} className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex gap-2">
              <select
                value={newNoteArea}
                onChange={(e) => setNewNoteArea(e.target.value as WorkpaperAreaId)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                {WORKPAPER_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.shortLabel}
                  </option>
                ))}
              </select>
              <select
                value={newNoteSev}
                onChange={(e) => setNewNoteSev(e.target.value as 'blocking' | 'review' | 'fyi')}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="blocking">Blocking</option>
                <option value="review">Review</option>
                <option value="fyi">FYI</option>
              </select>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="New review note title..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Detailed review instructions..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Add Note
              </button>
            </div>
          </form>
        </div>

        {/* Client Questions That Become Permanent Evidence + E-File Transmission History */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Client Questions & Call Notes (Linked as Audit
              Evidence)
            </h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
              {clientQuestions.map((cq) => (
                <div key={cq.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-emerald-400">
                      {cq.lineKey || cq.areaId} • Asked by {cq.askedByName}
                    </span>
                    <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                      {cq.evidenceRef || 'Pending'}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium">Q: {cq.question}</p>
                  {cq.clientAnswer && (
                    <p className="text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                      <strong>{cq.answeredBy}:</strong> “{cq.clientAnswer}”
                    </p>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleAskClient} className="flex gap-2 pt-2 border-t border-slate-800 text-xs">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Ask Ngozi & Erik a question (becomes permanent evidence)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>

          {/* E-File Rejection & Acceptance Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2.5 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" /> E-File Submissions, Rejection R0000-504-02 & Form 8879
            </h3>
            {packet.tax_agency_records.efile.map((sub, i) => (
              <div
                key={i}
                className={`p-2.5 rounded border flex items-center justify-between gap-2 ${
                  sub.status === 'accepted'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/25 border-rose-500/40'
                }`}
              >
                <div>
                  <div className="font-mono font-bold text-white uppercase">
                    {sub.jurisdiction} • {sub.date.slice(0, 10)} • ID: {sub.submission_id}
                  </div>
                  {sub.errors && sub.errors[0] && (
                    <div className="text-rose-300 mt-0.5">
                      <strong>{sub.errors[0].code}:</strong> {sub.errors[0].message}
                    </div>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                    sub.status === 'accepted' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: 2026 Carryforward Schedule, Safe-Harbor Planner & Sensitive Data Access Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" /> 2026 Rollforward Schedule & Safe-Harbor Estimated Tax Plan
          </h3>
          <div className="grid grid-cols-2 gap-2.5 font-mono">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Form 8801 AMT Credit to 2026</span>
              <strong className="text-emerald-400 text-sm">$3,871</strong>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">S-Corp Stock Basis (End 2025)</span>
              <strong className="text-white text-sm">$0 (Depleted)</strong>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Ridgeline Capital Account End</span>
              <strong className="text-white text-sm">$63,660</strong>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CA Depr. Basis Diff (Studio Eq.)</span>
              <strong className="text-amber-300 text-sm">$30,400 Future Deductions</strong>
            </div>
          </div>
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <strong>2026 Safe-Harbor Estimates (110% of 2025 Final Tax):</strong> Full-year Texas residents in 2026 (no
            CA estimated tax required except Sacramento rental net income if positive). Federal 110% safe harbor:{' '}
            <strong className="font-mono text-emerald-400">
              ${Math.round(liveSummary.federal.total_tax * 1.1).toLocaleString()}
            </strong>{' '}
            (4 quarterly installments due 04/15, 06/15, 09/15/2026 & 01/15/2027).
          </div>
        </div>

        {/* Sensitive Data Access Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" /> Firm Governance: Sensitive Data Access Log & Time vs. Budget
          </h3>
          <p className="text-slate-400">
            Every unmasking of an SSN, IP PIN, or bank routing number and every workpaper export is immutably logged.
          </p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-[11px]">
            {sensitiveLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <span>
                  <strong className="text-emerald-400">{log.actorName}</strong> ({log.actorRole}) → {log.action}:{' '}
                  <span className="text-white">{log.targetField}</span>
                </span>
                <span className="text-slate-500">{log.timestamp.slice(0, 19).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
