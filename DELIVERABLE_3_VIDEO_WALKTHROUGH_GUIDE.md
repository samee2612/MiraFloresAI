# Deliverable 3: Video Walkthrough Script & Demo Guide (4–5 Minutes)

Use this step-by-step script while recording your screen (`http://localhost:5173`) via Loom, QuickTime, or OBS.

---

## [0:00 – 0:45] 1. The Core Thesis: Why We Replaced the Spreadsheet with a Proof Graph
**What to show on screen:**
- Start on the **Overview & 16 Audit Checks** tab with the right-hand **Source Document Viewer Drawer** open to `D15` Page 3.

**What to say:**
> "Hi, I'm Sameeksha. When designing the MiraFlores workpaper for the Okafor-Lindqvist 2025 return, I started from a simple question: *If someone fluent in modern software who had never seen a spreadsheet designed a tax workpaper from first principles, what would they build?*
>
> A spreadsheet is passive—cells hold numbers that lose their link to the source document, blindly trust the extraction pipeline, and stay signed off even when underlying numbers change.
>
> Instead, I built an **Immutable Evidence & Reconciliation Graph**. Every number on the return is a live proof node linked bi-directionally to the 74 source documents and 3,012 extracted values, backed by an independent verification layer that actively distrusts both the OCR pipeline and the computation engine."

---

## [0:45 – 2:00] 2. Surfacing "Confident Mistakes" & Bi-Directional Evidence Tracing
**What to click on screen:**
1. On the **Overview** tab, scroll through the **Independent Verification Engine (16 Confident Mistakes Surfaced)**.
2. Click **`D11 P.2`** on **Finding #1 (Corvane RSU Basis Omitted - $47,620)** and show the right-hand document drawer highlighting the exact RSU vest basis (`$19,100`, `$19,100`, `$9,420`).
3. Toggle the right-hand drawer from **Simulated Source Paper** to **Bounding-Box Overlay** to show how synthetic `(x0, y0, x1, y1)` coordinates map directly onto the page canvas so real PDFs/images can drop in seamlessly.
4. Click **Apply Fix** on Finding #1 (or click **Apply All 16 Fixes** in the top KPI card) and point out how the **Federal Total Tax** and **California 540NR Tax** update live in the top KPI banner using the packet's marginal `tax_effect_rates`.
5. Click **`D23 P.3`** on **Finding #5 (Mileage Log Duplicate Scan)** to show Page 3's verbatim note (`"Second scan of the May-Aug sheet - same handwriting and coffee stain as page 2"`) and **`D62 P.1`** on **Finding #16** to show the red warning where OCR read Little Sprouts' EIN as `74-3829516` at 97% confidence when the printed text says `74-3829156`.

**What to say:**
> "Because real pipelines make high-confidence mistakes, our reconciliation engine runs independent cross-checks across the packet. It automatically surfaced 16 errors:
> - First, on Northlake 1099-B (`D28`), three noncovered RSU lots (`N1`, `N3`, `N4`) had $0 broker basis. Because `D11` labeled them `RSU-2502` instead of `N1`, the engine missed $47,620 of basis and double-taxed Ngozi's W-2 stock compensation.
> - Second, on Schedule C (`SchC.1`), the engine added a $12,400 Form 1099-K (`D21`) on top of QuickBooks revenue ($151,300), missing that `D15` Page 3 proves those Paywell card payments were already inside Atlas Outdoor Gear's $41,200 revenue.
> - Third, on California Form 540NR, Halvorsen Data kept California payroll open until September by mistake (`D09`). By linking Ngozi's July 18 paystub (`D73`), we reduce California-source wages by $88,831, saving $5,685 in state tax.
> - With one click, we can apply any fix—or all 16—preserving the original engine number alongside our adjustment, rationale, and live Federal and California tax impact."

---

