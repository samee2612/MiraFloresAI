# Deliverable 2: The Errors Found in the Packet & How Our Design Surfaced Them

Our workpaper is built around an **Independent Verification & Reconciliation Layer** ("Checks that don't trust the engine"). Instead of treating the pipeline's `extracted_values` and the engine's `return_versions[v3]` as ground truth, our system cross-validates every return line against:
1. Verbatim `documents[].pages[].printed_content`
2. Cross-document tie-outs (e.g., W-2 Box 14 vs. Supplemental Equity Statements vs. 1099-B; QuickBooks P&L vs. 1099-NEC + 1099-K)
3. Official IRS and California FTB transcripts (`tax_agency_records`)
4. Client call notes (`call-01`), messages (`msg-01`–`msg-10`), and prior-year records (`D06`, `D07`)

Below are the **16 distinct errors and discrepancies** uncovered in the Okafor-Lindqvist packet, ordered by financial and compliance severity.

---

## Summary Table of All 16 Errors Found

| # | Error / Discrepancy | Target Line(s) | Engine v3 Value | Corrected Value | Dollar Delta | Est. Tax Effect (Fed / CA) | Primary Evidence |
| :-: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | **Corvane RSU Basis Omitted on Form 8949** (Lots `N1`, `N3`, `N4` reported with $0 basis on 1099-B) | `F8949.B.N1`, `N3`, `F8949.E.N4` (`SchD.1b`/`8b`) | $53,020 gain ($0 basis) | $5,400 gain ($47,620 basis) | **-$47,620** | **-$15,536 Fed** / **-$2,765 CA** | `D11` p.2 (`ev-0066`, `ev-0068`, `ev-0070`), `D08` Box 14 |
| **2** | **Schedule C Gross Receipts Double-Counts 1099-K** ($12,400 Paywell card receipts already in Atlas 1099-NEC & QBO books) | `SchC.1` | $163,700 | $151,300 | **-$12,400** | **-$4,402 Fed** / **-$384 CA** | `D14` (`ev-0103`), `D15` p.3 (`ev-0109`), `D17`, `D21`, `D72` (IRS Exam) |
| **3** | **California Wage Over-Sourcing on Halvorsen W-2** (Employer kept CA payroll open until Sept 30 after July 15 TX move) | `SchCA540NR.1.E` | $218,400 | $129,569 | **-$88,831** | **$0 Fed** / **-$5,685 CA** | `D73` (`ev-1081`: $22,469 CA YTD at move), `D09`, `qa-45` |
| **4** | **Disallowed Self-Employed Health Insurance Deduction** (Erik eligible for Ngozi's subsidized family HDHP all year) | `Sch1.17` | $14,400 | $0 | **-$14,400** | **+$4,464 Fed** / **+$605 CA** | `qa-25`, `D08` (`ev-0025` Box 12 DD), `D09` (`ev-0044`), `D25` |
| **5** | **Duplicate Scan of Page 2 in Vehicle Mileage Log** (Page 3 of `D23` is an identical scan of Page 2 with same coffee stain) | `SchC.9`, `SchC.44a` | $8,260 (11,800 mi) | $5,670 (8,100 mi) | **+$2,590** net profit | **+$919 Fed** / **+$80 CA** | `D23` p.2 (`ev-0315`) vs. p.3 (`ev-0404`) |
| **6** | **Donated Subaru Claimed at $6,000 KBB Estimate Instead of Form 1098-C Auction Proceeds** | `F8283.A1.vehicle`, `SchA.12` | $20,500 ($6,000 car) | $17,400 ($2,900 car) | **-$3,100** | **+$806 Fed** / **+$149 CA** | `D66` Box 4c (`ev-1055`: $2,900), `qa-39`, `D72` (IRS Exam) |
| **7** | **Home Mortgage Payoff Interest Double-Counted** ($2,150 Lonestar payoff statement added on top of Lonestar 1098) | `SchA.8a` | $21,847 | $19,697 | **-$2,150** | **+$559 Fed** / **+$103 CA** | `D55` (`ev-1029`: includes payoff), `D56` (`ev-1032`) |
| **8** | **Home Property Tax Not Reduced by Seller Closing Credit** ($6,912 credit for Jan 1–Jul 7 on Buyer Closing Statement) | `SchA.5b` | $13,420 | $6,508 | **-$6,912** | **+$1,462 Fed** / **+$332 CA** | `D54` (`ev-1027`: $6,912 seller credit), `D57`, `D58` |
| **9** | **Northlake Bank Sweep Interest Double-Counted** (Reported on both Consolidated `D28` and standalone `D29`) | `SchB.1.2` | $1,840 | $0 | **-$1,840** | **-$640 Fed** / **-$127 CA** | `D28` (`ev-0492`) vs. `D29` (`ev-0538`) |
| **10** | **Crypto Lot C6 Missing $3,050 Basis & Misclassified as Short-Term** (0.05 BTC bought Mar 2021 on CryptoNorth) | `F8949.H.C6` | $5,325 STCG ($0 basis) | $2,275 LTCG ($3,050 basis) | **-$3,050** (+ST→LT) | **-$1,312 Fed** / **-$195 CA** | `D35` (`ev-0918`, `ev-0919`), `msg-07` |
| **11** | **Personal Expenses Included in Schedule C Books** (Spotify Family $216, 30% personal phone $648, 50% internet $660) | `SchC.25`, `SchC.27a.1` | $10,330 | $8,806 | **+$1,524** net profit | **+$541 Fed** / **+$47 CA** | `D15` p.1–2 (`ev-0106`–`0108`), `call-01` |
| **12** | **Federal Q4 Estimated Payment Overstated by $1,000** (Used client's "4,000 I think" guess instead of IRS Transcript $3,000) | `F1040.26` | $13,000 | $12,000 | **-$1,000** payment | **+$1,000 Fed Balance Due** | `D69` (`irs_account_transcript_2025`: $3,000 on 01/15/2026), `qa-41` |
| **13** | **CA 09/15/2025 Estimated Payment ($3,500) Applied to 2024 Tax Year** on FTB Web Pay | `F540NR.72` | $14,000 | $10,500 (or transfer) | **-$3,500** CA credit | **+$3,500 CA Balance / Credit Transfer** | `D68` (`ev-1076`: year 2024), `ftb_account` |
| **14** | **Meridian 1099-B Page 32 Unread by Pipeline** (Omitted Lot `M18` Ironwood REIT fractional share loss -$60) | `F8949.B.M18` (`SchD.1b`) | Omitted ($0) | -$60 STCL | **-$60** | **-$21 Fed** / **$0 CA** | `D30`/`D31` p.32 (`extraction: partial`), `ev-0703` |
| **15** | **Swedish Bank Interest Converted at 2024 FX Rate** (Used `10.56` 2024 avg instead of `9.86` 2025 avg) | `SchB.1.6` | $1,747 | $1,871 | **+$124** | **+$43 Fed** / **+$9 CA** | `D36` (`ev-0960`), `fx_rates.SEK_per_USD` |
| **16** | **Identity & OCR Digit Errors** (Theo SSN `666-74-3309` → `3390`; Little Sprouts EIN `74-3829516` → `156`; St. Brigid `$1,500`) | `Household`, `F2441.1b`, `SchA.11` | `3309` / `516` / `?500` | `3390` / `156` / `$1,500` | $0 | Cures **E-File Reject `R0000-504-02`** | `D06` (`ev-0012`), `D71`, `D62` (`ev-1045`), `D64` (`ev-1049`), `msg-08` |

---

## Deep Dive: How Our Design Surfaces Each Class of Error

### 1. Cross-Document Reconciliation Bridges (Errors #1, #2, #6, #7, #8, #9)
Traditional workpapers display one form or document at a time. Our workpaper groups related documents into **Reconciliation Bridges**:
- **Equity Compensation Bridge (`Schedules → Wages & Equity`):** Automatically pairs W-2 Box 14 (`D08`: RSU $38,200, ESPP $675) and the Corvane Stock Plan Supplement (`D11`) against Form 1099-B (`D28`). Because the engine only matched lot ID `N2` to `ESPP-2406` and left `N1`, `N3`, and `N4` with $0 basis (since `D11` named them `RSU-2502`, `RSU-2505`, `RSU-2308`), our bridge flags the **$47,620 unapplied supplemental basis** as Critical Finding #1.
- **Schedule C Books-to-Tax Waterfall (`Schedules → Schedule C Business`):** Displays a 3-way tie-out between QuickBooks P&L (`D14`: $151,300), third-party 1099-NECs (`D16`–`D20`: $142,000) + non-1099 client deposits (`D15` p.3: $9,300 = $151,300), and `D21` Form 1099-K ($12,400). It highlights verbatim text on `D15` Page 3 proving that Paywell's $12,400 was already inside Atlas Outdoor Gear's $41,200 1099-NEC—preventing a $12,400 double-count and pre-building the exact defense table later requested by the **2028 IRS Letter 566 examination**.
- **Closing Statement & Lender Tie-Out (`Schedules → Deductions & Credits`):** Pairs the Buyer Closing Disclosure (`D54`) and Payoff Statement (`D56`) against Forms 1098 (`D55`, `D57`), immediately exposing the $2,150 payoff interest double-count and the $6,912 seller property tax proration credit.

### 2. Document Completeness & Spatial Scan Auditing (Errors #3, #5, #14, #16)
- **74-Document Completeness Index (`74-Doc Completeness Index`):** Every document must have a verified landing destination. Filtering by `Partial / Unmapped` immediately surfaces:
  - **`D31` (Meridian Corrected 1099):** Marked `partial` because the pipeline stopped at Page 31 and missed Page 32 (`Lot M18` Ironwood REIT fractional share loss of -$60), explaining the $250 `BROKER_SUMMARY_DETAIL_MISMATCH` diagnostic (`$71,965` summary vs. `$71,715` extracted lots).
  - **`D73` (Halvorsen 07/18/2025 Paystub):** Uploaded after the March 26 call but ignored by the engine (`R-CA-WAGES-SOURCE` only read W-2 Box 16). Linking `D73` reduces California-source wages on `SchCA540NR.1.E` by **-$88,831** (saving **$5,685** in CA tax).
- **Duplicate Page & OCR Diff Detector (`DocumentViewerDrawer`):**
  - On **`D23` (Mileage Log)**, our detector flags that Page 2 and Page 3 have identical trip dates (`2025-05-01` to `2025-08-23`), identical destinations, and identical 3,700-mile page totals ("same handwriting and coffee stain as page 2").
  - On **`D62` (Little Sprouts Learning Center)**, our viewer compares `ev-1045` (`74-3829516`, 97% confidence) against the verbatim `printed_content` (`74-3829156`), highlighting the high-confidence OCR digit transposition in red.

### 3. Official Agency Transcript & Prior-Year Anchoring (Errors #12, #13, #16 & Prior Preparer Gaps)
- **Transcript vs. Questionnaire Precedence:** When the client guessed `"4,000 I think"` (`qa-41`) for their Q4 federal payment, the engine trusted the questionnaire ($13,000) over the official IRS Account Transcript (`D69`: $3,000 paid 01/15/2026 = $12,000). Similarly, on `D68`, the client accidentally coded their 09/15/2025 $3,500 FTB Web Pay payment to **Tax Year 2024**, which `ftb_account` holds as a 2024 credit. Our Agency Reconciler surfaces both transcript mismatches side-by-side.
- **Prior-Year Identity Cross-Check:** Comparing `household.people` against the 2024 return (`D06`, `ev-0012`) immediately catches that Theo's SSN was typed as `666-74-3309` in the organizer instead of `666-74-3390`—the exact error that caused the July 13 Federal E-File Rejection (`R0000-504-02`, cured by `D71`).
