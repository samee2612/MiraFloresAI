import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PacketData,
  WorkpaperAdjustment,
  VerificationStamp,
  ReviewNote,
  AreaSignOff,
  AuditFinding,
  ClientQuestionItem,
  SensitiveDataLogEntry,
  JudgmentElectionRecord,
  WorkpaperAreaId,
  TaxEffectCategory,
  VerificationType,
  DocumentRecord,
  ExtractedValue,
  ReturnLine,
} from '../types';
import {
  WORKPAPER_AREAS,
  INDEPENDENT_AUDIT_FINDINGS,
  INITIAL_JUDGMENT_ELECTIONS,
  mapFormToArea,
} from '../engine/reconciliationEngine';

const STORAGE_KEY = 'miraflores_workpaper_state_v1';

export interface ActiveActor {
  id: string;
  name: string;
  role: 'preparer' | 'reviewer' | 'partner' | 'firm_administrator' | 'quality_reviewer' | 'client';
  credential: string | null;
  sensitiveClearance: boolean;
}

export const ALL_ACTORS: ActiveActor[] = [
  { id: 'st-01', name: 'Priya Raman', role: 'preparer', credential: 'EA', sensitiveClearance: true },
  { id: 'st-04', name: 'Marcus Bell', role: 'preparer', credential: 'CPA (New Hire)', sensitiveClearance: true },
  { id: 'st-02', name: 'Daniel Ortiz', role: 'reviewer', credential: 'CPA', sensitiveClearance: true },
  { id: 'st-03', name: 'Helen Strand', role: 'partner', credential: 'CPA', sensitiveClearance: true },
  { id: 'st-05', name: 'Jo Kimura', role: 'firm_administrator', credential: null, sensitiveClearance: false },
  { id: 'st-06', name: 'Sam Adeyemi', role: 'quality_reviewer', credential: 'CPA', sensitiveClearance: true },
  { id: 'cu-01', name: 'Ngozi Okafor (Client)', role: 'client', credential: null, sensitiveClearance: true },
];

interface PersistedState {
  activeActorId: string;
  selectedVersion: 'v1' | 'v2' | 'v3';
  timelineCursorIndex: number; // 0 to 28
  adjustments: WorkpaperAdjustment[];
  verifications: Record<string, VerificationStamp>;
  reviewNotes: ReviewNote[];
  areaSignOffs: Record<WorkpaperAreaId, AreaSignOff>;
  clientQuestions: ClientQuestionItem[];
  judgments: JudgmentElectionRecord[];
  sensitiveLogs: SensitiveDataLogEntry[];
  activeWhatIfIds: string[];
  form8867Completed: boolean;
  returnFrozenAtFiling: boolean;
  amendingOnTopMode: boolean;
  seenLineChanges: Record<string, boolean>;
  docDispositions: Record<string, { status: string; note: string }>;
}

const DEFAULT_REVIEW_NOTES: ReviewNote[] = [
  {
    id: 'rn-01',
    areaId: 'wages_and_stock_compensation',
    lineKey: 'SchD.1b',
    documentId: 'D11',
    title: 'BLOCKING: Corvane RSU Lots N1, N3, N4 Missing $47,620 Cost Basis',
    body: 'Engine took $0 basis from Northlake 1099-B (D28) for noncovered RSU lots N1, N3, and N4. Please apply the $47,620 adjusted basis from Corvane Stock Plan Supplement (D11 p.2) so we do not double-tax W-2 RSU wages.',
    severity: 'blocking',
    status: 'open',
    authorId: 'st-02',
    authorName: 'Daniel Ortiz, CPA',
    assignedToId: 'st-01',
    createdAt: '2026-06-24T09:15:00Z',
  },
  {
    id: 'rn-02',
    areaId: 'business',
    lineKey: 'SchC.1',
    documentId: 'D15',
    title: 'BLOCKING: Schedule C Double-Counted $12,400 Paywell 1099-K & Duplicate Mileage Scan',
    body: '1) SchC.1 is $163,700 because the engine added D21 ($12,400 1099-K) on top of QBO revenue ($151,300). D15 p.3 confirms Paywell receipts were already inside Atlas Outdoor Gear revenue. 2) D23 Page 3 is a duplicate scan of Page 2 (3,700 miles). Adjust both before Reviewer sign-off.',
    severity: 'blocking',
    status: 'open',
    authorId: 'st-02',
    authorName: 'Daniel Ortiz, CPA',
    assignedToId: 'st-01',
    createdAt: '2026-06-24T10:05:00Z',
  },
  {
    id: 'rn-03',
    areaId: 'california',
    lineKey: 'SchCA540NR.1.E',
    documentId: 'D73',
    title: 'BLOCKING: Halvorsen W-2 Over-Sourced $88,831 to California',
    body: 'Halvorsen kept CA payroll open until Sept 30 by mistake. Use Ngozi’s 07/18/2025 paystub (D73) showing $22,469 YTD CA wages at the 07/15/2025 move date to adjust SchCA540NR.1.E from $218,400 to $129,569.',
    severity: 'blocking',
    status: 'open',
    authorId: 'st-03',
    authorName: 'Helen Strand, CPA (Partner)',
    assignedToId: 'st-01',
    createdAt: '2026-06-24T11:30:00Z',
  },
  {
    id: 'rn-04',
    areaId: 'retirement_and_foreign',
    lineKey: 'Sch1.17',
    documentId: 'D25',
    title: 'BLOCKING: SE Health Insurance ($14,400) Disallowed Under IRC § 162(l)(2)(B)',
    body: 'Per qa-25 and W-2 Box 12 DD, Ngozi’s employers offered family HDHP coverage all year. Erik cannot deduct his individual plan above the line on Schedule 1 Line 17.',
    severity: 'blocking',
    status: 'open',
    authorId: 'st-02',
    authorName: 'Daniel Ortiz, CPA',
    assignedToId: 'st-01',
    createdAt: '2026-06-24T13:10:00Z',
  },
  {
    id: 'rn-05',
    areaId: 'deductions_and_credits',
    lineKey: 'SchA.12',
    documentId: 'D66',
    title: 'BLOCKING: Subaru Donation Capped at $2,900 (1098-C) & Mortgage/Property Tax Tie-Out',
    body: 'Adjust F8283 vehicle donation from $6,000 KBB to $2,900 per D66 Form 1098-C Box 4c. Also remove $2,150 duplicate Lonestar payoff interest (D56) and reduce Travis County property tax by the $6,912 seller credit on D54.',
    severity: 'blocking',
    status: 'open',
    authorId: 'st-02',
    authorName: 'Daniel Ortiz, CPA',
    assignedToId: 'st-04',
    createdAt: '2026-06-24T14:45:00Z',
  },
  {
    id: 'rn-06',
    areaId: 'intake_and_engagement',
    lineKey: 'F2441.1b',
    documentId: 'D71',
    title: 'BLOCKING: Verify Theo SSN (666-74-3390) & Little Sprouts EIN (74-3829156)',
    body: 'Organizer has Theo’s SSN as 666-74-3309, which conflicts with 2024 return D06 (666-74-3390) and will cause an IRS e-file rejection. Also fix OCR transposition on D62 EIN (74-3829156).',
    severity: 'blocking',
    status: 'open',
    authorId: 'st-01',
    authorName: 'Priya Raman',
    assignedToId: 'st-01',
    createdAt: '2026-06-24T15:20:00Z',
  },
];

