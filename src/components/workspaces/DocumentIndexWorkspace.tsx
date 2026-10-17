import React, { useState, useMemo } from 'react';
import { useWorkpaper } from '../../store/workpaperStore';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Layers,
  Filter,
} from 'lucide-react';

export const DocumentIndexWorkspace: React.FC = () => {
  const { packet, docToLinesMap, openDocument, setInspectedLineKey } = useWorkpaper();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'superseded' | 'partial_or_unmapped'>('all');

  if (!packet) return null;

  const v3 = packet.return_versions[2];
  const usedSet = new Set(v3.documents_used);
  const supSet = new Set(v3.documents_superseded);

  const filteredDocs = useMemo(() => {
    return packet.documents.filter((d) => {
      if (
        search &&
        !d.title.toLowerCase().includes(search.toLowerCase()) &&
        !d.id.toLowerCase().includes(search.toLowerCase()) &&
        !d.issuer.toLowerCase().includes(search.toLowerCase()) &&
        !d.document_type.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (statusFilter === 'used') return usedSet.has(d.id);
      if (statusFilter === 'superseded') return supSet.has(d.id);
      if (statusFilter === 'partial_or_unmapped') {
        return d.extraction.status !== 'extracted' || (!usedSet.has(d.id) && !supSet.has(d.id));
      }
      return true;
    });
  }, [packet.documents, search, statusFilter, usedSet, supSet]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Completeness Proof Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Document Completeness Index (74 Documents • 3,012 Extracted Values)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Proves every client and agency document was accounted for: where every extracted value landed on the return,
            or the explicit audit rationale why it did not.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <div className="px-3 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <strong>{v3.documents_used.length}</strong> Used in v3
          </div>
          <div className="px-3 py-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <strong>{v3.documents_superseded.length}</strong> Superseded (D30)
          </div>
          <div className="px-3 py-1.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300">
            <strong>2</strong> Post-v3 Docs (D71, D72)
          </div>
        </div>
      </div>

      {/* Outside Filings Completeness Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-amber-300">OUTSIDE FILING #1</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
              Due Oct 15, 2026
            </span>
          </div>
          <h4 className="font-bold text-white mt-1">FinCEN Form 114 (FBAR) — Sweden Account (D36)</h4>
          <p className="text-slate-400 mt-1">
            Sparbanken Norrland max balance SEK 1,452,300 ($149,567 USD) exceeds $10,000 threshold. Excluded from
            engagement scope per D01; client notified to file via BSA E-Filing.
          </p>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-rose-300">OUTSIDE FILING #2</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
              Late (Due Feb 2, 2026)
            </span>
          </div>
          <h4 className="font-bold text-white mt-1">Forms 1099-NEC for Studio Contractors (D27)</h4>
          <p className="text-slate-400 mt-1">
            Erik paid Mara Quintero ($4,800) and Dev Patel ($2,600) by ACH without issuing 1099-NECs (SchC.I=Yes,
            SchC.J=No). Advised client on late filing & W-9 collection.
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-emerald-300">OUTSIDE FILING #3</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
              Satisfied via Composite
            </span>
          </div>
          <h4 className="font-bold text-white mt-1">OR & AZ Nonresident Returns (D38, D39)</h4>
          <p className="text-slate-400 mt-1">
            Woodworks filed an Oregon composite return ($1,580 OR tax paid; Schedule S credit claimed). Ridgeline filed
            an Arizona composite return. No separate individual OR/AZ filings required.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              ['all', 'All 74 Documents'],
              ['used', 'Used in Return (71)'],
              ['superseded', 'Superseded (D30)'],
              ['partial_or_unmapped', '⚠️ Partial / Unextracted / Post-v3 (7)'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                statusFilter === key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search D01..D74, issuer, type..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200"
          />
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Document Title & Issuer</th>
              <th className="py-2.5 px-3">Owner / Year</th>
              <th className="py-2.5 px-3">Extraction Status</th>
              <th className="py-2.5 px-3">Where It Landed on Return (or Why Not)</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filteredDocs.map((doc) => {
              const landed = docToLinesMap[doc.id] || [];
              const isUsed = usedSet.has(doc.id);
              const isSup = supSet.has(doc.id);

              return (
                <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {doc.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{doc.title}</span>
                      {doc.marked_corrected && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                          CORRECTED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.issuer} • <span className="font-mono">{doc.file_name}</span> ({doc.page_count}p)
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                    {doc.belongs_to} • {doc.tax_year}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {doc.extraction.status === 'extracted' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> {doc.extraction.values} vals
                      </span>
                    ) : doc.extraction.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Partial ({doc.extraction.values})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                        Narrative / Structured
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {landed.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {landed.slice(0, 5).map((l) => (
                          <button
                            key={l.key}
                            onClick={() => setInspectedLineKey(l.key)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[10px]"
                          >
                            {l.key}
                          </button>
                        ))}
                        {landed.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono text-[10px]">
                            +{landed.length - 5} more lines
                          </span>
                        )}
                      </div>
                    ) : isSup ? (
                      <span className="text-amber-300 text-[11px]">
                        Superseded by Corrected 1099 (D31) received 2026-03-18.
                      </span>
                    ) : doc.id === 'D10' ? (
                      <span className="text-slate-400 text-[11px]">
                        Duplicate phone photo of Halvorsen W-2 (D09); verified identical.
                      </span>
                    ) : doc.id === 'D73' ? (
                      <span className="text-amber-300 font-semibold text-[11px]">
                        ⚠️ Omitted by engine; substantiates $22,469 CA YTD wages on SchCA540NR.1.E!
                      </span>
                    ) : doc.id === 'D71' ? (
                      <span className="text-emerald-300 text-[11px]">
                        Substantiates Theo’s SSN (666-74-3390) after July 13 e-file rejection.
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {doc.extraction.reason || 'Engagement / identity / prior-year reference record.'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openDocument(doc.id, 1, [])}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs inline-flex items-center gap-1"
                    >
                      Open Doc <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
