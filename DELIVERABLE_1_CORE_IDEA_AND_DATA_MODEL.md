# Deliverable 1: Core Idea & Data Model

## 1. The Core Idea: An Immutable Evidence & Reconciliation Graph (Not a Spreadsheet)
A traditional tax workpaper is a passive, fragile spreadsheet where preparers copy-paste numbers from PDFs, type ad-hoc formulas, and leave static tick-mark initials. Spreadsheets fail at the four things a modern CPA firm actually needs:
1. **Bi-Directional Provenance:** In a spreadsheet, a cell holds a number (`163700`), losing its connection to the exact bounding box on the source PDF and the engine rule that computed it.
2. **Independent Skepticism ("Don't Trust the Engine"):** When an extraction pipeline or tax engine makes a high-confidence mistake (such as double-counting a Form 1099-K already inside QuickBooks revenue, or missing RSU cost basis on a supplemental schedule), a passive workpaper blindly carries the error onto the return.
3. **Reactive Governance:** In traditional binders, if a number changes after a Reviewer signs off, the sign-off remains green.
4. **Multi-Year & Multi-Persona Continuity:** A spreadsheet built for a March preparer is cryptic to a Partner doing a 10-minute review, useless to a client answering questions, and non-self-contained when an IRS examiner opens a correspondence audit (`Letter 566`) two years later.

### Our Invention: The Bi-Temporal Tax Proof Graph
Someone fluent in modern software who has never seen a spreadsheet would model a tax workpaper as a **reactive, bi-directional Directed Acyclic Graph (DAG)** of **Claims, Evidence, Reconciliations, and State-Machine Attestations**:
- **Every return line is a Proof Node:** Clicking any number (`SchC.1`, `F8949.B.N1`, `SchCA540NR.1.E`) opens its complete lineage—upstream return lines, the engine rule (`R-SCHC-GROSS`), prior-year anchor (`py:/...`), and extracted source tokens (`ev-NNNN`)—while highlighting the exact printed text and spatial coordinates `(x0, y0, x1, y1)` on the source document in a persistent split pane.
- **Every document has a Completeness Contract:** Every one of the 74 documents (`D01`–`D74`) must be accounted for in the graph—either mapped to specific return lines, explicitly marked `Superseded` (e.g., `D30` replaced by `D31`), or flagged as `Unmapped / Partial Extraction` (instantly surfacing unread Page 32 of `D31` and ignored paystub `D73`).
- **Non-Destructive Delta Overlay:** The workpaper never overwrites the engine's baseline output (`v3`). Adjustments are stored as immutable delta layers (`originalValue` → `adjustedValue`, `delta`, `reason`, `author`, `evidenceRefs`, and live Federal/CA marginal tax impact via `tax_effect_rates`).
- **Cryptographic-Style Sign-Off Invalidation:** Area sign-offs (`Preparer`, `Reviewer`, `Partner`) subscribe to the hash of underlying line values in their domain. If any adjustment or what-if modifies a line in a signed-off area, the sign-off **automatically reopens** with an explicit audit trail explaining who changed what.

---

## 2. Data Model Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                   LAYER 1: IMMUTABLE PIPELINE & ENGINE PACKET                     │
│  Documents (D01..D74) ──► ExtractedValues (ev-0001..ev-3012 + bbox + confidence)  │
│  PriorYears (2022..2024) + AgencyRecords (IRS/FTB/E-File) + Client (QA/Msg/Calls) │
│  ReturnVersions (v1, v2, v3): Lines[], Assets[], Diagnostics[], TaxEffectRates    │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │ Bi-Directional Graph Indexing
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│              LAYER 2: INDEPENDENT VERIFICATION & RECONCILIATION ENGINE            │
│  Cross-Validates Engine Lines vs. Ground-Truth Printed Content & Statutory Caps:  │
│  • Books-to-Tax Tie-Out (D14 P&L vs D16-D20 1099-NEC vs D21 1099-K)               │
│  • Equity Comp Basis Matcher (D08 W-2 Box 14 + D11 Supplement vs D28 1099-B)      │
│  • Residency Day/Date Situs Check (D73 Paystub vs D09 W-2 Box 16)                 │
│  • Duplicate & Partial Scan Detector (D23 P.2/P.3 Mileage, D31 P.32 Lot M18)      │
│  ──► Emits 16 Structured AuditFinding Objects with 1-Click Adjustment Payloads    │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │ Non-Destructive Overlay
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                LAYER 3: MUTABLE WORKPAPER STATE & GOVERNANCE STORE                │
│  • WorkpaperAdjustment[]: { lineKey, original, adjusted, delta, fedTaxEffect,     │
│                             caTaxEffect, reason, author, evidenceRefs, status }   │
│  • VerificationStamp{}:   { lineKey, type, verifiedBy, verifiedAt, evidenceRefs } │
│  • ReviewNote[]:          { areaId, lineKey, severity: 'blocking'|'review',       │
│                             status: 'open'|'addressed'|'cleared' }                │
│  • AreaSignOff{}:         { preparer, reviewer, partner (auto-reopens on edit) }  │
│  • JudgmentElection[]:    { title, authority, options, position, confidence }     │
│  • SensitiveDataLog[]:    Immutable audit log of SSN / IP PIN / Bank unmasking    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions & Seamless Production Replacement
1. **Decoupled Source Document Coordinate Contract:** Each `ExtractedValue` carries normalized page coordinates `{ page, position: { x0, y0, x1, y1 } }`. Our `DocumentViewerDrawer` renders both a verbatim simulated paper view and a spatial bounding-box canvas using these exact coordinates—meaning a production PDF.js/WebGL rasterizer drops in with zero changes to the tracing or state layer.
2. **Exception-First High-Density Views:** Rather than rendering 302 Form 8949 sales as a 300-row spreadsheet, the Lot Explorer groups routine covered trades (260 Brightpath direct-indexing lots) for bulk verification while isolating the 28 exception lots ($0 RSU basis, unknown crypto transfer-in basis, wash sales, and unread Page 32 fractional shares).