const DEFAULT_CLIENT_QUESTIONS: ClientQuestionItem[] = [
  {
    id: 'cq-01',
    areaId: 'investments_and_digital_assets',
    lineKey: 'F8949.H.C6',
    question: 'Coinhaven shows 0.05 BTC sold on 06/18/2025 ($5,325 proceeds) was transferred in on 06/01/2025 with no cost basis. When did you originally purchase this BTC and what was your cost basis?',
    askedById: 'st-01',
    askedByName: 'Priya Raman',
    askedAt: '2026-06-25T10:00:00Z',
    status: 'answered_evidence_linked',
    clientAnswer: 'That BTC was bought on CryptoNorth in March 2021 for $3,050 and moved to Coinhaven in June 2025. Bank statement shows $3,050 to CryptoNorth on 03/15/2021.',
    answeredBy: 'Erik Lindqvist',
    answeredAt: '2026-06-30T18:02:00Z',
    evidenceRef: 'msg-07',
  },
  {
    id: 'cq-02',
    areaId: 'deductions_and_credits',
    lineKey: 'SchA.11',
    question: 'The handwritten receipt from St. Brigid Parish dated 12/21/2025 ($?,500.00) has an ambiguous first digit (1 vs 7). Can you confirm the exact amount from your check register?',
    askedById: 'st-01',
    askedByName: 'Priya Raman',
    askedAt: '2026-06-25T10:05:00Z',
    status: 'answered_evidence_linked',
    clientAnswer: 'St. Brigid confirmed by phone the gift was $1,500 — matches our bank statement (Check #2207, 12/21/2025).',
    answeredBy: 'Ngozi Okafor',
    answeredAt: '2026-07-01T16:40:00Z',
    evidenceRef: 'msg-08',
  },
  {
    id: 'cq-03',
    areaId: 'intake_and_engagement',
    lineKey: 'F1040.dependents',
    question: 'IRS e-file rejected Dependent 2 (Theo Lindqvist-Okafor) with code R0000-504-02 (TIN mismatch). Organizer shows 666-74-3309 while 2024 return shows 666-74-3390. Please upload Theo’s Social Security card.',
    askedById: 'st-01',
    askedByName: 'Priya Raman',
    askedAt: '2026-07-13T17:15:00Z',
    status: 'answered_evidence_linked',
    clientAnswer: 'Theo’s Social Security card attached (D71: 666-74-3390). I typed his number wrong in the organizer.',
    answeredBy: 'Ngozi Okafor',
    answeredAt: '2026-07-13T18:55:00Z',
    evidenceRef: 'msg-10',
  },
];

function createInitialAreaSignOffs(): Record<WorkpaperAreaId, AreaSignOff> {
  const budgetMap: Record<WorkpaperAreaId, { actual: number; budget: number }> = {
    intake_and_engagement: { actual: 1.2, budget: 1.5 },
    wages_and_stock_compensation: { actual: 2.8, budget: 3.0 },
    investments_and_digital_assets: { actual: 3.6, budget: 4.0 },
    business: { actual: 3.4, budget: 3.5 },
    rentals_and_sale: { actual: 3.1, budget: 3.5 },
    pass_throughs_and_basis: { actual: 1.9, budget: 2.0 },
    retirement_and_foreign: { actual: 1.3, budget: 1.5 },
    deductions_and_credits: { actual: 2.1, budget: 2.0 },
    california: { actual: 1.6, budget: 1.5 },
    payments_and_filing: { actual: 0.9, budget: 1.0 },
  };

  const result = {} as Record<WorkpaperAreaId, AreaSignOff>;
  for (const area of WORKPAPER_AREAS) {
    result[area.id] = {
      areaId: area.id,
      areaLabel: area.label,
      preparerSignOff: {
        signed: area.id === 'rentals_and_sale' || area.id === 'pass_throughs_and_basis',
        byId: 'st-01',
        byName: 'Priya Raman',
        at: '2026-06-24T16:30:00Z',
      },
      reviewerSignOff: {
        signed: area.id === 'pass_throughs_and_basis',
        byId: 'st-02',
        byName: 'Daniel Ortiz, CPA',
        at: '2026-06-25T11:00:00Z',
      },
      partnerSignOff: {
        signed: false,
      },
      actualHours: budgetMap[area.id].actual,
      budgetHours: budgetMap[area.id].budget,
    };
  }
  return result;
}

