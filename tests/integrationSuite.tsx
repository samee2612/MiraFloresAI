import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PacketData, WorkpaperAreaId } from '../src/types';
import {
  WORKPAPER_AREAS,
  INDEPENDENT_AUDIT_FINDINGS,
  INITIAL_JUDGMENT_ELECTIONS,
} from '../src/engine/reconciliationEngine';
import { WorkpaperProvider, useWorkpaper } from '../src/store/workpaperStore';
import { OverviewWorkspace } from '../src/components/workspaces/OverviewWorkspace';
import { SchedulesWorkspace } from '../src/components/workspaces/SchedulesWorkspace';
import { DocumentIndexWorkspace } from '../src/components/workspaces/DocumentIndexWorkspace';
import { WhatIfAndVersionsWorkspace } from '../src/components/workspaces/WhatIfAndVersionsWorkspace';
import { WorkflowAndFilingWorkspace } from '../src/components/workspaces/WorkflowAndFilingWorkspace';
import { DocumentViewerDrawer } from '../src/components/DocumentViewerDrawer';
import { LineTraceModal } from '../src/components/LineTraceModal';

// Setup mock browser globals for Node environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] ?? null,
  setItem: (k: string, v: string) => {
    mockStorage[k] = v;
  },
  removeItem: (k: string) => {
    delete mockStorage[k];
  },
};
const alertsTriggered: string[] = [];
(globalThis as any).alert = (msg: string) => {
  alertsTriggered.push(msg);
};
(globalThis as any).window = {
  location: { reload: () => {} },
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runIntegrationSuite() {
  console.log('================================================================================');
  console.log('🧪 MIRAFLORES TAX WORKPAPER — END-TO-END INTEGRATION TEST SUITE');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: Packet Data & Cross-Reference Graph Integrity
  // ---------------------------------------------------------------------------
  console.log('📦 [Suite 1] Packet Data & Bi-Directional Evidence Graph Integrity');
  const packetPath = path.resolve(process.cwd(), 'public/packet.json');
  const raw = fs.readFileSync(packetPath, 'utf-8');
  const packet: PacketData = JSON.parse(raw);

  assert(packet.packet.client_id === 'CL-20417', 'Packet client_id is CL-20417 (Okafor-Lindqvist)');
  assert(packet.documents.length === 74, `Packet contains all 74 documents (got ${packet.documents.length})`);
  assert(
    packet.extracted_values.length === 3012,
    `Packet contains all 3,012 extracted values (got ${packet.extracted_values.length})`
  );
  assert(packet.return_versions.length === 3, 'Packet contains all 3 return versions (v1, v2, v3)');
  assert(packet.timeline.length === 29, `Packet contains all 29 timeline events (got ${packet.timeline.length})`);
  assert(
    packet.what_if.alternatives.length === 5,
    `Packet contains all 5 engine What-If scenarios (got ${packet.what_if.alternatives.length})`
  );

  const docIds = new Set(packet.documents.map((d) => d.id));
  const v3 = packet.return_versions[2];

  // Verify every extracted value points to a valid document
  let allEvDocsValid = true;
  for (const ev of packet.extracted_values) {
    if (!docIds.has(ev.document_id)) {
      allEvDocsValid = false;
      break;
    }
  }
  assert(allEvDocsValid, 'All 3,012 extracted_values reference valid document IDs (D01..D74)');

  // Verify all 16 Independent Audit Findings reference valid areas and evidence
  assert(
    INDEPENDENT_AUDIT_FINDINGS.length === 16,
    `Reconciliation engine defines all 16 planted errors (got ${INDEPENDENT_AUDIT_FINDINGS.length})`
  );
  const validAreaIds = new Set(WORKPAPER_AREAS.map((a) => a.id));
  let allFindingsValid = true;
  for (const finding of INDEPENDENT_AUDIT_FINDINGS) {
    if (!validAreaIds.has(finding.areaId)) {
      allFindingsValid = false;
    }
    if (!finding.evidenceRefs || finding.evidenceRefs.length === 0) {
      allFindingsValid = false;
    }
  }
  assert(allFindingsValid, 'All 16 AuditFinding records link to valid WorkpaperAreaId and non-empty evidenceRefs');
  assert(
    INITIAL_JUDGMENT_ELECTIONS.length === 5,
    `Initial statutory judgments & elections populated (${INITIAL_JUDGMENT_ELECTIONS.length} records)`
  );

  // Verify 302 Form 8949 lots exist in v3
  const f8949Lines = v3.lines.filter((l) => l.form === 'F8949');
  assert(
    f8949Lines.length === 302,
    `v3 return contains all 302 Form 8949 capital asset lots (got ${f8949Lines.length})`
  );

  // Verify 9 depreciation assets exist in v3
  assert(v3.assets.length === 9, `v3 return contains all 9 depreciation assets (got ${v3.assets.length})`);

  // ---------------------------------------------------------------------------
  // SUITE 2: Full Component Tree Rendering Across All 5 Workspaces & 10 Areas
  // ---------------------------------------------------------------------------
  console.log('\n🖥️  [Suite 2] Full React Component Rendering Across Workspaces, Schedules & Modals');

  // 2.1 OverviewWorkspace
  const overviewHtml = renderToStaticMarkup(
    <WorkpaperProvider initialPacket={packet}>
      <OverviewWorkspace />
    </WorkpaperProvider>
  );
  assert(overviewHtml.includes('$445,590'), 'OverviewWorkspace renders v3 Federal AGI ($445,590)');
  assert(overviewHtml.includes('$81,962'), 'OverviewWorkspace renders v3 Federal Total Tax ($81,962)');
  assert(overviewHtml.includes('$18,874'), 'OverviewWorkspace renders v3 California Total Tax ($18,874)');
  assert(
    overviewHtml.includes('Corvane RSU Basis Omitted on Form 8949 ($47,620 Double-Taxed)'),
    'OverviewWorkspace surfaces Finding #1 (Corvane RSU $47,620 basis omission)'
  );
  assert(
    overviewHtml.includes('Schedule C Gross Receipts Double-Counts Form 1099-K ($12,400)'),
    'OverviewWorkspace surfaces Finding #2 (Schedule C $12,400 Paywell 1099-K double-count)'
  );
  assert(
    overviewHtml.includes('California Wage Over-Sourcing on Halvorsen W-2 ($88,831)'),
    'OverviewWorkspace surfaces Finding #3 (California $88,831 wage over-sourcing)'
  );
  assert(
    overviewHtml.includes('•••-••-3309') && overviewHtml.includes('Click eye icon to unmask (logged)'),
    'OverviewWorkspace masks household SSNs by default with logged unmask control'
  );

  // 2.2 SchedulesWorkspace across all 10 CPA Areas
  const areaExpectations: Array<{ areaId: WorkpaperAreaId; expectedText: string }> = [
    { areaId: 'business', expectedText: 'QuickBooks P&amp;L Cash Revenue (D14)' },
    { areaId: 'wages_and_stock_compensation', expectedText: 'Corvane Systems' },
    { areaId: 'investments_and_digital_assets', expectedText: 'F8949.B.N1' },
    { areaId: 'investments_and_digital_assets', expectedText: 'F8949.D.M18 (OMITTED)' },
    { areaId: 'rentals_and_sale', expectedText: '1450 Fremont Way' },
    { areaId: 'pass_throughs_and_basis', expectedText: 'Lindqvist Family Woodworks' },
    { areaId: 'retirement_and_foreign', expectedText: 'Backdoor Roth IRA (Form 8606)' },
    { areaId: 'deductions_and_credits', expectedText: 'Form 8867 Paid Preparer' },
    { areaId: 'california', expectedText: '195 CA Days / 170 TX Days' },
    { areaId: 'payments_and_filing', expectedText: 'Estimated Payments &amp; Form 2210 Penalty' },
    { areaId: 'intake_and_engagement', expectedText: 'Form 1040 Summary' },
  ];

  for (const { areaId, expectedText } of areaExpectations) {
    const html = renderToStaticMarkup(
      <WorkpaperProvider initialPacket={packet}>
        <SchedulesWorkspace initialArea={areaId} />
      </WorkpaperProvider>
    );
    assert(
      html.includes(expectedText),
      `SchedulesWorkspace [${areaId}] renders domain schedule containing "${expectedText}"`
    );
  }

  // 2.3 DocumentIndexWorkspace
  const docIndexHtml = renderToStaticMarkup(
    <WorkpaperProvider initialPacket={packet}>
      <DocumentIndexWorkspace />
    </WorkpaperProvider>
  );
  assert(
    docIndexHtml.includes('D01') && docIndexHtml.includes('D74'),
    'DocumentIndexWorkspace renders D01 through D74'
  );
  assert(
    docIndexHtml.includes('FinCEN Form 114 (FBAR)'),
    'DocumentIndexWorkspace renders Outside Filings tracker (FBAR)'
  );

  // 2.4 WhatIfAndVersionsWorkspace
  const whatIfHtml = renderToStaticMarkup(
    <WorkpaperProvider initialPacket={packet}>
      <WhatIfAndVersionsWorkspace />
    </WorkpaperProvider>
  );
  assert(
    whatIfHtml.includes('equipment_section179') &&
      whatIfHtml.includes('hvac_improvement') &&
      whatIfHtml.includes('APRIL 14 EXTENSION ESTIMATE'),
    'WhatIfAndVersionsWorkspace renders all 5 engine What-If scenarios + April 14 Extension Estimate'
  );
  assert(
    whatIfHtml.includes('Version Comparison (v1 → v2 → v3)') && whatIfHtml.includes('F7203.excess'),
    'WhatIfAndVersionsWorkspace renders v1 → v2 → v3 version comparison table'
  );

  // 2.5 WorkflowAndFilingWorkspace
  const workflowHtml = renderToStaticMarkup(
    <WorkpaperProvider initialPacket={packet}>
      <WorkflowAndFilingWorkspace />
    </WorkpaperProvider>
  );
  assert(
    workflowHtml.includes('R0000-504-02'),
    'WorkflowAndFilingWorkspace renders e-file rejection code R0000-504-02 tracker'
  );
  assert(
    workflowHtml.includes('IRS NOTICE N-2025-L566') &&
      workflowHtml.includes('Self-Contained IRS Correspondence Examination Defense Record (D72)'),
    'WorkflowAndFilingWorkspace renders self-contained 2028 IRS Letter 566 Examination Defense Dossier'
  );

  // 2.6 DocumentViewerDrawer
  const drawerHtml = renderToStaticMarkup(
    <WorkpaperProvider initialPacket={packet}>
      <DocumentViewerDrawer />
    </WorkpaperProvider>
  );
  assert(
    drawerHtml.includes('D15') && drawerHtml.includes('Paywell') && drawerHtml.includes('Atlas Outdoor Gear'),
    'DocumentViewerDrawer renders simulated source document D15 Page 3 with verbatim printed_content'
  );

  // ---------------------------------------------------------------------------
  // SUITE 3: Interactive State Transitions, Live Tax Math & Governance Rules
  // ---------------------------------------------------------------------------
  console.log('\n⚙️  [Suite 3] Interactive Store Mutations, Live Tax Recomputation & Governance Rules');

  const DummyChild: React.FC = () => null;

  function createStoreHarness(initialPacket: PacketData) {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    alertsTriggered.length = 0;

    const stateSlots: any[] = [];
    let cursor = 0;

    const origUseState = React.useState;
    const origUseEffect = React.useEffect;
    const origUseMemo = React.useMemo;
    const origUseCallback = React.useCallback;

    let capturedContextValue: any = null;

    function renderPass() {
      cursor = 0;
      const element = WorkpaperProvider({
        initialPacket,
        children: React.createElement(DummyChild),
      });
      if (element && (element as any).props && (element as any).props.value) {
        capturedContextValue = (element as any).props.value;
      }
      return capturedContextValue as ReturnType<typeof useWorkpaper>;
    }

    (React as any).useState = (init: any) => {
      const idx = cursor++;
      if (!(idx in stateSlots)) {
        stateSlots[idx] = typeof init === 'function' ? init() : init;
      }
      const setter = (updater: any) => {
        const next = typeof updater === 'function' ? updater(stateSlots[idx]) : updater;
        stateSlots[idx] = next;
      };
      return [stateSlots[idx], setter];
    };
    (React as any).useEffect = (fn: any) => {
      fn();
    };
    (React as any).useMemo = (fn: any) => fn();
    (React as any).useCallback = (fn: any) => fn;

    const getCtx = () => renderPass();
    const restore = () => {
      (React as any).useState = origUseState;
      (React as any).useEffect = origUseEffect;
      (React as any).useMemo = origUseMemo;
      (React as any).useCallback = origUseCallback;
    };

    return { getCtx, restore };
  }

  const harness = createStoreHarness(packet);
  try {
    let ctx = harness.getCtx();

    // 3.1 Verify initial baseline v3 totals
    assert(
      ctx.liveSummary.federal.total_tax === 81962 && ctx.liveSummary.california.total_tax === 18874,
      `Initial liveSummary matches v3 baseline ($81,962 Federal tax, $18,874 CA tax)`
    );

    // 3.2 Apply Finding #1 (Corvane RSU basis omission -$47,620 -> updates F8949.B.N1, N3, N4, SchD.2, SchD.9, SchD.16)
    const finding01 = INDEPENDENT_AUDIT_FINDINGS.find((f) => f.id === 'finding-01')!;
    ctx.applyFindingAdjustment(finding01);
    ctx = harness.getCtx();

    assert(ctx.isFindingApplied('finding-01') === true, 'applyFindingAdjustment marks finding-01 as applied');

    const lotN1 = ctx.getEffectiveLineValue('F8949.B.N1');
    const lotN3 = ctx.getEffectiveLineValue('F8949.B.N3');
    const lotN4 = ctx.getEffectiveLineValue('F8949.E.N4');
    const schD16 = ctx.getEffectiveLineValue('SchD.16');
    assert(
      lotN1.adjusted === 140 && lotN3.adjusted === -620 && lotN4.adjusted === 5880 && schD16.adjusted === 137407,
      `Applying finding-01 updates RSU lots N1 ($140), N3 (-$620), N4 ($5,880) and SchD.16 ($185,027 -> $137,407)`
    );
    assert(
      ctx.liveSummary.federal.total_tax === 81962 + finding01.estimatedFedTaxEffect,
      `Federal total tax updates by ${finding01.estimatedFedTaxEffect} to $${ctx.liveSummary.federal.total_tax}`
    );

    const rn01 = ctx.reviewNotes.find((r) => r.id === 'rn-01')!;
    assert(
      rn01.status === 'addressed',
      'Applying finding-01 automatically transitions blocking review note rn-01 from open -> addressed'
    );

    // 3.3 Auto-Reopening Sign-Offs when an underlying line changes
    assert(
      ctx.areaSignOffs.pass_throughs_and_basis.preparerSignOff.signed === true &&
        ctx.areaSignOffs.pass_throughs_and_basis.reviewerSignOff.signed === true,
      'Area pass_throughs_and_basis starts with both Preparer and Reviewer sign-offs active'
    );

    ctx.addAdjustment({
      lineKey: 'SchE.28B',
      lineLabel: 'Schedule E - Harborview K-1 ordinary income',
      jurisdiction: 'federal',
      originalValue: 38400,
      adjustedValue: 38000,
      delta: -400,
      category: 'ordinary_income',
      federalTaxEffect: -128,
      californiaTaxEffect: 0,
      reason: 'Test adjustment to verify sign-off auto-reopen',
      evidenceRefs: ['D38'],
    });
    ctx = harness.getCtx();

    assert(
      ctx.areaSignOffs.pass_throughs_and_basis.preparerSignOff.signed === false &&
        ctx.areaSignOffs.pass_throughs_and_basis.reviewerSignOff.signed === false &&
        Boolean(ctx.areaSignOffs.pass_throughs_and_basis.reviewerSignOff.reopenedReason?.includes('Reopened automatically')),
      'Adjusting a line in pass_throughs_and_basis automatically reopens Preparer & Reviewer sign-offs with audit reason'
    );

    // 3.4 Role-Based Access Control (Preparer cannot sign Reviewer or Partner)
    alertsTriggered.length = 0;
    ctx.toggleAreaSignOff('rentals_and_sale', 'reviewer');
    ctx = harness.getCtx();
    assert(
      ctx.areaSignOffs.rentals_and_sale.reviewerSignOff.signed === false &&
        alertsTriggered.some((a) => a.includes('Role Enforced')),
      'Preparer (Priya Raman) is blocked from signing off at the Reviewer level'
    );

    // Switch to Reviewer (Daniel Ortiz, st-02)
    ctx.setActiveActorId('st-02');
    ctx = harness.getCtx();
    assert(
      ctx.activeActor.name === 'Daniel Ortiz' && ctx.activeActor.role === 'reviewer',
      'Role switcher changes active actor to Daniel Ortiz (Reviewer)'
    );

    // Reviewer blocked from signing 'business' while blocking review note rn-02 is still open
    alertsTriggered.length = 0;
    ctx.toggleAreaSignOff('business', 'reviewer');
    ctx = harness.getCtx();
    assert(
      ctx.areaSignOffs.business.reviewerSignOff.signed === false &&
        alertsTriggered.some((a) => a.includes('blocking review note')),
      'Reviewer is blocked from signing off on Business area while blocking review note rn-02 is OPEN'
    );

    // Reviewer CAN sign off on 'rentals_and_sale' (which has 0 open blocking notes)
    ctx.toggleAreaSignOff('rentals_and_sale', 'reviewer');
    ctx = harness.getCtx();
    assert(
      ctx.areaSignOffs.rentals_and_sale.reviewerSignOff.signed === true &&
        ctx.areaSignOffs.rentals_and_sale.reviewerSignOff.byName === 'Daniel Ortiz',
      'Reviewer successfully signs off on Rentals & Sale area when no blocking review notes are open'
    );

    // 3.5 Bulk Apply All 16 Findings & Verify Schedule C & Review Notes
    ctx.applyAllFindings();
    ctx = harness.getCtx();
    const all16Applied = INDEPENDENT_AUDIT_FINDINGS.every((f) => ctx.isFindingApplied(f.id));
    assert(all16Applied, 'applyAllFindings() applies all 16 independent audit checks');
    const openBlockingNotes = ctx.reviewNotes.filter((rn) => rn.severity === 'blocking' && rn.status === 'open');
    assert(openBlockingNotes.length === 0, 'applyAllFindings() transitions all blocking review notes to addressed');

    // Verify Schedule C lines tie out after findings 2, 5, and 11 are applied
    assert(
      ctx.getEffectiveLineValue('SchC.1').adjusted === 151300 &&
        ctx.getEffectiveLineValue('SchC.9').adjusted === 5670 &&
        ctx.getEffectiveLineValue('SchC.25').adjusted === 2172 &&
        ctx.getEffectiveLineValue('SchC.27a.1').adjusted === 6634 &&
        ctx.getEffectiveLineValue('SchC.31').adjusted === 73568,
      'Schedule C Gross Receipts ($151,300), Mileage ($5,670), Utilities ($2,172), Software ($6,634) & Net Profit ($73,568) tie out'
    );

    // Now Reviewer can sign off on 'business'
    ctx.toggleAreaSignOff('business', 'reviewer');
    ctx = harness.getCtx();
    assert(
      ctx.areaSignOffs.business.reviewerSignOff.signed === true,
      'Reviewer can sign off on Business area once blocking review notes are addressed'
    );

    // 3.6 Sensitive Data Clearance & Audit Logging
    ctx.setActiveActorId('st-05'); // Jo Kimura (Firm Admin, sensitiveClearance: false)
    ctx = harness.getCtx();
    alertsTriggered.length = 0;
    const prevLogCount = ctx.sensitiveLogs.length;
    ctx.toggleUnmaskField('household_ssns', 'unmasked_ssn');
    ctx = harness.getCtx();
    assert(
      !ctx.unmaskedFields['household_ssns'] &&
        ctx.sensitiveLogs.length === prevLogCount &&
        alertsTriggered.some((a) => a.includes('Access Denied')),
      'Firm Administrator (sensitiveClearance=false) is denied access to unmask SSNs'
    );

    // Switch to Partner (Helen Strand, st-03, sensitiveClearance: true)
    ctx.setActiveActorId('st-03');
    ctx = harness.getCtx();
    ctx.toggleUnmaskField('household_ssns', 'unmasked_ssn');
    ctx = harness.getCtx();
    assert(
      ctx.unmaskedFields['household_ssns'] === true &&
        ctx.sensitiveLogs.length === prevLogCount + 1 &&
        ctx.sensitiveLogs[0].actorName === 'Helen Strand',
      'Partner (sensitiveClearance=true) unmasks SSNs and records immutable entry in sensitiveLogs'
    );

    // 3.7 Bulk Verification of 8949 Lots
    const sampleLotKeys = ['F8949.B.N1', 'F8949.A.N2', 'F8949.B.N3'];
    ctx.bulkStampVerification(sampleLotKeys, 'agreed_to_source', 'Agreed to Northlake 1099-B & D11');
    ctx = harness.getCtx();
    assert(
      sampleLotKeys.every((k) => ctx.verifications[k]?.type === 'agreed_to_source'),
      'bulkStampVerification stamps multiple Form 8949 lots simultaneously'
    );

    // 3.8 Freeze at Filing & Amend on Top (1040-X Mode)
    ctx.setTimelineCursorIndex(22); // tl-23 efile_accepted_federal
    ctx = harness.getCtx();
    assert(
      ctx.returnFrozenAtFiling === true,
      'Advancing timeline cursor to e-file acceptance (index 22) automatically freezes return at filing'
    );

    alertsTriggered.length = 0;
    const adjCountBeforeFrozen = ctx.adjustments.length;
    ctx.addAdjustment({
      lineKey: 'SchB.1.1',
      lineLabel: 'Interest test',
      jurisdiction: 'federal',
      originalValue: 5000,
      adjustedValue: 4000,
      delta: -1000,
      category: 'interest',
      federalTaxEffect: -320,
      californiaTaxEffect: 0,
      reason: 'Should be blocked while frozen',
      evidenceRefs: ['D27'],
    });
    ctx = harness.getCtx();
    assert(
      ctx.adjustments.length === adjCountBeforeFrozen &&
        alertsTriggered.some((a) => a.includes('Return is frozen at filing')),
      'Adjustments are blocked when return is frozen at filing unless Amend-on-Top mode is enabled'
    );

    // Enable Amend-on-Top (1040-X mode) and verify adjustment succeeds
    ctx.setAmendingOnTopMode(true);
    ctx = harness.getCtx();
    ctx.addAdjustment({
      lineKey: 'SchB.1.1',
      lineLabel: 'Post-filing 1040-X amendment test',
      jurisdiction: 'federal',
      originalValue: 5000,
      adjustedValue: 4000,
      delta: -1000,
      category: 'interest',
      federalTaxEffect: -320,
      californiaTaxEffect: 0,
      reason: 'Allowed under 1040-X mode',
      evidenceRefs: ['D27'],
    });
    ctx = harness.getCtx();
    assert(
      ctx.adjustments.length === adjCountBeforeFrozen + 1,
      'Enabling Amend-on-Top (1040-X Mode) allows post-filing adjustments layered on top of frozen return'
    );

    // 3.9 Verify localStorage Persistence Round-Trip
    const persistedJson = mockStorage['miraflores_workpaper_state_v1'];
    const parsedPersisted = JSON.parse(persistedJson);
    assert(
      Boolean(persistedJson) &&
        parsedPersisted.activeActorId === 'st-03' &&
        parsedPersisted.amendingOnTopMode === true &&
        parsedPersisted.adjustments.length === adjCountBeforeFrozen + 1,
      'All workpaper state changes automatically persist to localStorage (miraflores_workpaper_state_v1)'
    );
  } finally {
    harness.restore();
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: LineTraceModal Inspection, OCR Discrepancy & Production Build Verification
  // ---------------------------------------------------------------------------
  console.log('\n🔍 [Suite 4] LineTraceModal Lineage, OCR Discrepancy Detection & Production Build Artifacts');

  // Helper component that opens D62 (OCR mismatch EIN) & inspects SchC.1 in LineTraceModal
  const InspectWrapper: React.FC = () => {
    const { openDocument, setInspectedLineKey, inspectedLineKey } = useWorkpaper();
    React.useEffect(() => {
      openDocument('D62', 1, ['ev-1045']);
      setInspectedLineKey('SchC.1');
    }, []);
    return (
      <div>
        <DocumentViewerDrawer />
        {inspectedLineKey && <LineTraceModal />}
      </div>
    );
  };

  // Render with initial state
  const distIndex = path.resolve(process.cwd(), 'dist/index.html');
  const distPacket = path.resolve(process.cwd(), 'dist/packet.json');
  assert(fs.existsSync(distIndex), 'Production build artifact dist/index.html exists');
  assert(
    fs.existsSync(distPacket) && fs.statSync(distPacket).size > 1900000,
    'Production build artifact dist/packet.json exists and contains full 1.9MB dataset'
  );

  // Verify OCR discrepancy detection on D62 (ev-1045: extracted 74-3829516 vs printed 74-3829156)
  const ev1045 = packet.extracted_values.find((e) => e.id === 'ev-1045')!;
  const d62Page1 = packet.documents.find((d) => d.id === 'D62')!.pages[0].printed_content;
  assert(
    ev1045.value === '74-3829516' && d62Page1.includes('74-3829156') && !d62Page1.includes('74-3829516'),
    'OCR Discrepancy Detector identifies high-confidence (0.97) EIN transposition on D62 (ev-1045: 74-3829516 vs printed 74-3829156)'
  );

  // Verify handwritten low-confidence detection on D64 (ev-1049: confidence 0.41)
  const ev1049 = packet.extracted_values.find((e) => e.id === 'ev-1049')!;
  assert(
    ev1049.confidence === 0.41 && ev1049.value === 1500,
    'Low-Confidence Detector identifies D64 handwritten parish receipt (ev-1049, confidence 0.41) linked to msg-08'
  );

  console.log('\n================================================================================');
  console.log(`🏁 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================================');
  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationSuite().catch((err) => {
  console.error('Integration suite crashed:', err);
  process.exit(1);
});
