import React, { useState } from 'react';
import { useWorkpaper } from '../store/workpaperStore';
import {
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Layers,
  Eye,
  ShieldAlert,
} from 'lucide-react';

export const DocumentViewerDrawer: React.FC = () => {
  const {
    activeDocId,
    activeDocPage,
    highlightedEvIds,
    openDocument,
    closeDocument,
    docsById,
    evsByDocId,
    docToLinesMap,
    setInspectedLineKey,
    packet,
  } = useWorkpaper();

  const [viewMode, setViewMode] = useState<'simulated_doc' | 'spatial_canvas'>('simulated_doc');

  if (!activeDocId || !docsById[activeDocId]) return null;

  const doc = docsById[activeDocId];
  const allDocEvs = evsByDocId[activeDocId] || [];
  const pageEvs = allDocEvs.filter((ev) => ev.page === activeDocPage);
  const currentPageObj = doc.pages.find((p) => p.page === activeDocPage) || doc.pages[0];
  const landingLines = docToLinesMap[activeDocId] || [];

  const v3 = packet?.return_versions[2];
  const isUsed = v3?.documents_used.includes(doc.id);
  const isSuperseded = v3?.documents_superseded.includes(doc.id);

  // Highlight matched text in printed_content
  const renderHighlightedPrintedContent = (text: string) => {
    const highlightedEvs = pageEvs.filter((e) => highlightedEvIds.includes(e.id));
    if (highlightedEvs.length === 0) return text;

    let result = text;
    const tokensToHighlight = Array.from(
      new Set(
        highlightedEvs
          .flatMap((e) => [e.text_as_read, String(e.value)])
          .filter((s) => s && s.length >= 2)
      )
    );

    if (tokensToHighlight.length === 0) return text;

    // Split and wrap matched tokens
    const escaped = tokensToHighlight.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = result.split(regex);

    return parts.map((part, idx) => {
      const isMatch = tokensToHighlight.some((t) => t.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={idx}
            className="bg-amber-400/90 text-slate-950 font-bold px-1.5 py-0.5 rounded shadow-sm ring-2 ring-amber-300 animate-pulse"
          >
            {part}
          </mark>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <aside className="w-[460px] xl:w-[520px] shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-text shadow-2xl z-20">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            {doc.id}
          </span>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-slate-100 truncate" title={doc.title}>
              {doc.title}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Issuer: <span className="text-slate-300">{doc.issuer}</span> • File:{' '}
              <span className="font-mono text-slate-300">{doc.file_name}</span>
            </p>
          </div>
        </div>
        <button
          onClick={closeDocument}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Document Viewer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status & Page Navigation Bar */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isUsed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Used in Return
            </span>
          ) : isSuperseded ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              <AlertTriangle className="w-3 h-3" /> Superseded (See D31)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium">
              <ShieldAlert className="w-3 h-3" /> Unmapped / Post-v3
            </span>
          )}

          {doc.extraction.status === 'partial' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
              <AlertTriangle className="w-3 h-3" /> Partial Extraction
            </span>
          )}
          {doc.marked_corrected && (
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
              CORRECTED
            </span>
          )}
        </div>

        {/* Page switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            disabled={activeDocPage <= 1}
            onClick={() => openDocument(doc.id, activeDocPage - 1, highlightedEvIds)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs text-slate-300">
            Page {activeDocPage} / {doc.page_count}
          </span>
          <button
            disabled={activeDocPage >= doc.page_count}
            onClick={() => openDocument(doc.id, activeDocPage + 1, highlightedEvIds)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('simulated_doc')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'simulated_doc'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Simulated Source Paper
          </button>
          <button
            onClick={() => setViewMode('spatial_canvas')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'spatial_canvas'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Bounding-Box Overlay ({pageEvs.length})
          </button>
        </div>

        {doc.page_count > 1 && (
          <select
            value={activeDocPage}
            onChange={(e) => openDocument(doc.id, Number(e.target.value), highlightedEvIds)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
          >
            {doc.pages.map((p) => (
              <option key={p.page} value={p.page}>
                Jump to P.{p.page}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Extraction Warning Banner if Partial / Not Extracted */}
        {doc.extraction.reason && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-300">
                Pipeline Extraction Status: {doc.extraction.status.toUpperCase()}
              </span>
              {doc.extraction.reason}
              {doc.id === 'D31' && activeDocPage !== 32 && (
                <button
                  onClick={() => openDocument('D31', 32, [])}
                  className="mt-1.5 inline-flex items-center gap-1 text-amber-300 underline font-semibold hover:text-amber-100"
                >
                  Jump to Unread Page 32 (Omitted Lot M18) →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Simulated Source Document Paper */}
        {viewMode === 'simulated_doc' ? (
          <div className="bg-stone-50 text-slate-900 rounded-lg shadow-xl border-2 border-stone-300 overflow-hidden">
            {/* Simulated Official Form Top Bar */}
            <div className="bg-stone-200/90 border-b border-stone-300 px-4 py-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block">
                  Official Tax Source Record • Tax Year {doc.tax_year}
                </span>
                <h4 className="text-xs font-bold text-stone-900">{doc.issuer}</h4>
              </div>
              <div className="text-right font-mono text-[10px] text-stone-600">
                <div>DOC ID: {doc.id}</div>
                <div>
                  PAGE {activeDocPage} OF {doc.page_count}
                </div>
              </div>
            </div>

            {/* Printed Content Verbatim Box */}
            <div className="p-4 bg-white border-b border-stone-200">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
                <span>Printed Content on Page {activeDocPage} (Ground Truth)</span>
                {highlightedEvIds.length > 0 && (
                  <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-semibold">
                    Tracing Active Field
                  </span>
                )}
              </div>
              <div className="font-mono text-xs leading-relaxed text-stone-800 whitespace-pre-wrap bg-stone-50 p-3 rounded border border-stone-200">
                {renderHighlightedPrintedContent(currentPageObj?.printed_content || 'No content on page.')}
              </div>
            </div>

            {/* Extracted Fields Grid on This Page */}
            <div className="p-4 bg-stone-50">
              <div className="text-[11px] font-semibold text-stone-600 mb-2 flex items-center justify-between">
                <span>Extracted Fields on Page {activeDocPage} ({pageEvs.length})</span>
                <span className="text-[10px] font-mono text-stone-500">Click any box to trace</span>
              </div>

              {pageEvs.length === 0 ? (
                <div className="text-xs text-stone-500 italic py-3 text-center border border-dashed border-stone-300 rounded">
                  No values extracted by pipeline on Page {activeDocPage}.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {pageEvs.map((ev) => {
                    const isHighlighted = highlightedEvIds.includes(ev.id);
                    const isLowConf = ev.confidence < 0.85;
                    const isOcrMismatch =
                      ev.id === 'ev-1045' || // 74-3829516 vs printed 74-3829156
                      (ev.id === 'ev-0919' && ev.value === null);

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openDocument(doc.id, activeDocPage, [ev.id])}
                        className={`p-2.5 rounded-md border transition-all cursor-pointer ${
                          isHighlighted
                            ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 shadow-md'
                            : isOcrMismatch || isLowConf
                            ? 'bg-rose-50 border-rose-300 hover:border-rose-400'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-100 font-semibold">
                              {ev.id}
                            </span>
                            <span className="text-xs font-semibold text-stone-800 truncate">{ev.label}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                              ev.confidence >= 0.95
                                ? 'bg-emerald-100 text-emerald-800'
                                : ev.confidence >= 0.8
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-200 text-rose-900 font-bold'
                            }`}
                          >
                            {(ev.confidence * 100).toFixed(0)}% conf
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between font-mono text-xs">
                          <span className="text-stone-500 text-[10px]">
                            Field: <strong>{ev.field}</strong> | Pos: ({ev.position.x0.toFixed(2)},{' '}
                            {ev.position.y0.toFixed(2)})
                          </span>
                          <span className="text-sm font-bold text-stone-900">
                            {ev.value === null ? (
                              <span className="text-rose-600 italic">NULL (Blank)</span>
                            ) : typeof ev.value === 'number' && ev.value_type === 'money' ? (
                              `$${ev.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            ) : (
                              String(ev.value)
                            )}
                          </span>
                        </div>

                        {ev.id === 'ev-1045' && (
                          <div className="mt-1.5 text-[11px] bg-rose-100 text-rose-900 px-2 py-1 rounded border border-rose-300 font-medium">
                            ⚠️ OCR Transposition Alert: Pipeline read <strong>74-3829516</strong> (97% conf), but
                            printed document above states <strong>74-3829156</strong>!
                          </div>
                        )}
                        {ev.id === 'ev-1049' && (
                          <div className="mt-1.5 text-[11px] bg-amber-100 text-amber-900 px-2 py-1 rounded border border-amber-300 font-medium">
                            ⚠️ Low Confidence (41%): Ambiguous handwritten first digit ($?,500.00). Confirmed as $1,500
                            via client message msg-08 (Check #2207).
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Spatial Bounding-Box Canvas View */
          <div className="bg-stone-100 rounded-lg border-2 border-stone-300 p-3">
            <div className="text-xs text-stone-700 mb-2 flex items-center justify-between">
              <span className="font-semibold">
                Synthetic Page Coordinate Map (x0, y0 → x1, y1)
              </span>
              <span className="text-[10px] font-mono text-stone-500">Ready for Production PDF/Image Layer</span>
            </div>
            <div className="relative w-full h-[460px] bg-white rounded border border-stone-300 shadow-inner overflow-hidden">
              {/* Subtle background watermark of printed text */}
              <div className="absolute inset-0 p-4 text-[11px] font-mono text-stone-300 select-none pointer-events-none leading-relaxed">
                {currentPageObj?.printed_content}
              </div>

              {/* Render Bounding Boxes from position {x0, y0, x1, y1} */}
              {pageEvs.map((ev) => {
                const isHi = highlightedEvIds.includes(ev.id);
                const left = `${Math.min(Math.max(ev.position.x0 * 100, 2), 85)}%`;
                const top = `${Math.min(Math.max(ev.position.y0 * 100, 2), 90)}%`;
                const width = `${Math.max((ev.position.x1 - ev.position.x0) * 100, 14)}%`;
                const height = `${Math.max((ev.position.y1 - ev.position.y0) * 100, 6)}%`;

                return (
                  <button
                    key={ev.id}
                    onClick={() => openDocument(doc.id, activeDocPage, [ev.id])}
                    style={{ left, top, width, minHeight: height }}
                    className={`absolute p-1 rounded border text-left transition-all flex flex-col justify-center ${
                      isHi
                        ? 'bg-amber-400/90 border-amber-700 text-slate-950 z-30 ring-4 ring-amber-300 shadow-lg scale-105'
                        : 'bg-emerald-500/15 border-emerald-600/60 text-slate-900 hover:bg-emerald-500/30 z-10'
                    }`}
                    title={`${ev.id}: ${ev.label} = ${ev.value} (${(ev.confidence * 100).toFixed(0)}%)`}
                  >
                    <span className="text-[9px] font-mono font-bold leading-none truncate">
                      {ev.id} • {ev.field}
                    </span>
                    <span className="text-[10px] font-mono font-semibold truncate">
                      {ev.text_as_read || String(ev.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Where This Document Landed on the Return (Bi-Directional Completeness) */}
        <div className="bg-slate-950 rounded-lg border border-slate-800 p-3.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>Where Document {doc.id} Landed on Return</span>
            <span className="font-mono text-emerald-400">{landingLines.length} line(s)</span>
          </h4>

          {landingLines.length === 0 ? (
            <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded border border-slate-800">
              {isSuperseded ? (
                <span>
                  <strong>Superseded Document:</strong> Replaced by corrected brokerage statement{' '}
                  <button
                    onClick={() => openDocument('D31', 1, [])}
                    className="text-emerald-400 underline font-semibold"
                  >
                    D31
                  </button>{' '}
                  received on 2026-03-18.
                </span>
              ) : doc.id === 'D73' ? (
                <span>
                  <strong>Critical Unmapped Evidence:</strong> Paystub proving Ngozi’s CA YTD wages were only $22,469 at
                  move date (07/15/2025). Engine ignored D73 and used W-2 Box 16 ($111,300).{' '}
                  <button
                    onClick={() => setInspectedLineKey('SchCA540NR.1.E')}
                    className="text-emerald-400 underline font-semibold"
                  >
                    Inspect SchCA540NR.1.E →
                  </button>
                </span>
              ) : doc.id === 'D71' ? (
                <span>
                  <strong>Post-v3 Identity Proof:</strong> Social Security card for Theo Lindqvist-Okafor (666-74-3390)
                  uploaded 2026-07-13 to cure IRS E-File Rejection R0000-504-02.
                </span>
              ) : (
                <span>
                  <strong>Reference / Administrative Record:</strong> Used for engagement scope, identity verification,
                  or structured agency/prior-year reference rather than a direct numeric line input.
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {landingLines.map((line) => (
                <button
                  key={line.key}
                  onClick={() => setInspectedLineKey(line.key)}
                  className="w-full text-left px-2.5 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800/90 flex items-center justify-between gap-2 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-emerald-400 group-hover:underline">
                        {line.key}
                      </span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {line.jurisdiction}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">{line.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs font-semibold text-white">
                      {typeof line.value === 'number' ? `$${line.value.toLocaleString()}` : line.value}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
