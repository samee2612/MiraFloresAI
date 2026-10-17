# Miraflores Tax Workpaper — 2025 Okafor-Lindqvist Return (`CL-20417`)

A web-native, evidence-graph tax workpaper designed from first principles for the **Okafor-Lindqvist Household 2025 Federal (Form 1040) & California Part-Year Resident (Form 540NR)** return.

🔗 **Live Web Application:** [https://samee2612.github.io/MiraFloresAI/](https://samee2612.github.io/MiraFloresAI/)

---

## 📄 Case Study Deliverables

1. **Working Web-Native Tax Workpaper:** [`src/`](./src/) (Live at [https://samee2612.github.io/MiraFloresAI/](https://samee2612.github.io/MiraFloresAI/))
2. **One-Page Core Idea & Data Model:** [`DELIVERABLE_1_CORE_IDEA_AND_DATA_MODEL.md`](./DELIVERABLE_1_CORE_IDEA_AND_DATA_MODEL.md)
3. **All 16 Planted Errors Uncovered & How the Design Surfaced Them:** [`DELIVERABLE_2_ERRORS_AND_SURFACING.md`](./DELIVERABLE_2_ERRORS_AND_SURFACING.md)
4. **Video Walkthrough Script & Demo Guide:** [`DELIVERABLE_3_VIDEO_WALKTHROUGH_GUIDE.md`](./DELIVERABLE_3_VIDEO_WALKTHROUGH_GUIDE.md)

---

## ✨ Key Capabilities

- **Bi-Directional Evidence & Provenance Graph:** Trace any return line (`F1040.*`, `SchC.*`, `SchD.*`, `F8949.*`, `F7203.*`, `F540NR.*`) to the exact source document (`D01`–`D74`), page, verbatim `printed_content` line, and spatial bounding box `(x0, y0, x1, y1)`—and trace any document forward to every return line it fed (or why it was excluded).
- **16 Independent Cross-Source Audit Checks ("Don't Trust the Engine"):** Deterministic verification engine ([`src/engine/reconciliationEngine.ts`](./src/engine/reconciliationEngine.ts)) cross-checks pipeline extractions against printed text, accounting ledgers, IRS/FTB transcripts, prior-year returns, and statutory caps.
- **Non-Destructive Adjustments & Live Tax Impact:** Apply or undo adjustments with full audit trail (*Who, When, Why, Evidence Refs*) and instant Federal & California tax recomputation using `return_versions[].tax_effect_rates`.
- **10 CPA Domain Schedules:**
  1. Intake, Identity & Engagement (SSN/EIN verification & prior preparer error resolution)
  2. Wages, Stock Compensation (RSU / ESPP / ISO) & AMT (Form 6251)
  3. Investments, High-Density 302-Lot Form 8949 Explorer & Crypto (Form 1099-DA)
  4. Schedule C Design Studio Books-to-Tax Waterfall & 4-Page Mileage Log Audit
  5. Rentals (1450 Fremont Way), Austin Condo Sale (Form 4797), Passive Loss Release (Form 8582) & 3-Column Asset Depreciation (Federal vs. CA vs. AMT + § 1250 Recapture)
  6. K-1 Pass-Throughs & Multi-Year S-Corp Stock Basis Reconstruction (Form 7203: 2022–2025)
  7. Retirement (Backdoor Roth Form 8606, SEP-IRA cap), HSA (Form 8889) & Foreign Accounts (Form 8938 / FBAR)
  8. Itemized Deductions (Schedule A, Form 8283 noncash charity) & Credits (Form 8867 Due Diligence)
  9. California Form 540NR Part-Year Residency Split (195 CA days / 170 TX days)
  10. Estimated Tax Payments vs. IRS/FTB Transcripts & Form 2210 Penalty
- **Multi-Role Governance & Auto-Reopening Sign-Offs:** Switch roles (`Preparer`, `Reviewer`, `Partner`, `Firm Administrator`, `Quality Reviewer`, `Client`). Enforces role permissions, blocks Reviewer/Partner sign-off when blocking review notes are open, **automatically reopens area sign-offs** if an underlying line is adjusted after sign-off, and logs sensitive SSN/IP PIN unmasking.
- **Season Timeline Replay & 2028 IRS Letter 566 Examination Defense Dossier:** Scrub across all 29 timeline events (`Jan 2026 → Jan 2028`), freeze the return at filing (`Amend on Top 1040-X` mode), and inspect the self-contained 2028 IRS Letter 566 audit defense package (`D72`).

---

## 🚀 Quick Start (Local Development & Integration Tests)

```bash
# Install dependencies
npm install

# Start Vite development server at http://localhost:5173
npm run dev

# Run the 63-assertion end-to-end integration test suite
npm test

# Build production bundle into dist/
npm run build
```