## [2:00 – 3:00] 3. High-Density CPA Schedules, Multi-Year Basis & Completeness
**What to click on screen:**
1. Click the **CPA Area Workpapers (10)** tab in the top navigation.
2. Click **3. Investments & Crypto** in the left sidebar and scroll to the **Form 8949 High-Density Lot Explorer (302 Lots)**. Show the filter buttons (`⚠️ Exceptions & Wash Sales (28)` vs. `Brightpath Direct-Indexing (260)`) and the **Bulk Verify Shown Lots** button.
3. Click **5. Rentals & 4797 Sale** to show the **Per-Asset Depreciation & Disposition Schedule** (Federal 100% bonus vs. CA MACRS vs. AMT, plus the October 15 Austin condo sale and Section 1250 recapture) and **Form 8582 Passive Loss Release**.
4. Click **6. K-1s & 7203 Basis** to show the **Lindqvist Family Woodworks Multi-Year S-Corp Basis Reconstruction** (rolling forward from 2022 → 2023 via newly found `D40` → 2024 → 2025, proving the $21,215 excess distribution capital gain).
5. Click the **74-Doc Completeness Index** tab and filter by `⚠️ Partial / Unmapped` to show how unread Page 32 of `D31` (`Lot M18`) and outside filings (`FBAR`, contractor `1099-NECs`) are tracked.

**What to say:**
> "To avoid swamping reviewers with 302 Form 8949 sales, our Lot Explorer separates the 28 exception lots from the 260 routine Brightpath direct-indexing trades, supporting one-click bulk verification.
>
> Every CPA schedule—from the Schedule C Books-to-Tax waterfall and 3-column Asset Depreciation schedule to the multi-year S-Corp Form 7203 basis rollforward—links every figure back to prior-year records and source documents."

---

## [3:00 – 4:00] 4. What-Ifs, Role Enforcement, Auto-Reopening Sign-Offs & 2028 IRS Audit Defense
**What to click on screen:**
1. Click **What-Ifs, Version Diff & Judgments**. Toggle `equipment_no_bonus` or `hvac_improvement` or `penalty_annualized` to show live tax comparison, and show the **v1 → v2 → v3 Version Diff** with `NEW SINCE LAST LOOKED` badges.
2. In the top-right **Role Switcher**, switch from `Priya Raman (preparer)` to `Jo Kimura (firm administrator)` and try to click an eye icon to unmask an SSN on the Overview tab (shows the **Access Denied** alert). Then switch to `Helen Strand (partner)` to show role-enforced sign-offs.
3. Show how making an adjustment on a signed-off area (`6. K-1s & 7203 Basis`) automatically triggers the red **Sign-Off Automatically Reopened** banner.
4. Click **Timeline, Review Notes & 2028 IRS Exam**. Drag the **Season Timeline Scrubber** from Event 1 to Event 29 (`2028-01-26 notice_received`), and point out the **Self-Contained IRS Letter 566 Examination Defense Record** with Exhibits A–E ready for the examiner.

**What to say:**
> "Finally, the workpaper enforces multi-role collaboration and survives the full post-filing lifecycle:
> - Switching roles enforces permissions—for example, the Firm Administrator cannot unmask SSNs, and every unmasking by cleared staff is recorded in an immutable view log.
> - If any underlying number changes after a Preparer or Reviewer signs off an area, that sign-off automatically reopens.
> - And using the Season Timeline Scrubber, we can replay the entire lifecycle from intake through the July 13 e-file rejection on Theo's SSN (`R0000-504-02`), freeze the return at filing, and fast-forward to January 2028 when IRS Examination Letter 566 arrives—where our self-contained defense dossier already has the exact Form 8283 and Schedule C 1099-K reconciliations ready to send."

---

## [4:00 – 4:30] 5. Technical Tradeoffs Summary
**What to say:**
> "On technical tradeoffs:
> 1. **Client-Side Graph + `localStorage` Persistence vs. Backend DB:** Since the brief requires running from a single link loading the delivered JSON packet and saving everything, I built an in-memory relational graph backed by `localStorage` with JSON state export and 1-click reset.
> 2. **Marginal Rate Approximation vs. Full Tax Engine Re-Execution:** Because we cannot re-run the proprietary tax engine, live adjustments compute tax deltas using the packet's `tax_effect_rates` per income/deduction category, while exact multi-line interactions (like the SEP-IRA cap interaction with bonus depreciation) are surfaced via the pre-computed `what_if` alternatives."
