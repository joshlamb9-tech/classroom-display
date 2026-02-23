# Architecture Research: Y7&8 Pupil Tracking Dashboard

**Researched:** 2026-02-23
**Confidence:** HIGH — based on direct inspection of existing data files and Google Sheets/Apps Script capabilities

---

## Source Data Audit

Before recommending architecture, I read the existing files:

- `/Users/josh/marvin/content/pupil-tracking/MASTER-OVERVIEW.md` — cohort summary table, 4 forms, 46 pupils
- `/Users/josh/marvin/content/pupil-tracking/TEMPLATE-pupil-record.md` — 9-section pupil record template
- Sample pupil files: `8L-alice.md`, `8L-matilda.md`, `8S-raffy.md`, `7M-ava.md`, `7S-barron.md`
- `.planning/PROJECT.md` — confirmed requirements, constraints, MARVIN integration needs

All 46 pupil files are structurally identical (consistent with template). No pupil data has been entered yet — all fields are blank. This is a clean migration opportunity.

---

## 1. Architecture Decision: Which Option?

### Option A: One master spreadsheet, multiple tabs
All data lives in a single Google Sheets file. Tabs for overview, each form, scholarship, config/lookup.

### Option B: One spreadsheet per form, master aggregator
Four form-level spreadsheets feeding a separate overview via IMPORTRANGE.

### Option C: Database-style master sheet + view spreadsheet
One row per pupil in a flat data sheet; separate view spreadsheet pulls from it.

---

### Recommendation: Option A (Single Spreadsheet, Multiple Tabs)

**Use Option A.** Here is why:

**Against Option B (multi-spreadsheet):**
- IMPORTRANGE requires explicit authorisation per file pair. Each new link prompts a permissions dialogue. With 4 form spreadsheets feeding 1 master, you have 4 IMPORTRANGE links to manage, all of which silently break if permissions lapse.
- MARVIN's MCP tools operate on spreadsheet ID + range. Four spreadsheets means MARVIN must track four IDs and know which one to write to. One spreadsheet means one ID, period.
- Form tutors needing to check their own form would need to open a different file from what SLT views — more friction, not less.

**Against Option C (database + view):**
- The pupil data in this system is not high-frequency transactional data. It is updated perhaps weekly to fortnightly. A full database/view split adds complexity (IMPORTRANGE or Apps Script sync) for no practical benefit at this scale.
- 46 rows is not a scale problem for any tab layout.
- "View spreadsheets" are harder for staff to understand and harder for MARVIN to write to safely.

**For Option A:**
- Single spreadsheet ID — MARVIN always knows exactly where to write.
- Google's built-in revision history covers the whole file. One audit trail.
- Named ranges can span tabs within the same file without IMPORTRANGE, so cross-tab formulas are instant and never break on authorisation.
- Staff access is one share, one link. SLT, tutors, Josh — all in one file with appropriate sharing.
- Tabs are cheap. Adding Year 7 is two more tabs, not two more files.

---

## 2. Tab Structure

### Recommended Tab List

