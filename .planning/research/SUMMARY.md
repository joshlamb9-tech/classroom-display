# Project Research Summary

**Project:** Y7&8 Pupil Tracking Dashboard
**Domain:** Google Sheets-based pastoral and academic progress tracking system (Head of Year, ~46 pupils)
**Researched:** 2026-02-23
**Confidence:** HIGH

---

## Executive Summary

This is a single-user-primary tracking dashboard for a Head of Year managing 46 pupils across 4 school forms. The system's job is to give Josh a clear, filterable view of every pupil's academic and pastoral status, flag who needs attention, and log interventions and parent contact — all without requiring any custom infrastructure. Research confirms the right tool is a single Google Sheets file with ~12 tabs, structured around a flat cohort overview driving form-level data tabs, with MARVIN operating as the primary maintenance interface via the Google Workspace MCP. No external database, hosting, or paid tooling is required. Everything is within Google Workspace that already exists.

The recommended approach is to build the spreadsheet structure first (one spreadsheet, one URL, 12 tabs), lock in the PupilID scheme before migrating any data, and get the Scholarships tab live immediately — Matilda Constantinou's Art scholarship interview is in 8 days (w/c 2 March 2026). The full cohort overview with RAG status follows in the first week, with grade entry and pastoral logs completing in week two. MARVIN's role is as the write interface: reading named ranges for briefings, updating cells by PupilID lookup, and appending to log tabs. MARVIN never writes by row number — always by stable PupilID match.

The key risks are GDPR compliance (pupil data in a shared spreadsheet requires a confirmed Google Workspace for Education DPA and a tiered sheet design separating SEN/pastoral from general staff views), and MARVIN writing to wrong rows (mitigated by a mandatory read-match-verify protocol keyed on PupilID, never row position). Both must be addressed before any data leaves iSAMS and enters the sheet. The iSAMS column mapping is a medium-confidence assumption — the exact export field names need verification against Mowden Hall's specific iSAMS configuration before the import workflow is built.

---

## Key Findings

### Recommended Stack

The full system runs on Google Sheets with Google Apps Script for automation hooks and the Google Workspace MCP for MARVIN's read/write access. Josh already has all of this. There is no additional tooling to procure, configure, or maintain.

**Core technologies:**

- **Google Sheets (single file):** All pupil data, RAG status, logs, and grade history. The flat cohort-plus-tabs structure outperforms both multi-file IMPORTRANGE arrangements and one-tab-per-pupil layouts for this dataset size. One spreadsheet ID means one target for MARVIN, one access URL for staff, and one revision history.
- **Google Apps Script (V8 runtime):** Handles the iSAMS CSV import workflow (paste to staging tab, map by header name, write to form tabs), sheet protection setup, and custom menus for staff. Not required for RAG status — that is native conditional formatting.
- **Google Workspace MCP (active):** MARVIN's write interface. Confirmed capable of read/write on any cell range, creating tabs, and reading metadata. Critical constraint: MCP writes do NOT trigger onEdit triggers. MARVIN must write timestamps explicitly, never rely on onEdit to do it.
- **Native Sheets features:** XLOOKUP (not VLOOKUP), QUERY function for cross-tab summaries, Filter Views (not basic filters — never let one person's filter affect another's view), named ranges as the stable API surface, and conditional formatting for RAG colouring. No script required for any of these.
- **iSAMS CSV export (manual workflow):** Grade, identity, and attendance data sourced from iSAMS via periodic CSV export. Real-time API sync is explicitly out of scope for v1. The staging tab pattern (paste CSV to `_iSAMS Import`, MARVIN maps and clears) isolates raw import data from live records.

### Expected Features