interface WorkpaperContextType {
  packet: PacketData | null;
  loading: boolean;
  activeActor: ActiveActor;
  setActiveActorId: (id: string) => void;
  selectedVersion: 'v1' | 'v2' | 'v3';
  setSelectedVersion: (v: 'v1' | 'v2' | 'v3') => void;
  timelineCursorIndex: number;
  setTimelineCursorIndex: (idx: number) => void;

  // Document & Line Inspection
  activeDocId: string | null;
  activeDocPage: number;
  highlightedEvIds: string[];
  openDocument: (docId: string, page?: number, evIds?: string[]) => void;
  closeDocument: () => void;
  inspectedLineKey: string | null;
  setInspectedLineKey: (key: string | null) => void;

  // Evidence Graph Lookups
  docsById: Record<string, DocumentRecord>;
  evById: Record<string, ExtractedValue>;
  evsByDocId: Record<string, ExtractedValue[]>;
  linesByKey: Record<string, ReturnLine>;
  docToLinesMap: Record<string, ReturnLine[]>;

  // Adjustments & Live Computation
  adjustments: WorkpaperAdjustment[];
  addAdjustment: (adj: Omit<WorkpaperAdjustment, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'status'>) => void;
  toggleAdjustmentStatus: (adjId: string) => void;
  applyFindingAdjustment: (finding: AuditFinding) => void;
  applyAllFindings: () => void;
  revertAllAdjustments: () => void;
  isFindingApplied: (findingId: string) => boolean;
  getEffectiveLineValue: (lineKey: string) => {
    original: number | string;
    adjusted: number | string;
    hasAdjustment: boolean;
    activeAdjustments: WorkpaperAdjustment[];
  };
  liveSummary: {
    federal: {
      agi: number;
      taxable_income: number;
      total_tax: number;
      payments: number;
      balance_due: number;
      penalty: number;
      taxDelta: number;
    };
    california: {
      total_agi: number;
      ca_agi: number;
      total_tax: number;
      payments: number;
      balance_due: number;
      penalty: number;
      taxDelta: number;
    };
  };

  // Verification & Tick Marks
  verifications: Record<string, VerificationStamp>;
  stampVerification: (lineKey: string, type: VerificationType, note?: string, refs?: string[]) => void;
  bulkStampVerification: (lineKeys: string[], type: VerificationType, note?: string) => void;

  // Review Notes, Sign-Offs, Client Questions
  reviewNotes: ReviewNote[];
  addReviewNote: (note: Omit<ReviewNote, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'status'>) => void;
  updateReviewNoteStatus: (id: string, status: 'open' | 'addressed' | 'cleared', resolutionNote?: string) => void;
  areaSignOffs: Record<WorkpaperAreaId, AreaSignOff>;
  toggleAreaSignOff: (areaId: WorkpaperAreaId, level: 'preparer' | 'reviewer' | 'partner') => void;
  updateAreaHours: (areaId: WorkpaperAreaId, hours: number) => void;
  clientQuestions: ClientQuestionItem[];
  addClientQuestion: (areaId: WorkpaperAreaId, question: string, lineKey?: string) => void;
  judgments: JudgmentElectionRecord[];
  addJudgment: (j: Omit<JudgmentElectionRecord, 'id' | 'documentedBy' | 'documentedAt'>) => void;

  // Sensitive Data & Governance
  unmaskedFields: Record<string, boolean>;
  toggleUnmaskField: (fieldKey: string, actionType?: SensitiveDataLogEntry['action']) => void;
  sensitiveLogs: SensitiveDataLogEntry[];

  // What-If & Filing Controls
  activeWhatIfIds: string[];
  toggleWhatIf: (id: string) => void;
  form8867Completed: boolean;
  setForm8867Completed: (v: boolean) => void;
  returnFrozenAtFiling: boolean;
  setReturnFrozenAtFiling: (v: boolean) => void;
  amendingOnTopMode: boolean;
  setAmendingOnTopMode: (v: boolean) => void;
  seenLineChanges: Record<string, boolean>;
  markLineChangeSeen: (key: string) => void;
  markAllChangesSeen: () => void;
  resetWorkpaperToDefault: () => void;
  exportWorkpaperState: () => void;
}

const WorkpaperContext = createContext<WorkpaperContextType | undefined>(undefined);