| Tab Name | Purpose | Primary User |
|----------|---------|--------------|
| `Overview` | RAG dashboard, all 46 pupils, filterable — this is the "front page" | Josh, SLT |
| `8L` | Full data for 14 pupils in 8L (Mr Lamb / Josh's tutor group) | Josh |
| `8S` | Full data for 13 pupils in 8S | Miss Soppitt, Josh |
| `7M` | Full data for 9 pupils in 7M | Mrs Smith, Josh |
| `7S` | Full data for 10 pupils in 7S | Mrs Scott, Josh |
| `Scholarships` | Dedicated tracker for scholarship candidates across both years | Josh |
| `Interventions` | Log of all interventions across year group (append-only) | Josh, staff |
| `Parent Contact` | Log of parent/guardian contacts across year group (append-only) | Josh, tutors |
| `Attendance` | Attendance summary per pupil per half-term | Josh |
| `CAT4` | Cognitive ability scores — verbal, non-verbal, spatial, quantitative | Josh, SLT |
| `iSAMS Import` | Staging area for pasted CSV data from iSAMS exports | MARVIN only |
| `Config` | Named ranges definitions, form lists, subject lists, tutor names | MARVIN, Josh |

**Total: 12 tabs.** Manageable. Each has a clear single purpose.

**Tab ordering rationale:**
- `Overview` first — it is the landing tab, the one Josh (and visitors like SLT or inspectors) open to.
- Year 8 tabs before Year 7 — Year 8 is the active cohort, CE imminent, scholarship candidate active.
- `Scholarships`, `Interventions`, `Parent Contact`, `Attendance`, `CAT4` — functional logs, accessed by need.
- `iSAMS Import` and `Config` at the end — operational/infrastructure, not for daily browsing.

---

## 3. Column Headers for Key Sheets

### `Overview` Tab

One row per pupil. The RAG dashboard. Columns pull from form tabs via formula.

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | `PupilID` | Text | Unique ID: form + surname. e.g. `8L-Gardener`. Used by MARVIN as stable key. |
| B | `Firstname` | Text | |
| C | `Surname` | Text | |
| D | `Form` | Text | 8L / 8S / 7M / 7S |
| E | `Year` | Number | 7 or 8 |
| F | `Tutor` | Text | |
| G | `Boarding/Day` | Text | Boarding / Day |
| H | `RAG_Status` | Text | Green / Amber / Red |
| I | `Priority_Level` | Text | Routine / Monitor / Urgent |
| J | `Pastoral_Concern` | Text | None / Low / Medium / High |
| K | `PA_Flag` | Text | Yes / No (Persistent Absence below 90%) |
| L | `Scholarship_Status` | Text | Not applicable / Watch / Strong candidate |
| M | `Effort_Rating` | Number | 1–5 |
| N | `HT_Current` | Number | Current half-term (1–6), set in Config |
| O | `Overall_Grade_HT1` | Text | Average/summary grade for HT1 |
| P | `Overall_Grade_HT2` | Text | |
| Q | `Overall_Grade_HT3` | Text | |
| R | `Last_Updated` | Date | |
| S | `Notes_Flags` | Text | Free-text alert field — brief only |
| T | `Record_Tab` | Text | Hyperlink formula to form tab row (for drill-down) |

**Filter views to create:**
- By Form (8L, 8S, 7M, 7S)
- By Year (7, 8)
- By RAG_Status (Red first)
- By Scholarship_Status
- By PA_Flag = Yes

### Form Tabs (e.g. `8L`)

One row per pupil. Wider than Overview — full academic grid.

**Header block (columns A–M): Identity**

| Col | Header |
|-----|--------|
| A | `PupilID` |
| B | `Firstname` |
| C | `Surname` |
| D | `Form` |
| E | `Tutor` |
| F | `Boarding/Day` |
| G | `RAG_Status` |
| H | `Priority_Level` |
| I | `Pastoral_Concern` |
| J | `Scholarship_Status` |
| K | `Effort_Rating` |
| L | `Last_Updated` |
| M | `Notes` |

**Academic grades (columns N–AE): Subject x HT**

Pattern: `{Subject}_HT{n}` — e.g. `Eng_HT1`, `Eng_HT2`, `Maths_HT1`, etc.

Subjects in order: English, Maths, Science, French, Spanish, History, Geography, Art, Music, Drama, PE, RS
Half-terms: HT1–HT6

That is 12 subjects x 6 half-terms = 72 grade columns (cols N through CQ if fully populated). In practice, freeze all columns except the current HT being populated; hide future HT columns until needed.

**Value-added block (cols after grades):**

| Header |
|--------|
| `Baseline_Source` |
| `Baseline_Score` |
| `Baseline_Date` |
| `Current_Attainment` |
| `Progress_Notes` |
| `Predicted_Trajectory` |

**CAT4 block:**

| Header |
|--------|
| `CAT4_Verbal` |
| `CAT4_NonVerbal` |
| `CAT4_Spatial` |
| `CAT4_Quantitative` |
| `CAT4_Overall` |
| `CAT4_Date` |

**Attendance summary (current year):**

| Header |
|--------|
| `Att_HT1_Present` |
| `Att_HT1_Absent` |
| `Att_HT1_Pct` |
| `Att_HT2_Present` |
| `Att_HT2_Absent` |
| `Att_HT2_Pct` |
| *(repeat through HT6)* |
| `PA_Flag` |

**Wellbeing/contextual:**

| Header |
|--------|
| `Wellbeing_Summary` |
| `Contextual_Factors` |
| `Parent_Guardian_Names` |
| `Comms_Preferences` |

**Extracurricular:**

| Header |
|--------|
| `Activities` |
| `Sports_Teams` |
| `Boarding_House` |
| `Boarding_Notes` |
| `Interests` |

### `Scholarships` Tab

| Col | Header | Notes |
|-----|--------|-------|
| A | `PupilID` | Links to form tab |
| B | `Firstname` | |
| C | `Surname` | |
| D | `Form` | |
| E | `Scholarship_Potential` | Watch / Strong candidate |
| F | `Subject_Strengths` | |
| G | `Target_Senior_Schools` | |
| H | `Interview_Date` | |
| I | `Interview_Outcome` | |
| J | `Prep_Sessions_Count` | Number |
| K | `Last_Prep_Session` | Date |
| L | `Staff_Responsible` | |
| M | `Evidence_Summary` | |
| N | `Next_Action` | |
| O | `Notes` | |

### `Interventions` Tab (append-only log)

| Col | Header |
|-----|--------|
| A | `Date` |
| B | `PupilID` |
| C | `Firstname` |
| D | `Surname` |
| E | `Form` |
| F | `Intervention_Type` |
| G | `Delivered_By` |
| H | `Target_Area` |
| I | `Outcome_Notes` |
| J | `Follow_Up_Required` |
| K | `Follow_Up_Date` |
| L | `Logged_By` |

### `Parent Contact` Tab (append-only log)

| Col | Header |
|-----|--------|
| A | `Date` |
| B | `PupilID` |
| C | `Firstname` |
| D | `Surname` |
| E | `Form` |
| F | `Contact_Method` |
| G | `Person_Spoken_To` |
| H | `Subject` |
| I | `Outcome` |
| J | `Next_Step` |
| K | `Logged_By` |

### `iSAMS Import` Tab

Staging area only. MARVIN reads from here, maps to form tabs, then clears. Not for human browsing.

| Col | Header |
|-----|--------|
| A | `Import_Date` |
| B | `Pupil_Firstname` |
| C | `Pupil_Surname` |
| D | `Form` |
| E | `Subject` |
| F | `Grade` |
| G | `HT` |
| H | `Status` | Pending / Mapped / Error |

### `Config` Tab

Key-value lookup table. Row 1 = header. Two-column structure.

| Key | Value |
|-----|-------|
| `Current_HT` | 3 |
| `Academic_Year` | 2025-26 |
| `Year8_Forms` | 8L,8S |
| `Year7_Forms` | 7M,7S |
| `Subjects` | English,Maths,Science,French,Spanish,History,Geography,Art,Music,Drama,PE,RS |
| `Tutor_8L` | Mr Lamb |
| `Tutor_8S` | Miss Soppitt |
| `Tutor_7M` | Mrs Smith |
| `Tutor_7S` | Mrs Scott |
| `RAG_Options` | Green,Amber,Red |
| `Priority_Options` | Routine,Monitor,Urgent |
| `Pastoral_Options` | None,Low,Medium,High |
| `Scholarship_Options` | Not applicable,Watch,Strong candidate |
| `Intervention_Types` | Academic support,Pastoral check-in,Parent meeting,Referral to SENCO,Scholarship preparation,Peer mentoring,External agency,Other |

---

## 4. Data Relationships

### How Overview pulls from Form Tabs

Use direct cell references within the same file — not IMPORTRANGE. Since all tabs are in one spreadsheet, cross-tab references are fast, always authorised, and never break.

Example Overview formula for RAG Status (row 2, pupil 8L-Gardener):
```
='8L'!G3
```

For scalability, use VLOOKUP keyed on PupilID to pull from form tabs into Overview:
```
=IFERROR(VLOOKUP(A2,'8L'!A:M,7,FALSE),"")
```
Where column 7 in the 8L tab = `RAG_Status`.

This means Overview rows can be in any order (sorted by RAG, alphabetical, etc.) without breaking formulas. VLOOKUP on PupilID is the glue.

### Named Ranges

Define named ranges for any cell or column range MARVIN will write to repeatedly. Named ranges survive column insertions (unlike `A1` references). Define in Sheets via Data > Named ranges.

Priority named ranges to create:

| Named Range | Covers | Purpose |
|-------------|--------|---------|
| `Config_CurrentHT` | Config!B2 | What half-term are we in — read by MARVIN before any grade write |
| `Overview_RAG` | Overview!H2:H47 | Full RAG column — MARVIN reads for briefings |
| `Overview_All` | Overview!A2:T47 | Full overview data — MARVIN reads for status checks |
| `8L_Grades` | 8L!N2:CQ15 | All grade cells for 8L — MARVIN writes here from iSAMS import |
| `8S_Grades` | 8S!N2:CQ14 | |
| `7M_Grades` | 7M!N2:CQ10 | |
| `7S_Grades` | 7S!N2:CQ11 | |
| `Interventions_Log` | Interventions!A:L | Full log — MARVIN appends here |
| `Parent_Contact_Log` | Parent Contact!A:K | Full log — MARVIN appends here |
| `iSAMS_Staging` | iSAMS Import!A:H | MARVIN reads and clears this after processing |

### PupilID as the Stable Key

Every sheet uses `PupilID` as the primary lookup key. Format: `{form}-{surname}` in lowercase, e.g. `8l-gardener`.

Rationale: First names can be ambiguous across year groups (there are duplicate first names: both years have an Archie, both have a Henry, both have a Hugo). Surname + form is unique across this dataset.

MARVIN should always use PupilID, never row numbers, when targeting a specific pupil's data.

---

## 5. Field Mapping: Markdown to Sheets Columns

### Section 1 (Header) → Form tab identity columns

| Markdown Field | Sheets Column | Notes |
|----------------|---------------|-------|
| Name (full) | `Firstname` + `Surname` | Split into two columns |
| Form | `Form` | |
| Tutor | `Tutor` | |
| Boarding / Day | `Boarding/Day` | |
| Last Updated | `Last_Updated` | |
| RAG Status | `RAG_Status` | |

### Section 1 (Academic Snapshot) → Grade columns

| Markdown Field | Sheets Columns | Notes |
|----------------|---------------|-------|
| Subject x HT table | `{Subject}_HT{n}` columns | 12 subjects x 6 HTs = 72 columns |
| Effort Rating | `Effort_Rating` | Single column, 1–5 |
| Academic Concerns | `Notes` (partial) | Fold into Notes field; too free-form for a column |
| Academic Strengths | `Notes` (partial) | Same — fold into Notes |

### Section 2 (Value-Added) → Value-added block

| Markdown Field | Sheets Column |
|----------------|---------------|
| Baseline / Starting Point | `Baseline_Source` + `Baseline_Score` + `Baseline_Date` |
| Current Attainment | `Current_Attainment` |
| Progress Made | `Progress_Notes` |
| Predicted Trajectory | `Predicted_Trajectory` |
| Notable Interventions and Impact | Goes to `Interventions` tab |

### Section 3 (Pastoral Notes) → Interventions tab + form tab summary

| Markdown Field | Sheets Location |
|----------------|----------------|
| Dated pastoral notes table | `Interventions` tab (one row per note, type = "Pastoral check-in") |
| Current Pastoral Concern Level | `Pastoral_Concern` column on form tab |
| Wellbeing Summary | `Wellbeing_Summary` column on form tab |
| Known Contextual Factors | `Contextual_Factors` column on form tab |

### Section 4 (Attendance) → Form tab attendance block + Attendance tab

| Markdown Field | Sheets Location |
|----------------|----------------|
| HT1–HT6 days present/absent/% | `Att_HT{n}_Present`, `Att_HT{n}_Absent`, `Att_HT{n}_Pct` on form tab |
| Persistent Absence Flag | `PA_Flag` on form tab and Overview |

### Section 5 (Interventions Log) → Interventions tab

| Markdown Field | Sheets Column |
|----------------|---------------|
| Date | `Date` |
| Type of Intervention | `Intervention_Type` |
| Delivered By | `Delivered_By` |
| Target Area | `Target_Area` |
| Outcome / Notes | `Outcome_Notes` |
| Follow-up Required? | `Follow_Up_Required` |

### Section 6 (Parent Contact Log) → Parent Contact tab

| Markdown Field | Sheets Column |
|----------------|---------------|
| Date | `Date` |
| Contact Method | `Contact_Method` |
| Person Spoken To | `Person_Spoken_To` |
| Subject | `Subject` |
| Outcome / Next Step | `Outcome` + `Next_Step` |
| Key Parent/Guardian Names | `Parent_Guardian_Names` on form tab |
| Communication Preferences | `Comms_Preferences` on form tab |

### Section 7 (Extracurricular) → Form tab extracurricular block

| Markdown Field | Sheets Column |
|----------------|---------------|
| Activities / Clubs | `Activities` |
| Sports Teams | `Sports_Teams` |
| Boarding House | `Boarding_House` |
| Boarding Notes | `Boarding_Notes` |
| Interests / Passions | `Interests` |

### Section 8 (Scholarship Radar) → Scholarships tab + form tab summary

| Markdown Field | Sheets Location |
|----------------|----------------|
| Scholarship Potential | `Scholarship_Status` on form tab + `Scholarship_Potential` on Scholarships tab |
| Subject Strengths for Scholarship | `Subject_Strengths` on Scholarships tab |
| Evidence of Exceptional Ability | `Evidence_Summary` on Scholarships tab |
| Recommendation to Scholarship Lead | `Notes` on Scholarships tab |

### Section 9 (Summary and Next Actions) → Form tab + Overview

| Markdown Field | Sheets Location |
|----------------|----------------|
| Current Priority Level | `Priority_Level` on form tab + Overview |
| What This Pupil Needs Right Now | `Notes` on form tab (most recent entry) |
| Next Scheduled Review | Not a column — this becomes a MARVIN session prompt |
| Open Actions | Not a column — MARVIN tracks open actions in session/state |

---

## 6. MARVIN Integration Architecture

### How MARVIN Uses the Spreadsheet

MARVIN interacts via Google Workspace MCP tools:
- `read_sheet_values` — read a range by sheet name and A1 notation or named range
- `modify_sheet_values` — write values to a range

MARVIN should never rely on row numbers to locate a pupil. Row numbers shift when rows are inserted, sorted, or filtered. Always use VLOOKUP or MATCH to find the row, then write to it.

### Safe Write Protocol for MARVIN

When MARVIN needs to update a pupil record:

```
1. Read Config!B2 (Current_HT) to confirm which half-term is active
2. Read the relevant form tab (e.g., '8L'!A:A) to find PupilID column
3. MATCH PupilID to locate the exact row number
4. Construct the target cell address from row number + known column position
5. Write value to that cell
6. Write today's date to Last_Updated for that row
7. If RAG status changes, check Overview is consistent (formulas handle this automatically)
```

### Conventions That Make MARVIN Reliable

**Row 1 is always headers, Row 2 is first data row.** No merged cells in data ranges. No blank rows between pupils. This makes MATCH and VLOOKUP deterministic.

**Column positions are fixed and documented in Config.** If column positions must change, update Config. MARVIN reads column positions from Config, not hardcodes them.

**PupilID is always column A on every data tab.** MARVIN finds any pupil by scanning column A. This never changes.

**Append-only tabs (Interventions, Parent Contact) use the next empty row.** MARVIN reads column A to find `COUNTA(A:A)` and writes to `COUNTA(A:A) + 1`. No risk of overwriting.

**iSAMS Import tab is a staging area, not permanent storage.** After MARVIN processes an import, it marks each row Status = "Mapped" (or "Error"), then clears the tab on the next import run. This prevents double-processing.

**Named ranges are the stable API surface.** MARVIN references named ranges, not cell addresses, wherever possible. If a column is inserted, the named range moves with it; a hardcoded `C:C` reference breaks.

### Typical MARVIN Update Scenarios

| Scenario | What MARVIN Does |
|----------|-----------------|
| "Update Matilda's RAG to Amber" | MATCH `8l-constantinou` in 8L col A → write "Amber" to RAG_Status cell for that row |
| "Log an intervention for Raffy" | Append row to Interventions tab with today's date, `8s-batson`, intervention details |
| "Import HT2 grades from iSAMS CSV" | Paste CSV to iSAMS Import tab → MARVIN reads staging area → maps each row to correct pupil + subject + HT grade column → marks status → reports errors |
| "Who are our Amber and Red pupils?" | Read Overview!H2:H47 (RAG_Status) → filter for Amber/Red → return names and forms |
| "Matilda has her scholarship interview on 3 March" | Find Matilda on Scholarships tab → write `2026-03-03` to Interview_Date |

### Data Validation to Set Up

These enforce data quality and make MARVIN writes predictable:

| Column | Validation Rule |
|--------|----------------|
| `RAG_Status` | Dropdown: Green, Amber, Red |
| `Priority_Level` | Dropdown: Routine, Monitor, Urgent |
| `Pastoral_Concern` | Dropdown: None, Low, Medium, High |
| `Scholarship_Status` | Dropdown: Not applicable, Watch, Strong candidate |
| `PA_Flag` | Dropdown: Yes, No |
| `Boarding/Day` | Dropdown: Boarding, Day |
| `Form` | Dropdown: 8L, 8S, 7M, 7S |
| `Effort_Rating` | Number between 1 and 5 |
| `HT` (on Import tab) | Dropdown: 1, 2, 3, 4, 5, 6 |

---

## 7. Change Tracking

### Google Sheets Built-In Revision History

Google Sheets records every change with timestamp and editor (Google Account). This is the primary audit trail. Access via File > Version history > See version history.

Sufficient for this system. No additional audit layer is needed for v1.

### Supplementary: MARVIN Write Log

When MARVIN writes to the spreadsheet, it should note in the session log what it changed and when. This gives Josh a human-readable record of MARVIN-driven changes that is separate from the Google version history.

Pattern:
```
[2026-02-23 14:32] MARVIN updated RAG_Status for 8l-constantinou → Amber
[2026-02-23 14:33] MARVIN appended intervention row: 8s-batson, Pastoral check-in, 2026-02-23
```

This is low overhead — MARVIN adds it to the session log as a side effect of any write operation.

### The `Last_Updated` Column

Every row on every form tab has a `Last_Updated` column. MARVIN writes today's date here any time it modifies that row. Humans should also update it when they edit manually. This gives a quick visual of stale records without trawling version history.

---

## 8. Scalability

### Adding Year 7 to the Spreadsheet

The architecture is already Year 7 ready:
- `7M` and `7S` tabs exist in the recommended tab structure from day one.
- `Overview` has a `Year` column — filter views for Year 7 and Year 8 are independent.
- 19 Year 7 pupils is smaller than Year 8 (27) — no performance concerns.
- PupilID format (`7m-andrews`, `7s-clift`) distinguishes from Year 8 without any schema change.

Expansion is: add pupils to `7M` and `7S` tabs, populate their Overview rows. Done.

### If Cohort Grows Beyond ~150 Pupils

At this size, a single spreadsheet remains performant. Google Sheets handles up to 10 million cells. 150 pupils x ~100 columns = 15,000 cells — trivially small.

If the system were extended to the full school (500+ pupils), the architecture would need revisiting — but that is out of scope and unlikely.

### Adding New Data Types (e.g. Exam Results, CE Scores)

Add columns to the right of existing data on form tabs. Named ranges can be updated to include new columns. MARVIN reads column positions from Config, so no MARVIN logic changes — just update Config.

A dedicated `Exams` tab following the same append-only log pattern as `Interventions` would be the right move for CE mock scores specifically, since they generate multiple rows per pupil (different papers, different sittings).

### Adding Staff Access

Google Drive sharing handles this:
- SLT: view only
- Form tutors: edit their own form tab (Sheet-level protection with exceptions per tab)
- Josh: full edit
- MARVIN: writes via service account or OAuth — same as Josh's access

Tab-level protection is the key tool. Lock the `Config` tab to Josh/MARVIN only. Lock the `Overview` tab to read-only for tutors. Each tutor can edit their own form tab.

---

## Summary Recommendations

1. **One spreadsheet, 12 tabs.** Single file, single ID, single access URL.
2. **PupilID as the universal key.** Format `{form}-{surname}` (lowercase). Every tab, every lookup.
3. **Named ranges over cell addresses.** Especially for MARVIN — the named range is the contract.
4. **Overview driven by VLOOKUP from form tabs.** No IMPORTRANGE, no Apps Script needed for basic cross-tab data.
5. **Append-only pattern for logs.** Interventions, Parent Contact — never edit, only append. MARVIN finds next empty row each time.
6. **iSAMS Import as a staging tab.** Paste → MARVIN maps → mark status → clear. Never leave raw data sitting there.
7. **Row 1 always headers, column A always PupilID.** Non-negotiable conventions MARVIN relies on.
8. **Data validation dropdowns on RAG, Priority, Pastoral, Scholarship columns.** Enforces consistency for both human edits and MARVIN writes.
9. **MARVIN logs every write to session log.** Human-readable audit trail alongside Google's version history.
10. **Year 7 tabs built from day one, even if initially sparse.** Expansion cost is near-zero.

---

*Research confidence: HIGH — based on direct file inspection and established Google Sheets patterns. No speculative claims.*