**Must have (v1 — before mock season and Matilda's interview):**

- Cohort overview sheet: one row per pupil, RAG status visible at a glance, filterable by form and RAG
- Scholarship tracker tab: Matilda Constantinou (Art, interview w/c 2 March), plus pipeline for any other candidates
- Individual pupil rows: identity block, SEN flag, boarding status, concern flag, pastoral summary
- Academic grades: effort + attainment per subject, per half-term, paired columns on form tabs
- CE mock score entry with CE risk flag (Year 8 — mocks are happening now)
- Pastoral log: incident count, commendation count, concern flag, last contact date
- Form filter views: 7M / 7S / 8L / 8S separated without affecting other users' view
- Auto-calculated RAG: composite formula (Red if any of effort / attainment / pastoral / CE is Red)
- SEN flag visible in overview
- iSAMS identity field import documented and tested

**Should have (v2 — after mock season):**

- Subject-level RAG breakdown (which subject is pulling a pupil down?)
- Trend arrows (improving / declining / stable) requiring at least two HT data points
- Attendance flag from iSAMS (% attendance, PA flag below 90%)
- Form tutor protected view (separate tabs with edit access scoped to their form)
- SLT summary tab (top risks, scholarship status, cohort RAG distribution)
- Parent contact log tab (currently tracked informally)
- CE prediction model (CAT4 SAS to expected CE grade ranges)

**Defer to v2+:**

- Real-time iSAMS sync (API credentials + custom scripting — manual CSV is sufficient for HOY cadence)
- Safeguarding / CPOMS records (legally must stay in iSAMS/CPOMS, not a spreadsheet)
- Year-on-year comparison (needs at least one full year of data first)
- Export to PDF / print-friendly view
- Subject teacher grade entry interface (use iSAMS Tracking Manager for that)

### Architecture Approach

Single Google Sheets file, 12 tabs, organised around a flat `Overview` tab (46 rows, one per pupil) pulling data from 4 form tabs via VLOOKUP on PupilID. Every tab uses `PupilID` as column A — the universal stable key in format `{form}-{surname}` (e.g. `8l-gardener`). Log tabs (Interventions, Parent Contact) are append-only. Support tabs (`iSAMS Import`, `Config`) carry underscore-prefix naming convention to signal they are infrastructure, not for human browsing.

**Major components:**

1. **Overview tab** — RAG dashboard, all 46 pupils, filterable by form / year / RAG / scholarship status / PA flag. MARVIN reads this for briefings. Formula-driven; staff cannot edit formula cells (protected).
2. **Form tabs (8L, 8S, 7M, 7S)** — Full pupil data per form: identity, grades (12 subjects x 6 HTs = 72 grade columns), CAT4, attendance, pastoral summary, extracurricular. Primary write target for grade imports.
3. **Scholarships tab** — Pipeline view: all candidates, interview dates, prep session counts, outcomes. Immediate value for Matilda's interview.
4. **Log tabs (Interventions, Parent Contact)** — Append-only. MARVIN finds next empty row via `COUNTA(A:A)+1` and writes there. Never overwrites.
5. **iSAMS Import tab** — Staging area. Paste CSV here; MARVIN reads, maps by header name to form tabs, marks rows Mapped/Error, then clears on next run.
6. **Config tab** — Key-value lookup for Current_HT, form lists, subject lists, tutor names, RAG options. MARVIN reads this before any write. Protected to Josh/MARVIN only.
7. **Named ranges** — The stable API contract between MARVIN and the spreadsheet (e.g. `Overview_RAG`, `Interventions_Log`, `iSAMS_Staging`). Referenced by name, not cell address, so column insertions do not break MARVIN's writes.

**MARVIN safe write protocol (mandatory):**
1. Read `Config_CurrentHT` to confirm active half-term
2. Read form tab column A to find PupilID
3. MATCH PupilID to locate exact row
4. Write value to correct cell (derived from row + named column position)
5. Write today's date to `Last_Updated` for that row
6. Log action to session log: timestamp, cell, previous value, new value

### Critical Pitfalls

1. **GDPR non-compliance before launch** — Pupil data in a shared Google Sheet requires: (a) confirmed Google Workspace for Education account (not consumer Gmail) with Google DPA signed, (b) DPO/data lead sign-off, (c) tiered sheet design separating SEN/pastoral from general staff view. Mitigation: resolve (a) and (b) before any data enters the sheet; build tiered structure from day one, not as a retrofit.

2. **MARVIN writing to the wrong row** — MCP writes by coordinate; if rows shift (sort, insert, filter), a stale row number corrupts a different pupil's record silently. Mitigation: enforce the read-match-verify protocol (PupilID lookup before every write); never write by row number; maintain MARVIN write log in session notes for human spot-check.

3. **Staff overwriting formula cells** — A paste operation (Ctrl+V) into a VLOOKUP or RAG formula cell silently replaces it with a static value. The cell still looks correct until source data changes. Mitigation: protect all formula cells before sharing with any staff; use visual convention (grey fill for calculated cells, white for data entry cells); train staff on Paste Values Only (Ctrl+Shift+V).

4. **SEN/pastoral data visible to all editors** — Sharing the sheet at file level exposes SEN flags and pastoral incident counts to subject teachers and tutors who have no right to see them. Mitigation: separate SEN and pastoral detail into a restricted tab (visible only to Josh and SENCO) from day one, before the file is shared with anyone else.

5. **iSAMS CSV column order / encoding changes** — A different iSAMS export template or system update renames or reorders columns; import script maps data to wrong fields silently. Encoding mismatch (Windows-1252 vs UTF-8) garbles pupil names with accented characters. Mitigation: always parse CSV by header name, never column index; validate encoding before import; run pupil count check after each import and abort if count diverges from expected 46.

---

## Implications for Roadmap

### Phase 1: Foundation and Compliance (Days 1–2)

**Rationale:** Nothing can be built safely until the data governance question is resolved and the structural skeleton is locked. This phase creates the spreadsheet, sets the PupilID scheme, establishes data validation, and confirms GDPR status. It is a blocker for everything else.

**Delivers:** A single Google Sheets file with correct tab structure, column headers, named ranges, and data validation dropdowns. No pupil data yet — just the container. Confirmed Google Workspace for Education DPA status. Tiered sheet design with sensitive data isolated.

**Must resolve before moving on:**
- Google Workspace licence tier: is Mowden Hall on Google Workspace for Education? (If not, pupil data cannot lawfully enter the sheet.)
- DPO/data lead has been informed and has approved the data structure
- PupilID scheme locked (`{form}-{surname}` format, verified against the 46 markdown files for uniqueness)
- iSAMS `ManagementSystemID` or equivalent confirmed as the stable join key

**Avoids:** Pitfall 3 (GDPR), Pitfall 4 (SEN data visibility), Pitfall 7 (duplicate names causing wrong-pupil writes).

**Research flag:** GDPR/DPA status for Mowden Hall's Google Workspace must be confirmed with the school's IT lead or bursar. This cannot be assumed.

---

### Phase 2: Scholarship Tracker (Day 2–3 — URGENT)

**Rationale:** Matilda Constantinou's Art scholarship interview is w/c 2 March 2026 — 8 days away. The Scholarships tab delivers standalone immediate value and has no dependency on grade import or iSAMS data. It can be built and live within hours of Phase 1 completing.

**Delivers:** A working Scholarships tab with Matilda's record: interview date (w/c 2 March 2026), portfolio status, prep session log, pre-interview checklist, art teacher liaison contact. Days-until-interview formula (`=interview_date - TODAY()`) with red highlight when below 14 days.

**Addresses features:** Must-have #7 (scholarship candidate tracker).

**Does not require:** iSAMS import, grade data, or staff access setup.

**Research flag:** No deeper research needed — standard Sheets pattern.

---

### Phase 3: Cohort Migration and Overview (Days 3–5)

**Rationale:** With the structure in place and GDPR resolved, migrate the 46 pupil identity records from markdown files to form tabs. MARVIN reads the markdown files (all fields currently blank except identity) and batch-writes rows to `_LOOKUP_PUPILS` and form tabs. Then populate the Overview tab so the RAG dashboard is live.

**Delivers:** All 46 pupils in the spreadsheet with identity data (name, form, tutor, boarding/day, SEN flag). Overview tab live with filter views by form. RAG formula applied (currently all will default to Green or Amber until grade data enters).

**Addresses features:** Must-have #1 (cohort overview), #2 (individual pupil records), #6 (form filter), #8 (SEN flag in overview).

**Uses:** MARVIN batch write via MCP (most efficient migration path given blank fields and MCP access). Apps Script for sheet protection setup.

**Avoids:** Pitfall 7 (duplicate names) by using PupilID as migration key; Pitfall 1 (formula overwrite) by protecting formula cells before sharing.

**Open question:** Confirm iSAMS `ManagementSystemID` values for all 46 pupils — needed as the join key for all future iSAMS imports. If unavailable at migration time, use the `{form}-{surname}` key as a temporary bridge until iSAMS IDs are obtained.

**Research flag:** Standard migration pattern — no deeper research needed. iSAMS field name confirmation is a validation step, not a research task.

---

### Phase 4: Grade Entry and RAG Activation (Week 2)

**Rationale:** CE mocks are happening now. Grade entry — both historical report grades and CE mock scores — is the core utility of the system. Once grades are in, RAG formulas activate and the dashboard becomes genuinely useful.

**Delivers:** Academic grade columns populated for current half-term (manual entry or Tracking Manager CSV import), CE mock scores for Year 8 with CE risk flag, Overall RAG formula live and meaningful for all 46 pupils. Effort/attainment RAG per pupil computed from grade averages.

**Addresses features:** Must-have #3 (academic grades), #4 (CE mock scores + risk flag), #5 (pastoral log structure), #10 (auto-calculated RAG).

**Uses:** iSAMS Import staging tab for grade import, MARVIN MCP for mapping and writing, native conditional formatting for RAG colour.

**Avoids:** Pitfall 5 (iSAMS encoding/column order) by parsing headers not indices; Pitfall 13 (partial import overwriting data) by never treating absent CSV rows as deletions.

**Open question:** What grade scale does Mowden Hall use in iSAMS? The research recommends a 1–5 numeric mapping (Excellent=5 to Unsatisfactory=1) but this must be verified against the actual school grade scale before the RAG formula thresholds are set.

**Research flag:** iSAMS Tracking Manager export format needs one-time confirmation — which columns does Mowden Hall's instance export? This is a 10-minute check, not a research phase.

---

### Phase 5: Pastoral Logs and Staff Access (Week 2–3)

**Rationale:** With grade data live and RAG working, the system moves from read-only insight to active operational use: logging interventions, parent contacts, and sharing appropriate views with form tutors.

**Delivers:** Interventions log tab (append-only), Parent Contact log tab, pastoral summary in Overview (incident count, concern flag, last contact date). Form tutor access configured — each tutor can edit their own form tab, read-only on Overview. SEN-sensitive tab protected to Josh/SENCO only.

**Addresses features:** Must-have #5 (pastoral log), Form tutor view (nice-to-have #15 but realistically needed for tutors to contribute).

**Avoids:** Pitfall 4 (SEN data visible to all editors) by completing tab-level protection before sharing; Pitfall 8 (concurrent editing conflicts) by defining clear column ownership: tutors write pastoral columns, MARVIN writes grade columns.

**Research flag:** Google Sheets does not support true row-level permissions. The workaround (separate form tabs, each protected to its own tutor) is well-documented — no research needed. Implement and test with one tutor before rolling out all four.

---

### Phase 6: Ongoing Operations (Week 3+)

**Rationale:** The system needs to become part of Josh's regular workflow, with MARVIN prompting for updates at term boundaries and surfacing stale data warnings.

**Delivers:** Data freshness warning on Overview (red banner if any grade is older than 80 days), MARVIN proactive start-of-term prompt ("Grades last updated X weeks ago"), termly iSAMS import workflow documented and repeatable. CAT4 data imported if available.

**Addresses features:** Implicit in the system sustainability — without this, the dashboard falls into disuse by Week 6 (Pitfall 9).

**Avoids:** Pitfall 9 (stale data / system abandonment).

**Research flag:** No new research needed. Implement as Apps Script onEdit freshness flag + MARVIN session-start check.

---

### Phase Ordering Rationale

- Phase 1 before everything: GDPR is a hard blocker. Building a beautiful dashboard and then discovering pupil data cannot lawfully sit in a consumer Google account is a catastrophic rework.
- Phase 2 before Phase 3: The scholarship tracker is urgent (8 days) and independent. Do not let the larger migration delay Matilda's record being live.
- Phase 3 before Phase 4: Identity data must exist before grade data can be attached to pupils. The PupilID key must be established before any VLOOKUP or MARVIN write can correctly locate a pupil.
- Phase 4 before Phase 5: RAG needs to be meaningful before tutors see it. Sharing a dashboard full of Grey/unknown status cells is worse than not sharing it.
- Phase 5 before Phase 6: Staff access must be set up and tested before building operational workflows that depend on tutor contributions.

### Research Flags

**Phases needing validation (not full research — just confirmation checks):**
- **Phase 1:** Google Workspace licence tier for Mowden Hall — confirm with IT lead or bursar. Is it Google Workspace for Education Plus / Standard / Teaching and Learning? This determines DPA status and what data can legally be processed.
- **Phase 4:** Mowden Hall iSAMS grade scale — confirm the actual labels used (e.g., does the school use A/B/C, 1–5, Excellent/Good/Satisfactory, or something else?). Needed to set RAG formula thresholds correctly.
- **Phase 4:** iSAMS Tracking Manager export column names for Mowden Hall's instance — one test export will confirm the actual headers vs. what the research documents as typical.

**Phases with well-documented patterns (no research needed):**
- **Phase 2:** Scholarship tab — standard Sheets data entry pattern.
- **Phase 3:** Migration via MARVIN MCP — established capability, all fields are blank, low risk.
- **Phase 5:** Tab-level protection for form tutors — standard Apps Script protection API, well-documented.
- **Phase 6:** Data freshness warning — standard conditional formatting pattern.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Google Sheets / Apps Script are mature platforms with official documentation. MARVIN MCP confirmed active and capable. All capability claims verified against official sources. |
| Features | HIGH for domain; MEDIUM for iSAMS fields | School tracking features are well-understood. iSAMS export field names are verified against integration guides but not against Mowden Hall's specific iSAMS configuration. |
| Architecture | HIGH | Based on direct inspection of the 46 markdown files and existing MASTER-OVERVIEW.md. Architecture decisions are grounded in the actual data, not hypothetical. |
| Pitfalls | HIGH | GDPR risks verified against ICO guidance and UK GDPR (DPA 2018). Technical pitfalls verified against official Apps Script and Sheets documentation. |

**Overall confidence:** HIGH — with two open questions that need one-time verification (not research).

### Gaps to Address

- **Google Workspace licence tier:** Research cannot confirm whether Mowden Hall's Google account is consumer Gmail or a Google Workspace for Education account with DPA. This is the single most important question before launch. Resolution: ask the school's IT lead or bursar directly. Takes 5 minutes.

- **Mowden Hall grade scale:** The research maps grades to a 1–5 numeric scale (Excellent=5, Unsatisfactory=1) as a reasonable assumption. The actual school grade scale may use different labels or more/fewer bands. Resolution: check one recent iSAMS Tracking Manager report or ask a subject teacher what grade options they see in iSAMS.

- **iSAMS ManagementSystemID availability:** Research confirms this is the standard iSAMS pupil ID field, but it is not always included in default export templates. Resolution: run one test export from iSAMS Pupil Manager to confirm the ID field is available and what it looks like in Mowden Hall's instance.

- **Duplicate first name pairs confirmed:** Research notes 4 known duplicate first name pairs across Y7/Y8 (e.g., two Archies, two Henrys). The `{form}-{surname}` PupilID scheme handles this. Resolution: verify the 46 surnames are unique within each form before finalising the PupilID scheme. Any same-surname-same-form cases will need disambiguation (e.g., `8l-smith-a` vs `8l-smith-b`).

---

## Sources

### Primary (HIGH confidence)

- [Google Sheets conditional formatting](https://support.google.com/docs/answer/78413) — RAG colouring, rule limits
- [Apps Script simple triggers](https://developers.google.com/apps-script/guides/triggers) — onEdit limitations, MCP write bypass
- [Apps Script installable triggers](https://developers.google.com/apps-script/guides/triggers/installable) — email alerts, scheduled syncs
- [Apps Script Protection class](https://developers.google.com/apps-script/reference/spreadsheet/protection) — sheet/range locking
- [Apps Script CSV import samples](https://developers.google.com/apps-script/samples/automations/import-csv-sheets) — import workflow pattern
- [Apps Script Quotas (updated 2025-12-11)](https://developers.google.com/apps-script/guides/services/quotas) — execution limits
- [ISEB Common Entrance at 13+](https://www.iseb.co.uk/assessments/common-entrance/at-13-for-schools/) — CE subject list
- [iSAMS Student Manager](https://www.isams.com/platform/modules/student-manager/) — field categories
- [iSAMS Tracking Manager](https://www.isams.com/platform/modules/tracking-manager/) — grade export capability
- [iSAMS SEN Manager](https://www.isams.com/platform/modules/sen-manager/) — SEN register structure

### Secondary (MEDIUM confidence)

- [iSAMS CSV export guide — Microlibrarian](https://cdn.microlibrarian.net/importwizard/csv/helpers/mis-isams.html) — confirmed ManagementSystemID, Surname, Forename, Gender, DateOfBirth, YearGroup, TutorGroup
- [iSAMS export — Reading Cloud](https://knowledgebase.reading-cloud.com/knowledge-base/exporting-a-csv-isams) — confirmed field wizard structure
- [iSAMS — Education Perfect integration](https://help.educationperfect.com/article/2065-how-to-export-data-from-isams) — confirmed Preferred Name, Student Email Address, School ID
- [Google Workspace MCP Server](https://workspacemcp.com/) — confirmed read/write capabilities
- [GDPR for Independent Schools — LegalVision UK](https://legalvision.co.uk/data-privacy-it/data-protection-act-gdpr-independent-schools/) — compliance obligations
- [GDPR Compliance for Schools — DataGuard](https://www.dataguard.com/blog/gdpr-compliance-for-schools-in-the-uk) — DPA / special category data requirements
- [CAT4 Test Results Explained](https://cat4-prep.com/cat4-test-results/) — four batteries, SAS (mean 100, SD 15), stanines 1–9
- [Slow Google Sheets — Ben Collins](https://www.benlcollins.com/spreadsheets/slow-google-sheets/) — performance patterns
- [Google Sheets limits — RowZero](https://rowzero.com/blog/google-sheets-limits) — cell and tab limits

### Tertiary (LOW confidence — verified against primary where possible)

- [Hide columns from users — TheBricks](https://www.thebricks.com/resources/how-to-hide-columns-in-google-sheets-from-certain-users) — confirmed column hiding is not true security
- [VLOOKUP vs XLOOKUP 2025](https://isitdev.com/vlookup-vs-xlookup-2025/) — XLOOKUP superiority confirmed
- [Concurrent editing — Google Docs Community](https://support.google.com/docs/thread/5282099) — last-write-wins behaviour

---

*Research completed: 2026-02-23*
*Ready for roadmap: yes*
