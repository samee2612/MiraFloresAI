import React, { useState } from 'react';
import { WorkpaperProvider, useWorkpaper, ALL_ACTORS } from './store/workpaperStore';
import { OverviewWorkspace } from './components/workspaces/OverviewWorkspace';
import { SchedulesWorkspace } from './components/workspaces/SchedulesWorkspace';
import { DocumentIndexWorkspace } from './components/workspaces/DocumentIndexWorkspace';
import { WhatIfAndVersionsWorkspace } from './components/workspaces/WhatIfAndVersionsWorkspace';
import { WorkflowAndFilingWorkspace } from './components/workspaces/WorkflowAndFilingWorkspace';
import { DocumentViewerDrawer } from './components/DocumentViewerDrawer';
import { LineTraceModal } from './components/LineTraceModal';
import { INDEPENDENT_AUDIT_FINDINGS } from './engine/reconciliationEngine';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  FileStack,
  Sliders,
  History,
  UserCheck,
  Download,
  RotateCcw,
  FileSearch,
  Search,
  X,
} from 'lucide-react';

type ActiveTab = 'overview' | 'schedules' | 'documents' | 'whatif' | 'workflow';

const WorkpaperAppInner: React.FC = () => {
  const {
    packet,
    loading,
    activeActor,
    setActiveActorId,
    activeDocId,
    openDocument,
    setInspectedLineKey,
    exportWorkpaperState,
    resetWorkpaperToDefault,
    liveSummary,
    isFindingApplied,
    reviewNotes,
  } = useWorkpaper();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading || !packet) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm">Loading Okafor-Lindqvist 2025 Tax Workpaper Packet (74 Docs, 3,012 Values)...</p>
      </div>
    );
  }

  const unappliedFindingsCount = INDEPENDENT_AUDIT_FINDINGS.filter((f) => !isFindingApplied(f.id)).length;
  const openBlockingNotesCount = reviewNotes.filter((n) => n.severity === 'blocking' && n.status === 'open').length;

  // Global search results
  const searchResults =
    globalSearch.trim().length >= 2
      ? {
          docs: packet.documents
            .filter(
              (d) =>
                d.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                d.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
                d.issuer.toLowerCase().includes(globalSearch.toLowerCase())
            )
            .slice(0, 5),
          lines: packet.return_versions[2].lines
            .filter(
              (l) =>
                l.key.toLowerCase().includes(globalSearch.toLowerCase()) ||
                l.label.toLowerCase().includes(globalSearch.toLowerCase())
            )
            .slice(0, 6),
        }
      : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Global Bar */}
      <header className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Brand & Client Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">MiraFlores AI Workpaper</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] font-bold">
                {packet.packet.client_id} • TY 2025
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ngozi Okafor & Erik Lindqvist (MFJ • CA → TX Part-Year Move)
            </p>
          </div>
        </div>

        {/* Center: Global Search across Docs & Return Lines */}
        <div className="relative w-72 xl:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Jump to any line (SchC.1, F8949) or doc (D01..D74)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchResults && (
            <div className="absolute left-0 right-0 top-10 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 z-50 text-xs">
              {searchResults.docs.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Documents</span>
                  {searchResults.docs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        openDocument(d.id, 1, []);
                        setGlobalSearch('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="truncate">
                        <strong className="font-mono text-emerald-400 mr-1.5">{d.id}</strong>
                        {d.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Open Doc</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.lines.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Return Lines</span>
                  {searchResults.lines.map((l) => (
                    <button
                      key={l.key}
                      onClick={() => {
                        setInspectedLineKey(l.key);
                        setGlobalSearch('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="truncate">
                        <strong className="font-mono text-amber-300 mr-1.5">{l.key}</strong>
                        {l.label}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {typeof l.value === 'number' ? `$${l.value.toLocaleString()}` : l.value}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.docs.length === 0 && searchResults.lines.length === 0 && (
                <div className="text-slate-400 text-center py-2">No matching lines or documents found.</div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Tax Ticker, Role Switcher & Persistence */}
        <div className="flex items-center gap-2.5">
          <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span>
              Fed Tax: <strong className="text-emerald-400">${liveSummary.federal.total_tax.toLocaleString()}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              CA Tax: <strong className="text-emerald-400">${liveSummary.california.total_tax.toLocaleString()}</strong>
            </span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] uppercase font-mono text-slate-400">Role:</span>
            <select
              value={activeActor.id}
              onChange={(e) => setActiveActorId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {ALL_ACTORS.map((actor) => (
                <option key={actor.id} value={actor.id} className="bg-slate-900 text-white">
                  {actor.name} ({actor.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {!activeDocId && (
            <button
              onClick={() => openDocument('D15', 3, ['ev-0109', 'ev-0110'])}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1"
            >
              <FileSearch className="w-3.5 h-3.5" /> Source Viewer
            </button>
          )}

          <button
            onClick={exportWorkpaperState}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
            title="Export Complete Workpaper State JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={resetWorkpaperToDefault}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400"
            title="Reset Workpaper to Delivered State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Primary Workspace Navigation Bar */}
      <nav className="px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              {
                id: 'overview',
                label: 'Overview & 16 Audit Checks',
                icon: LayoutDashboard,
                badge: unappliedFindingsCount > 0 ? `${unappliedFindingsCount} open` : '✓ All Fixed',
                badgeColor: unappliedFindingsCount > 0 ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-300',
              },
              {
                id: 'schedules',
                label: 'CPA Area Workpapers (10)',
                icon: FolderKanban,
                badge: '302 Lots / Assets',
                badgeColor: 'bg-slate-800 text-slate-300',
              },
              {
                id: 'documents',
                label: '74-Doc Completeness Index',
                icon: FileStack,
                badge: '74 Docs',
                badgeColor: 'bg-slate-800 text-slate-300',
              },
              {
                id: 'whatif',
                label: 'What-Ifs, Version Diff & Judgments',
                icon: Sliders,
                badge: 'v1→v2→v3',
                badgeColor: 'bg-slate-800 text-slate-300',
              },
              {
                id: 'workflow',
                label: 'Timeline, Review Notes & 2028 IRS Exam',
                icon: History,
                badge: openBlockingNotesCount > 0 ? `${openBlockingNotesCount} Blocking` : 'Ready',
                badgeColor: openBlockingNotesCount > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300',
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-400 text-white bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Split-Pane Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'overview' && <OverviewWorkspace />}
          {activeTab === 'schedules' && <SchedulesWorkspace />}
          {activeTab === 'documents' && <DocumentIndexWorkspace />}
          {activeTab === 'whatif' && <WhatIfAndVersionsWorkspace />}
          {activeTab === 'workflow' && <WorkflowAndFilingWorkspace />}
        </main>

        {/* Right Persistent Simulated Source Document Drawer */}
        <DocumentViewerDrawer />
      </div>

      {/* Modal Inspector for Any Return Line */}
      <LineTraceModal />
    </div>
  );
};

export default function App() {
  return (
    <WorkpaperProvider>
      <WorkpaperAppInner />
    </WorkpaperProvider>
  );
}