export const WorkpaperProvider: React.FC<{ children: React.ReactNode; initialPacket?: PacketData }> = ({
  children,
  initialPacket,
}) => {
  const [packet, setPacket] = useState<PacketData | null>(initialPacket || null);
  const [loading, setLoading] = useState(!initialPacket);

  const [state, setState] = useState<PersistedState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load persisted state:', e);
    }
    return {
      activeActorId: 'st-01',
      selectedVersion: 'v3',
      timelineCursorIndex: 16, // tl-17 (v3 computed 2026-06-23)
      adjustments: [],
      verifications: {
        'F1040.1a': {
          lineKey: 'F1040.1a',
          type: 'agreed_to_source',
          verifiedById: 'st-01',
          verifiedByName: 'Priya Raman',
          verifiedAt: '2026-06-23T14:00:00Z',
          note: 'Agreed to Corvane W-2 (D08 $104,600) + Halvorsen W-2 (D09 $107,800) = $212,400.',
          evidenceRefs: ['ev-0016', 'ev-0035'],
        },
        'F7203.excess': {
          lineKey: 'F7203.excess',
          type: 'recomputed',
          verifiedById: 'st-01',
          verifiedByName: 'Priya Raman',
          verifiedAt: '2026-06-23T15:10:00Z',
          note: 'Reconstructed 2022–2025 basis using newly obtained 2023 K-1 (D40). Excess distribution $21,215 confirmed.',
          evidenceRefs: ['D07', 'D39', 'D40'],
        },
        'F8606.18': {
          lineKey: 'F8606.18',
          type: 'agreed_to_prior_year',
          verifiedById: 'st-01',
          verifiedByName: 'Priya Raman',
          verifiedAt: '2026-06-23T15:40:00Z',
          note: 'Confirmed $7,000 2024 basis on D06/D42 + $7,000 2025 contribution on D43 against $14,026 conversion on D41.',
          evidenceRefs: ['D41', 'D42', 'D43'],
        },
      },
      reviewNotes: DEFAULT_REVIEW_NOTES,
      areaSignOffs: createInitialAreaSignOffs(),
      clientQuestions: DEFAULT_CLIENT_QUESTIONS,
      judgments: INITIAL_JUDGMENT_ELECTIONS,
      sensitiveLogs: [
        {
          id: 'log-01',
          timestamp: '2026-06-23T09:14:22Z',
          actorId: 'st-01',
          actorName: 'Priya Raman',
          actorRole: 'preparer',
          targetField: 'Ngozi Okafor IP PIN (D03)',
          action: 'viewed_ip_pin',
        },
      ],
      activeWhatIfIds: [],
      form8867Completed: true,
      returnFrozenAtFiling: false,
      amendingOnTopMode: false,
      seenLineChanges: {},
      docDispositions: {},
    };
  });

  // UI Ephemeral State (Document Drawer & Line Modal)
  const [activeDocId, setActiveDocId] = useState<string | null>('D15');
  const [activeDocPage, setActiveDocPage] = useState<number>(3);
  const [highlightedEvIds, setHighlightedEvIds] = useState<string[]>(['ev-0109', 'ev-0110']);
  const [inspectedLineKey, setInspectedLineKey] = useState<string | null>(null);
  const [unmaskedFields, setUnmaskedFields] = useState<Record<string, boolean>>({});

  // Load packet.json on mount
  useEffect(() => {
    if (initialPacket) return;
    fetch('./packet.json')
      .then((res) => res.json())
      .then((data: PacketData) => {
        setPacket(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading packet.json:', err);
        setLoading(false);
      });
  }, [initialPacket]);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [state]);

  const activeActor = useMemo(() => {
    return ALL_ACTORS.find((a) => a.id === state.activeActorId) || ALL_ACTORS[0];
  }, [state.activeActorId]);

  const currentVersionObj = useMemo(() => {
    if (!packet) return null;
    return (
      packet.return_versions.find((rv) => rv.version === state.selectedVersion) ||
      packet.return_versions[packet.return_versions.length - 1]
    );
  }, [packet, state.selectedVersion]);

  // Bi-directional Evidence Graph Maps
  const { docsById, evById, evsByDocId, linesByKey, docToLinesMap } = useMemo(() => {
    const dMap: Record<string, DocumentRecord> = {};
    const eMap: Record<string, ExtractedValue> = {};
    const eByDoc: Record<string, ExtractedValue[]> = {};
    const lMap: Record<string, ReturnLine> = {};
    const dToLines: Record<string, ReturnLine[]> = {};

    if (!packet || !currentVersionObj) {
      return { docsById: dMap, evById: eMap, evsByDocId: eByDoc, linesByKey: lMap, docToLinesMap: dToLines };
    }

    for (const d of packet.documents) {
      dMap[d.id] = d;
      eByDoc[d.id] = [];
      dToLines[d.id] = [];
    }

    for (const ev of packet.extracted_values) {
      eMap[ev.id] = ev;
      if (!eByDoc[ev.document_id]) eByDoc[ev.document_id] = [];
      eByDoc[ev.document_id].push(ev);
    }

    for (const line of currentVersionObj.lines) {
      lMap[line.key] = line;
      const seenDocs = new Set<string>();
      for (const src of line.sources || []) {
        if (src.startsWith('ev-') && eMap[src]) {
          const docId = eMap[src].document_id;
          if (!seenDocs.has(docId)) {
            seenDocs.add(docId);
            if (!dToLines[docId]) dToLines[docId] = [];
            dToLines[docId].push(line);
          }
        } else if (src.startsWith('doc:D')) {
          const docId = src.slice(4, 7);
          if (!seenDocs.has(docId)) {
            seenDocs.add(docId);
            if (!dToLines[docId]) dToLines[docId] = [];
            dToLines[docId].push(line);
          }
        }
      }
    }

    return { docsById: dMap, evById: eMap, evsByDocId: eByDoc, linesByKey: lMap, docToLinesMap: dToLines };
  }, [packet, currentVersionObj]);

  const openDocument = useCallback((docId: string, page = 1, evIds: string[] = []) => {
    setActiveDocId(docId);
    setActiveDocPage(page);
    setHighlightedEvIds(evIds);
  }, []);

  const closeDocument = useCallback(() => {
    setActiveDocId(null);
  }, []);

  // Reopen sign-offs for an area when an adjustment is made in that area
  const reopenAreaSignOffIfSigned = useCallback(
    (prevSignOffs: Record<WorkpaperAreaId, AreaSignOff>, areaId: WorkpaperAreaId, triggerDesc: string) => {
      const current = prevSignOffs[areaId];
      if (!current) return prevSignOffs;
      const anySigned =
        current.preparerSignOff.signed || current.reviewerSignOff.signed || current.partnerSignOff.signed;
      if (!anySigned) return prevSignOffs;

      return {
        ...prevSignOffs,
        [areaId]: {
          ...current,
          preparerSignOff: current.preparerSignOff.signed
            ? {
                ...current.preparerSignOff,
                signed: false,
                reopenedReason: `Reopened automatically: ${triggerDesc} by ${activeActor.name}`,
              }
            : current.preparerSignOff,
          reviewerSignOff: current.reviewerSignOff.signed
            ? {
                ...current.reviewerSignOff,
                signed: false,
                reopenedReason: `Reopened automatically: ${triggerDesc} by ${activeActor.name}`,
              }
            : current.reviewerSignOff,
          partnerSignOff: current.partnerSignOff.signed
            ? {
                ...current.partnerSignOff,
                signed: false,
                reopenedReason: `Reopened automatically: ${triggerDesc} by ${activeActor.name}`,
              }
            : current.partnerSignOff,
        },
      };
    },
    [activeActor.name]
  );

  const addAdjustment = useCallback(
    (adjInput: Omit<WorkpaperAdjustment, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'status'>) => {
      if (state.returnFrozenAtFiling && !state.amendingOnTopMode) {
        alert('Return is frozen at filing. Enable "Amend on Top (1040-X Mode)" to record post-filing adjustments.');
        return;
      }
      const lineObj = linesByKey[adjInput.lineKey];
      const areaId = mapFormToArea(lineObj?.form || 'F1040', adjInput.lineKey);

      const newAdj: WorkpaperAdjustment = {
        ...adjInput,
        id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        authorId: activeActor.id,
        authorName: activeActor.name,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      setState((prev) => ({
        ...prev,
        adjustments: [newAdj, ...prev.adjustments],
        areaSignOffs: reopenAreaSignOffIfSigned(prev.areaSignOffs, areaId, `Adjusted ${adjInput.lineKey}`),
      }));
    },
    [activeActor, linesByKey, reopenAreaSignOffIfSigned, state.returnFrozenAtFiling, state.amendingOnTopMode]
  );

  const toggleAdjustmentStatus = useCallback(
    (adjId: string) => {
      setState((prev) => {
        const target = prev.adjustments.find((a) => a.id === adjId);
        if (!target) return prev;
        const lineObj = linesByKey[target.lineKey];
        const areaId = mapFormToArea(lineObj?.form || 'F1040', target.lineKey);
        const nextStatus = target.status === 'active' ? 'reverted' : 'active';
        return {
          ...prev,
          adjustments: prev.adjustments.map((a) => (a.id === adjId ? { ...a, status: nextStatus } : a)),
          areaSignOffs: reopenAreaSignOffIfSigned(
            prev.areaSignOffs,
            areaId,
            `${nextStatus === 'reverted' ? 'Undid' : 'Re-applied'} adjustment on ${target.lineKey}`
          ),
        };
      });
    },
    [linesByKey, reopenAreaSignOffIfSigned]
  );

  const isFindingApplied = useCallback(
    (findingId: string) => {
      return state.adjustments.some((a) => a.findingId === findingId && a.status === 'active');
    },
    [state.adjustments]
  );

  const applyFindingAdjustment = useCallback(
    (finding: AuditFinding) => {
      if (isFindingApplied(finding.id)) return;
      const newAdj: WorkpaperAdjustment = {
        id: `adj-${finding.id}-${Date.now()}`,
        lineKey: finding.lineKey,
        lineLabel: finding.lineLabel,
        jurisdiction:
          finding.estimatedFedTaxEffect !== 0 && finding.estimatedCaTaxEffect !== 0
            ? 'both'
            : finding.estimatedCaTaxEffect !== 0
            ? 'california'
            : 'federal',
        originalValue: finding.engineValue,
        adjustedValue: finding.correctValue,
        delta: finding.dollarDelta,
        category: finding.taxEffectCategory,
        federalTaxEffect: finding.estimatedFedTaxEffect,
        californiaTaxEffect: finding.estimatedCaTaxEffect,
        reason: `[Audit Check #${finding.number}] ${finding.title}: ${finding.summary}`,
        authorId: activeActor.id,
        authorName: activeActor.name,
        createdAt: new Date().toISOString(),
        evidenceRefs: finding.evidenceRefs,
        findingId: finding.id,
        status: 'active',
      };

      setState((prev) => {
        // Also mark corresponding blocking review notes as addressed if they match the lineKey
        const updatedNotes = prev.reviewNotes.map((rn) =>
          rn.lineKey === finding.lineKey && rn.status === 'open'
            ? {
                ...rn,
                status: 'addressed' as const,
                resolvedAt: new Date().toISOString(),
                resolvedByName: activeActor.name,
                resolutionNote: `Resolved via Audit Check #${finding.number} adjustment.`,
              }
            : rn
        );
        return {
          ...prev,
          adjustments: [newAdj, ...prev.adjustments.filter((a) => a.findingId !== finding.id)],
          reviewNotes: updatedNotes,
          areaSignOffs: reopenAreaSignOffIfSigned(prev.areaSignOffs, finding.areaId, `Applied Check #${finding.number}`),
        };
      });
    },
    [activeActor, isFindingApplied, reopenAreaSignOffIfSigned]
  );

  const applyAllFindings = useCallback(() => {
    setState((prev) => {
      const existingFindingIds = new Set(
        prev.adjustments.filter((a) => a.status === 'active' && a.findingId).map((a) => a.findingId!)
      );
      const newAdjustments: WorkpaperAdjustment[] = [];
      let updatedSignOffs = { ...prev.areaSignOffs };

      for (const finding of INDEPENDENT_AUDIT_FINDINGS) {
        if (!existingFindingIds.has(finding.id)) {
          newAdjustments.push({
            id: `adj-${finding.id}-${Date.now()}`,
            lineKey: finding.lineKey,
            lineLabel: finding.lineLabel,
            jurisdiction:
              finding.estimatedFedTaxEffect !== 0 && finding.estimatedCaTaxEffect !== 0
                ? 'both'
                : finding.estimatedCaTaxEffect !== 0
                ? 'california'
                : 'federal',
            originalValue: finding.engineValue,
            adjustedValue: finding.correctValue,
            delta: finding.dollarDelta,
            category: finding.taxEffectCategory,
            federalTaxEffect: finding.estimatedFedTaxEffect,
            californiaTaxEffect: finding.estimatedCaTaxEffect,
            reason: `[Audit Check #${finding.number}] ${finding.title}: ${finding.summary}`,
            authorId: activeActor.id,
            authorName: activeActor.name,
            createdAt: new Date().toISOString(),
            evidenceRefs: finding.evidenceRefs,
            findingId: finding.id,
            status: 'active',
          });
          updatedSignOffs = reopenAreaSignOffIfSigned(
            updatedSignOffs,
            finding.areaId,
            `Bulk applied Check #${finding.number}`
          );
        }
      }

      const updatedNotes = prev.reviewNotes.map((rn) =>
        rn.status === 'open'
          ? {
              ...rn,
              status: 'addressed' as const,
              resolvedAt: new Date().toISOString(),
              resolvedByName: activeActor.name,
              resolutionNote: 'Addressed via bulk reconciliation pass.',
            }
          : rn
      );

      return {
        ...prev,
        adjustments: [...newAdjustments, ...prev.adjustments],
        reviewNotes: updatedNotes,
        areaSignOffs: updatedSignOffs,
      };
    });
  }, [activeActor, reopenAreaSignOffIfSigned]);

  const revertAllAdjustments = useCallback(() => {
    setState((prev) => ({
      ...prev,
      adjustments: prev.adjustments.map((a) => ({ ...a, status: 'reverted' as const })),
    }));
  }, []);

  const getEffectiveLineValue = useCallback(
    (lineKey: string) => {
      const FINDING_LINE_IMPACT_MAP: Record<string, Record<string, number>> = {
        'finding-01': {
          'F8949.B.N1': -19100,
          'F8949.B.N3': -19100,
          'F8949.E.N4': -9420,
          'SchD.2': -38200,
          'SchD.7': -38200,
          'SchD.9': -9420,
          'SchD.15': -9420,
          'SchD.16': -47620,
        },
        'finding-02': {
          'SchC.1': -12400,
          'SchC.31': -12400,
        },
        'finding-05': {
          'SchC.9': -2590,
          'SchC.28': -2590,
          'SchC.31': 2590,
        },
        'finding-10': {
          'F8949.H.C6': -3050,
          'SchD.3': -5325,
          'SchD.7': -5325,
          'SchD.15': 2275,
          'SchD.16': -3050,
        },
        'finding-11': {
          'SchC.25': -1308,
          'SchC.27a.1': -216,
          'SchC.28': -1524,
          'SchC.31': 1524,
        },
        'finding-14': {
          'SchD.8b': -60,
          'SchD.15': -60,
          'SchD.16': -60,
        },
      };

      const baseLine = linesByKey[lineKey];
      const original = baseLine ? baseLine.value : 0;

      const matchingAdjs = state.adjustments.filter((a) => {
        if (a.status !== 'active') return false;
        if (a.findingId && FINDING_LINE_IMPACT_MAP[a.findingId]) {
          return lineKey in FINDING_LINE_IMPACT_MAP[a.findingId] || a.lineKey === lineKey;
        }
        return a.lineKey === lineKey;
      });

      if (matchingAdjs.length === 0) {
        return { original, adjusted: original, hasAdjustment: false, activeAdjustments: [] };
      }

      if (typeof original === 'number') {
        const totalDelta = matchingAdjs.reduce((sum, a) => {
          if (a.findingId && FINDING_LINE_IMPACT_MAP[a.findingId]) {
            const mappedDelta = FINDING_LINE_IMPACT_MAP[a.findingId][lineKey];
            if (mappedDelta !== undefined) return sum + mappedDelta;
          }
          return a.lineKey === lineKey ? sum + a.delta : sum;
        }, 0);
        return {
          original,
          adjusted: Math.round((original + totalDelta) * 100) / 100,
          hasAdjustment: totalDelta !== 0,
          activeAdjustments: matchingAdjs,
        };
      }

      const latest = matchingAdjs[0];
      return {
        original,
        adjusted: latest.adjustedValue,
        hasAdjustment: true,
        activeAdjustments: matchingAdjs,
      };
    },
    [linesByKey, state.adjustments]
  );

  // Compute live summary totals incorporating active adjustments & active What-Ifs
  const liveSummary = useMemo(() => {
    if (!currentVersionObj || !packet) {
      return {
        federal: { agi: 0, taxable_income: 0, total_tax: 0, payments: 0, balance_due: 0, penalty: 0, taxDelta: 0 },
        california: { total_agi: 0, ca_agi: 0, total_tax: 0, payments: 0, balance_due: 0, penalty: 0, taxDelta: 0 },
      };
    }

    const baseFed = currentVersionObj.summary.federal;
    const baseCa = currentVersionObj.summary.california;

    let fedTaxDelta = 0;
    let caTaxDelta = 0;
    let fedAgiDelta = 0;
    let caSourceDelta = 0;
    let fedPaymentsDelta = 0;
    let caPaymentsDelta = 0;
    let fedPenaltyDelta = 0;

    for (const adj of state.adjustments) {
      if (adj.status !== 'active') continue;
      if (adj.category === 'payment_federal') {
        fedPaymentsDelta += adj.delta;
      } else if (adj.category === 'payment_california') {
        caPaymentsDelta += adj.delta;
      } else {
        fedTaxDelta += adj.federalTaxEffect;
        caTaxDelta += adj.californiaTaxEffect;
        if (adj.category === 'ca_source_income') {
          caSourceDelta += adj.delta;
        } else if (adj.category === 'adjustment') {
          fedAgiDelta -= adj.delta; // e.g., removing 14,400 SEHI adjustment increases AGI by +14,400
        } else if (['wages', 'interest', 'schc_profit', 'stcg', 'ltcg', 'ordinary_income'].includes(adj.category)) {
          fedAgiDelta += adj.delta;
        }
      }
    }

    // Also include active What-Ifs
    for (const wifId of state.activeWhatIfIds) {
      const wif = packet.what_if.alternatives.find((w) => w.id === wifId);
      if (wif) {
        fedTaxDelta += wif.federal.total_tax_change || 0;
        caTaxDelta += wif.california.total_tax_change || 0;
        fedPenaltyDelta += wif.federal.penalty_change || 0;
      }
    }

    const totalFedTax = Math.round(baseFed.total_tax + fedTaxDelta);
    const totalFedPayments = Math.round(baseFed.payments + fedPaymentsDelta);
    const totalCaTax = Math.round(baseCa.total_tax + caTaxDelta);
    const totalCaPayments = Math.round(baseCa.payments + caPaymentsDelta);

    return {
      federal: {
        agi: Math.round(baseFed.agi + fedAgiDelta),
        taxable_income: Math.round(baseFed.taxable_income + fedAgiDelta),
        total_tax: totalFedTax,
        payments: totalFedPayments,
        balance_due: totalFedTax - totalFedPayments,
        penalty: Math.max(0, Math.round(baseFed.penalty + fedPenaltyDelta)),
        taxDelta: Math.round(fedTaxDelta),
      },
      california: {
        total_agi: Math.round(baseCa.total_agi + fedAgiDelta),
        ca_agi: Math.round(baseCa.ca_agi + caSourceDelta),
        total_tax: totalCaTax,
        payments: totalCaPayments,
        balance_due: totalCaTax - totalCaPayments,
        penalty: baseCa.penalty,
        taxDelta: Math.round(caTaxDelta),
      },
    };
  }, [currentVersionObj, packet, state.adjustments, state.activeWhatIfIds]);

  const stampVerification = useCallback(
    (lineKey: string, type: VerificationType, note?: string, refs: string[] = []) => {
      setState((prev) => ({
        ...prev,
        verifications: {
          ...prev.verifications,
          [lineKey]: {
            lineKey,
            type,
            verifiedById: activeActor.id,
            verifiedByName: activeActor.name,
            verifiedAt: new Date().toISOString(),
            note,
            evidenceRefs: refs,
          },
        },
      }));
    },
    [activeActor]
  );

  const bulkStampVerification = useCallback(
    (lineKeys: string[], type: VerificationType, note?: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const next = { ...prev.verifications };
        for (const k of lineKeys) {
          next[k] = {
            lineKey: k,
            type,
            verifiedById: activeActor.id,
            verifiedByName: activeActor.name,
            verifiedAt: now,
            note: note || 'Bulk verified lot detail against broker 1099-B.',
            evidenceRefs: linesByKey[k]?.sources || [],
          };
        }
        return { ...prev, verifications: next };
      });
    },
    [activeActor, linesByKey]
  );

  const addReviewNote = useCallback(
    (noteInput: Omit<ReviewNote, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'status'>) => {
      const newNote: ReviewNote = {
        ...noteInput,
        id: `rn-${Date.now()}`,
        authorId: activeActor.id,
        authorName: activeActor.name,
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      setState((prev) => ({
        ...prev,
        reviewNotes: [newNote, ...prev.reviewNotes],
      }));
    },
    [activeActor]
  );

  const updateReviewNoteStatus = useCallback(
    (id: string, status: 'open' | 'addressed' | 'cleared', resolutionNote?: string) => {
      setState((prev) => ({
        ...prev,
        reviewNotes: prev.reviewNotes.map((rn) =>
          rn.id === id
            ? {
                ...rn,
                status,
                resolvedAt: status !== 'open' ? new Date().toISOString() : undefined,
                resolvedByName: status !== 'open' ? activeActor.name : undefined,
                resolutionNote: resolutionNote ?? rn.resolutionNote,
              }
            : rn
        ),
      }));
    },
    [activeActor.name]
  );

  const toggleAreaSignOff = useCallback(
    (areaId: WorkpaperAreaId, level: 'preparer' | 'reviewer' | 'partner') => {
      // Enforce role permissions & blocking notes check
      if (level === 'reviewer' && !['reviewer', 'partner', 'quality_reviewer'].includes(activeActor.role)) {
        alert('Role Enforced: Only a Reviewer or Partner can sign off at the Reviewer level. Switch role in the top bar.');
        return;
      }
      if (level === 'partner' && activeActor.role !== 'partner') {
        alert('Role Enforced: Only a Partner (Helen Strand) can sign off at the Partner level. Switch role in the top bar.');
        return;
      }

      const openBlockingInArea = state.reviewNotes.filter(
        (rn) => rn.areaId === areaId && rn.severity === 'blocking' && rn.status === 'open'
      );
      const currentSignOff = state.areaSignOffs[areaId];
      const fieldKey =
        level === 'preparer' ? 'preparerSignOff' : level === 'reviewer' ? 'reviewerSignOff' : 'partnerSignOff';
      const isCurrentlySigned = currentSignOff[fieldKey].signed;

      if (!isCurrentlySigned && openBlockingInArea.length > 0 && level !== 'preparer') {
        alert(
          `Cannot complete ${level.toUpperCase()} sign-off while ${openBlockingInArea.length} blocking review note(s) remain OPEN in this area.`
        );
        return;
      }

      setState((prev) => {
        const areaObj = prev.areaSignOffs[areaId];
        const target = areaObj[fieldKey];
        return {
          ...prev,
          areaSignOffs: {
            ...prev.areaSignOffs,
            [areaId]: {
              ...areaObj,
              [fieldKey]: {
                signed: !target.signed,
                byId: !target.signed ? activeActor.id : undefined,
                byName: !target.signed ? activeActor.name : undefined,
                at: !target.signed ? new Date().toISOString() : undefined,
                reopenedReason: undefined,
              },
            },
          },
        };
      });
    },
    [activeActor, state.reviewNotes, state.areaSignOffs]
  );

  const updateAreaHours = useCallback((areaId: WorkpaperAreaId, hours: number) => {
    setState((prev) => ({
      ...prev,
      areaSignOffs: {
        ...prev.areaSignOffs,
        [areaId]: {
          ...prev.areaSignOffs[areaId],
          actualHours: hours,
        },
      },
    }));
  }, []);

  const addClientQuestion = useCallback(
    (areaId: WorkpaperAreaId, question: string, lineKey?: string) => {
      const newQ: ClientQuestionItem = {
        id: `cq-${Date.now()}`,
        areaId,
        lineKey,
        question,
        askedById: activeActor.id,
        askedByName: activeActor.name,
        askedAt: new Date().toISOString(),
        status: 'pending_client',
      };
      setState((prev) => ({
        ...prev,
        clientQuestions: [newQ, ...prev.clientQuestions],
      }));
    },
    [activeActor]
  );

  const addJudgment = useCallback(
    (jInput: Omit<JudgmentElectionRecord, 'id' | 'documentedBy' | 'documentedAt'>) => {
      const newJ: JudgmentElectionRecord = {
        ...jInput,
        id: `judg-${Date.now()}`,
        documentedBy: activeActor.name,
        documentedAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        judgments: [newJ, ...prev.judgments],
      }));
    },
    [activeActor.name]
  );

  const toggleUnmaskField = useCallback(
    (fieldKey: string, actionType: SensitiveDataLogEntry['action'] = 'unmasked_ssn') => {
      if (!activeActor.sensitiveClearance) {
        alert(
          `Access Denied: Role "${activeActor.role}" (${activeActor.name}) does not have sensitive_data_clearance to unmask SSNs or bank account numbers.`
        );
        return;
      }
      setUnmaskedFields((prev) => {
        const nextVal = !prev[fieldKey];
        if (nextVal) {
          // Record view log
          setState((s) => ({
            ...s,
            sensitiveLogs: [
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actorId: activeActor.id,
                actorName: activeActor.name,
                actorRole: activeActor.role,
                targetField: fieldKey,
                action: actionType,
              },
              ...s.sensitiveLogs,
            ],
          }));
        }
        return { ...prev, [fieldKey]: nextVal };
      });
    },
    [activeActor]
  );

  const toggleWhatIf = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.activeWhatIfIds.includes(id);
      return {
        ...prev,
        activeWhatIfIds: exists ? prev.activeWhatIfIds.filter((x) => x !== id) : [...prev.activeWhatIfIds, id],
      };
    });
  }, []);

  const markLineChangeSeen = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      seenLineChanges: { ...prev.seenLineChanges, [key]: true },
    }));
  }, []);

  const markAllChangesSeen = useCallback(() => {
    if (!currentVersionObj) return;
    const next: Record<string, boolean> = { ...state.seenLineChanges };
    for (const ch of currentVersionObj.changes_from_previous) {
      next[ch.key] = true;
    }
    setState((prev) => ({ ...prev, seenLineChanges: next }));
  }, [currentVersionObj, state.seenLineChanges]);

  const resetWorkpaperToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const exportWorkpaperState = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: activeActor,
      client: packet?.packet,
      liveSummary,
      workpaperState: state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Miraflores_Workpaper_${packet?.packet.client_id || 'CL-20417'}_2025.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeActor, packet, liveSummary, state]);

  return (
    <WorkpaperContext.Provider
      value={{
        packet,
        loading,
        activeActor,
        setActiveActorId: (id) => setState((prev) => ({ ...prev, activeActorId: id })),
        selectedVersion: state.selectedVersion,
        setSelectedVersion: (v) => setState((prev) => ({ ...prev, selectedVersion: v })),
        timelineCursorIndex: state.timelineCursorIndex,
        setTimelineCursorIndex: (idx) =>
          setState((prev) => ({
            ...prev,
            timelineCursorIndex: idx,
            returnFrozenAtFiling: idx >= 22, // tl-23 efile_accepted_federal freezes the filed return
          })),
        activeDocId,
        activeDocPage,
        highlightedEvIds,
        openDocument,
        closeDocument,
        inspectedLineKey,
        setInspectedLineKey,
        docsById,
        evById,
        evsByDocId,
        linesByKey,
        docToLinesMap,
        adjustments: state.adjustments,
        addAdjustment,
        toggleAdjustmentStatus,
        applyFindingAdjustment,
        applyAllFindings,
        revertAllAdjustments,
        isFindingApplied,
        getEffectiveLineValue,
        liveSummary,
        verifications: state.verifications,
        stampVerification,
        bulkStampVerification,
        reviewNotes: state.reviewNotes,
        addReviewNote,
        updateReviewNoteStatus,
        areaSignOffs: state.areaSignOffs,
        toggleAreaSignOff,
        updateAreaHours,
        clientQuestions: state.clientQuestions,
        addClientQuestion,
        judgments: state.judgments,
        addJudgment,
        unmaskedFields,
        toggleUnmaskField,
        sensitiveLogs: state.sensitiveLogs,
        activeWhatIfIds: state.activeWhatIfIds,
        toggleWhatIf,
        form8867Completed: state.form8867Completed,
        setForm8867Completed: (v) => setState((prev) => ({ ...prev, form8867Completed: v })),
        returnFrozenAtFiling: state.returnFrozenAtFiling,
        setReturnFrozenAtFiling: (v) => setState((prev) => ({ ...prev, returnFrozenAtFiling: v })),
        amendingOnTopMode: state.amendingOnTopMode,
        setAmendingOnTopMode: (v) => setState((prev) => ({ ...prev, amendingOnTopMode: v })),
        seenLineChanges: state.seenLineChanges,
        markLineChangeSeen,
        markAllChangesSeen,
        resetWorkpaperToDefault,
        exportWorkpaperState,
      }}
    >
      {children}
    </WorkpaperContext.Provider>
  );
};

export function useWorkpaper() {
  const ctx = useContext(WorkpaperContext);
  if (!ctx) throw new Error('useWorkpaper must be used inside WorkpaperProvider');
  return ctx;
}
