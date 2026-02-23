# Feature Landscape: Y7&8 Pupil Tracking Dashboard

**Domain:** School pastoral/academic tracking system (Google Sheets, Head of Year)
**Researched:** 2026-02-23
**Confidence:** HIGH for domain knowledge and iSAMS field structures; MEDIUM for iSAMS exact export column names (public documentation is sparse — verified against multiple integration guides)

---

## Context

- **Cohort:** ~46 pupils across 4 forms: 7M, 7S, 8L, 8S
- **Primary user:** Josh (Head of Year 7&8, Head of Languages, Scholarship Lead)
- **Secondary users:** Form tutors (4), subject teachers, SLT
- **Immediate pressure:** CE Mocks imminent; scholarship candidate (Matilda Constantinou, Art interview w/c 2 March 2026) active
- **System:** Google Sheets (hosted), data source: iSAMS exports + manual entry

---

## Prioritised Feature List

### Must-Have (v1 — build before mock season)

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | Cohort overview sheet with RAG status per pupil | Core HOY view — spot who needs attention at a glance |
| 2 | Individual pupil record rows (identity + cognitive + academic + pastoral) | Source of truth for every conversation about a pupil |
| 3 | Academic grades: effort + attainment per subject, per half-term | Core tracking data; already exists in iSAMS reports |
| 4 | CE Mock score entry + predicted vs target grade comparison | Imminent — mocks are happening now |
| 5 | Pastoral log: incident count, commendation count, concern flag, last contact date | HOY primary pastoral tool |
| 6 | Form filter (7M / 7S / 8L / 8S) | Need to view one form at a time for tutor meetings |
| 7 | Scholarship candidate tracker (dedicated section or sheet) | Matilda Constantinou interview in 8 days |
| 8 | SEN / learning support flag visible in overview | Never miss an accommodation requirement |
| 9 | iSAMS identity field import map (documented) | Enables clean data loading from MIS export |
| 10 | Auto-calculated RAG status per pupil | Removes manual judgement for routine monitoring |

### Nice-to-Have (v2 — after mock season)

| # | Feature | Rationale |
|---|---------|-----------|
| 11 | Subject-level RAG breakdown (which subject is pulling a pupil red?) | Useful for subject teacher conversations |
| 12 | Trend arrows (improving / declining / stable) | Adds time dimension to RAG |
| 13 | Parental contact log (date, method, summary) | Currently tracked informally |
| 14 | Attendance flag (% attendance from iSAMS) | Strong predictor; iSAMS exports attendance |
| 15 | Form tutor protected view (see own form only) | Requires Google Sheets sharing permissions work |
| 16 | SLT summary tab (top risks, scholarship status, cohort averages) | Useful for HOY reports to SLT |
| 17 | CE prediction model (CAT4 SAS → expected CE grade) | GL Assessment publish expectation ranges |
| 18 | Year-on-year comparison (Y7 to Y8 performance delta) | Value-added context |
| 19 | Pupil notes / free text field | Ad-hoc context that doesn't fit structured fields |
| 20 | Export to PDF / print-friendly view | For tutor meetings, parents' evenings |

### Explicitly Out of Scope (v1)

| Feature | Why Excluded |
|---------|-------------|
| Real-time iSAMS sync | Requires API credentials and custom scripting — manual export is reliable enough for HOY cadence |
| Safeguarding / child protection records | Must stay in CPOMS or iSAMS, not a spreadsheet — legal and governance reasons |
| Financial / fee information | Not HOY business; lives in bursar systems |
| Full report writing | iSAMS has dedicated report writing module; don't duplicate |
| Parent-facing portal | Out of scope for an internal tracking tool |

---

## Recommended Data Fields: Cohort Overview Row

One row per pupil. This is the primary HOY monitoring view.

### Identity Block (columns A–H)

| Field | Source | Notes |
|-------|--------|-------|
| `Pupil_ID` | iSAMS export | iSAMS internal ID (`SchoolID` / `ManagementSystemID`) — use as stable key |
| `Surname` | iSAMS export | Sort key |
| `Preferred_Name` | iSAMS export | Display name — use this in cells, not Forename |
| `Form` | iSAMS export | 7M / 7S / 8L / 8S — primary filter column |
| `Year_Group` | iSAMS export | 7 or 8 |
| `Gender` | iSAMS export | M / F |
| `Boarding_Status` | iSAMS export | Boarder / Day (day/boarding split affects contact hours and pastoral patterns) |
| `SEN_Flag` | iSAMS export / manual | Y/N — triggers visible marker in overview |

### Cognitive Baseline Block (columns I–N)

| Field | Source | Notes |
|-------|--------|-------|
| `CAT4_Verbal_SAS` | iSAMS / GL Assessment import | Standard Age Score, mean 100 |
| `CAT4_Quantitative_SAS` | iSAMS / GL Assessment import | |
| `CAT4_NonVerbal_SAS` | iSAMS / GL Assessment import | |
| `CAT4_Spatial_SAS` | iSAMS / GL Assessment import | |
| `CAT4_Overall_SAS` | Calculated or imported | Mean of four batteries (or use GL Assessment's composite if provided) |
| `CAT4_Test_Date` | iSAMS / GL Assessment import | Important for interpreting scores relative to age |

### Academic Summary Block (columns O–V)

| Field | Source | Notes |
|-------|--------|-------|
| `Effort_Average` | Calculated from subject sheets | Average effort grade across all subjects (numeric — see grade mapping below) |
| `Attainment_Average` | Calculated from subject sheets | Average attainment grade across all subjects |
| `Effort_RAG` | Formula | Derived from Effort_Average threshold |
| `Attainment_RAG` | Formula | Derived from Attainment_Average threshold |
| `Subjects_Below_Target` | Formula | Count of subjects where attainment is more than one band below target |
| `Effort_Concerns` | Formula | Count of subjects where effort grade is "Unsatisfactory" or equivalent |

### CE / Exam Block (columns W–Z, Year 8 only)

| Field | Source | Notes |
|-------|--------|-------|
| `CE_Mock_Average` | Manual entry | Overall average % across CE mock subjects |
| `CE_Target_Grade` | Manual entry | Target set by receiving school (where known) |
| `CE_Predicted_Grade` | Manual entry | Teacher consensus prediction |
| `CE_Risk_Flag` | Formula | Red if predicted < target by defined margin |

### Pastoral Summary Block (columns AA–AE)

| Field | Source | Notes |
|-------|--------|-------|
| `Pastoral_RAG` | Formula | Derived from incident count + commendation count |
| `Incident_Count_Term` | Manual / iSAMS | Count of logged pastoral incidents this term |
| `Commendation_Count_Term` | Manual / iSAMS | Count of commendations this term |
| `Concern_Flag` | Manual | Y/N — HOY has flagged this pupil for active monitoring |
| `Last_Parent_Contact` | Manual | Date of most recent parental contact |

### Overview RAG (column AF)

| Field | Source | Notes |
|-------|--------|-------|
| `Overall_RAG` | Formula | Composite: Red if ANY of Effort/Attainment/Pastoral/CE is Red; Amber if any Amber; Green otherwise |
| `Scholarship_Flag` | Manual | Y/N — is this pupil a scholarship candidate? |

---

## Recommended Data Fields: Individual Pupil Record

This is a detailed per-pupil sheet (one tab per pupil, or a detail pane linked from the overview). For 46 pupils, a single tab per pupil is manageable but a detail view in the same sheet is more practical — recommend a "Pupil Detail" lookup sheet where you select a pupil and see full data.

### Full Identity

All fields from overview identity block, plus:

| Field | Source | Notes |
|-------|--------|-------|
| `Forename` | iSAMS | Legal first name (for official correspondence) |
| `Date_of_Birth` | iSAMS | For age-related context |
| `Nationality` | iSAMS | Relevant for EAL flag |
| `EAL_Flag` | iSAMS / manual | English as Additional Language |
| `House` | iSAMS | Boarding house (boarders) or day house |
| `Target_Senior_School` | Manual | Where are they going? (CE context) |
| `Scholarship_Target_School` | Manual | Where scholarship is for (may differ from CE destination) |

### SEN Detail

| Field | Source | Notes |
|-------|--------|-------|
| `SEN_Category` | iSAMS SEN Manager | e.g., Dyslexia, Dyscalculia, ADHD, SpLD, ASD, EAL, None |
| `SEN_Support_Level` | iSAMS | None / In-class support / Withdrawal / EHCP (or school equivalent) |
| `Exam_Access_Arrangements` | iSAMS / manual | 25% extra time, reader, scribe, separate room, etc. |
| `Learning_Support_Contact` | Manual | Name of LS teacher responsible |

### CAT4 Full Profile

| Field | Source | Notes |
|-------|--------|-------|
| `CAT4_Verbal_SAS` | GL Assessment | |
| `CAT4_Verbal_Stanine` | GL Assessment | 1–9, average 4–6 |
| `CAT4_Verbal_NPR` | GL Assessment | National Percentile Rank |
| `CAT4_Quantitative_SAS` | GL Assessment | |
| `CAT4_Quantitative_Stanine` | GL Assessment | |
| `CAT4_Quantitative_NPR` | GL Assessment | |
| `CAT4_NonVerbal_SAS` | GL Assessment | |
| `CAT4_NonVerbal_Stanine` | GL Assessment | |
| `CAT4_NonVerbal_NPR` | GL Assessment | |
| `CAT4_Spatial_SAS` | GL Assessment | |
| `CAT4_Spatial_Stanine` | GL Assessment | |
| `CAT4_Spatial_NPR` | GL Assessment | |
| `CAT4_Overall_SAS` | GL Assessment | Mean of four batteries |
| `CAT4_Profile_Note` | Manual | e.g., "Verbal strong, Spatial weak — likely dyslexic profile" |
| `CAT4_Test_Date` | GL Assessment | |
| `CAT4_Test_Year_Group` | GL Assessment | What year were they in when tested? |

**CAT4 note:** GL Assessment reports individual SAS, stanine, and NPR for each battery. The "SAS" has mean 100, SD 15. Use SAS as the primary tracking field; stanines for quick communication with parents.

### Academic Grades — Per Subject

Replicated for each subject. CE subjects for Year 8: English, Mathematics, Science, French, History, Geography, RS/TPR. Optional: Latin, German, Spanish, Art. Year 7 uses school's own subjects (align with HOY's subject list).

| Field | Notes |
|-------|-------|
| `[Subject]_Effort_HT1` | Half-term 1 effort grade |
| `[Subject]_Attainment_HT1` | Half-term 1 attainment grade |
| `[Subject]_Effort_HT2` | Half-term 2 effort grade |
| `[Subject]_Attainment_HT2` | Half-term 2 attainment grade |
| `[Subject]_Effort_HT3` | etc. |
| `[Subject]_Attainment_HT3` | |
| `[Subject]_Target_Grade` | Set at start of year |
| `[Subject]_Teacher` | Useful for knowing who to contact |

**Grade mapping recommendation:** iSAMS typically uses school-defined grade scales. Map to numeric for RAG calculations:

| Common Label | Numeric Value | RAG |
|-------------|---------------|-----|
| Excellent / Outstanding | 5 | Green |
| Good / Above Expected | 4 | Green |
| Satisfactory / Meeting Expected | 3 | Amber (borderline) |
| Needs Improvement / Below Expected | 2 | Amber |
| Unsatisfactory / Well Below | 1 | Red |

Store the original text grade and calculate numeric via VLOOKUP or a named mapping table.

### CE Mock Results (Year 8)

| Field | Notes |
|-------|-------|
| `CE_Mock_English_%` | Percentage score |
| `CE_Mock_Maths_%` | |
| `CE_Mock_Science_%` | |
| `CE_Mock_French_%` | |
| `CE_Mock_History_%` | |
| `CE_Mock_Geography_%` | |
| `CE_Mock_RS_%` | |
| `CE_Mock_Latin_%` | If applicable |
| `CE_Mock_Date` | When was this mock sat? |
| `CE_Mock_Session` | Autumn / Spring (can have multiple) |
| `CE_Target_School` | |
| `CE_Target_Grade_Overall` | School-specific (A/B/C or % threshold) |
| `CE_Predicted_Grade_Overall` | HOY / teacher consensus |
| `CE_At_Risk` | Formula: Y if predicted below target |

### Pastoral Log

This is a rolling log — recommend a separate sub-table per pupil or a separate "Pastoral Log" sheet with Pupil_ID as foreign key.

| Field | Notes |
|-------|-------|
| `Log_Date` | |
| `Log_Type` | Incident / Commendation / Concern / Parent Contact / Other |
| `Log_Summary` | Free text (keep brief — 1-2 sentences) |
| `Log_Recorded_By` | Staff member |
| `Follow_Up_Required` | Y/N |
| `Follow_Up_Date` | |
| `Follow_Up_Complete` | Y/N |

### Scholarship Record

| Field | Notes |
|-------|-------|
| `Scholarship_Status` | Active / Withdrawn / Successful / Unsuccessful |
| `Target_School_Scholarship` | School pupil is applying for scholarship to |
| `Scholarship_Type` | Academic / Art / Music / Sport / All-Rounder |
| `Application_Submitted_Date` | |
| `Interview_Date` | |
| `Interview_School` | |
| `Prep_Sessions_Log` | Rolling count of prep sessions completed |
| `Interview_Outcome` | Awarded / Shortlisted / Unsuccessful / Pending |
| `Award_Value` | % if known |
| `Notes` | Free text |

---

## RAG Status Criteria Recommendation

### Pupil Overall RAG — Logic

**Red** (immediate HOY attention):
- Effort average below 2.0 (Needs Improvement threshold in 2+ subjects), OR
- Attainment average below 2.0, OR
- 3+ pastoral incidents this term, OR
- CE predicted grade more than one full grade below target (Year 8), OR
- HOY has set Concern_Flag = Y

**Amber** (monitoring required):
- Effort average 2.0–2.9, OR
- Attainment average 2.0–2.9, OR
- 1–2 pastoral incidents this term with no commendations, OR
- CE predicted grade = target but only just (within agreed margin)

**Green** (on track):
- Effort average 3.0+ across all subjects, AND
- Attainment average 3.0+ across all subjects, AND
- No pastoral incidents OR commendations outweigh incidents, AND
- CE on track or exceeding target

**Override rule:** Concern_Flag = Y always sets Overall_RAG to Red regardless of other scores. HOY retains manual override authority.

### Pastoral RAG — Standalone Logic

| Status | Criteria |
|--------|---------|
| Red | 3+ incidents this term, OR 1 serious incident (as flagged), OR Concern_Flag = Y |
| Amber | 1–2 incidents this term, zero commendations |
| Green | 0 incidents, OR commendations outweigh incidents |

### Effort RAG — Per Subject

| Status | Effort Grade Numeric |
|--------|---------------------|
| Green | 4–5 |
| Amber | 3 |
| Red | 1–2 |

### Attainment RAG — Per Subject

Compare attainment to target grade:

| Status | Criteria |
|--------|---------|
| Green | Meeting or exceeding target |
| Amber | One band below target |
| Red | Two or more bands below target |

---

## Scholarship Tracking Features

The scholarship lead view needs:

### Pipeline Overview
- All active candidates listed (currently: Matilda Constantinou, Art, interview w/c 2 March 2026)
- Status column: Researching schools / Application submitted / Interview scheduled / Interview complete / Outcome received
- Days until interview (formula: `=interview_date - TODAY()`) — highlighted red when <14 days

### Per-Candidate Record
- Candidate name + form
- Target school(s) for scholarship
- Scholarship type (Academic, Art, Music, Sport, All-Rounder, General Excellence)
- Application deadline
- Application submitted date
- Interview date(s) + time + location
- Interview format (portfolio review, aptitude test, interview panel, etc.)
- Prep sessions completed (log with date and focus area)
- Pre-interview checklist (portfolio ready, travel arranged, uniform checked, practice interview done)
- Outcome + award details
- Follow-up actions

### Timeline View
- Chronological list of all upcoming scholarship deadlines and interviews across all candidates
- Filterable by school, type, status

### For Matilda Constantinou Specifically (Art Scholarship)
- Portfolio submission status
- Interview date confirmed: w/c 2 March 2026
- Art teacher liaison contact
- Portfolio pieces listed with completion status

---

## iSAMS CSV Field Mapping

Based on verified integration documentation (Education Perfect, Microlibrarian, MeetTheTeacher, iSAMS Student Manager docs). Confidence: MEDIUM — iSAMS uses a wizard-based export where column names appear as selected, and third-party guides confirm the core set. Full field list requires direct system access.

### Confirmed iSAMS Export Field Names

| iSAMS Export Field Name | Maps To Dashboard Field | Notes |
|------------------------|------------------------|-------|
| `ManagementSystemID` | `Pupil_ID` | iSAMS's own unique student ID — use as join key |
| `Surname` | `Surname` | Direct match |
| `Forename` | `Forename` | Legal first name |
| `Preferred Name` (or `PreferredName`) | `Preferred_Name` | Use this for display |
| `Gender` | `Gender` | M / F in iSAMS |
| `DateOfBirth` | `Date_of_Birth` | DD/MM/YYYY format typical |
| `YearGroup` (or `Year Group (NC)`) | `Year_Group` | May export as "Year 7", "Year 8" — strip "Year " prefix |
| `TutorGroup` (or `Form`) | `Form` | 7M, 7S, 8L, 8S |
| `Student Email Address` | — | Useful for future integrations |
| `School ID` | `Pupil_ID` (alternative) | Some iSAMS configs export this as the primary ID |

### Fields Available But Not Always Included in Default Export

| iSAMS Module | Field Category | Dashboard Use |
|-------------|----------------|--------------|
| Student Manager | Medical conditions | SEN context (do NOT copy to tracking sheet — stays in iSAMS) |
| Student Manager | Nationality | EAL flag |
| Student Manager | Transport details | Boarding/day indicator (cross-reference) |
| SEN Manager / Student Registers | SEN Register entry | SEN_Flag = Y if pupil appears in SEN Register export |
| Tracking Manager | Effort and attainment grades | Academic grades (export from Tracking Manager separately) |
| Tracking Manager | Grade summaries, averages | Can export per-subject per-term grades |
| Exam module | CE mock scores, exam entries | CE mock data if entered in iSAMS |

### Fields iSAMS Does NOT Export Cleanly (Require Manual Entry)

| Field | Reason | Source |
|-------|--------|--------|
| `CAT4_*` scores | GL Assessment is a separate system; iSAMS Tracking Manager can import but it's a custom setup | GL Assessment CSV import |
| `Boarding_Status` | Available in system but not in standard pupil export wizard; may need custom report | iSAMS custom report or manual |
| `SEN_Category` | SEN register exports separately from pupil record export | iSAMS SEN Register export |
| `Exam_Access_Arrangements` | Stored in SEN/pastoral notes | iSAMS SEN Manager or manual |
| `Scholarship_*` fields | Not a standard iSAMS field | 100% manual |
| `CE_Mock_*` scores | Only in iSAMS if exams were entered there | Manual entry or Tracking Manager |
| `Concern_Flag` | HOY judgement — not an iSAMS concept | Manual |

### Recommended Import Workflow

1. Export from iSAMS Pupil Manager (Student Manager > Export > select fields listed above) → CSV
2. Paste into a hidden "iSAMS Import" sheet in the Google Sheet
3. IMPORTRANGE or VLOOKUP from import sheet into dashboard using `ManagementSystemID` as join key
4. Separate GL Assessment CAT4 export → paste into "CAT4 Import" sheet
5. Tracking Manager grades export → paste into "Grades Import" sheet (one row per pupil per subject per term)
6. All three joined by `ManagementSystemID` / `SchoolID`

---

## Staff Access Patterns

| Role | What They Need to See | What They Edit | Recommended Access |
|------|-----------------------|----------------|-------------------|
| Josh (HOY + Languages) | Everything | Everything | Editor — full access |
| Form tutors (4) | Their form only: all pupil data for 7M/7S/8L/8S | Pastoral notes for their form, concern flag | Commenter or Editor scoped to their form tab (Google Sheets doesn't have row-level permissions natively — use separate form tabs or a protected range workaround) |
| Subject teachers | Individual pupils' grades in their subject | Effort/attainment grades for their subject | Not practical in a single Google Sheet — consider Tracking Manager in iSAMS for teacher grade entry |
| SLT | Summary/overview only: RAG status, headline stats, scholarship pipeline | Nothing (read only) | Viewer on a summary tab |
| Learning Support | SEN-flagged pupils only | SEN detail, access arrangements | Commenter on SEN column range |

**Practical note on form tutor access:** Google Sheets row-level permissions require Google Apps Script. For v1, simplest approach is: separate tabs per form (7M, 7S, 8L, 8S), protected so each tutor can only edit their form's tab. Overview tab is HOY-only or read-only for tutors.

---

## Feature Dependencies

```
iSAMS export (identity) → Cohort overview rows (foundation)
    └─→ Individual pupil record lookup
    └─→ RAG status calculations
    └─→ Scholarship tracker (pupil already exists in system)

CAT4 import → CAT4 block in pupil record
    └─→ CE prediction model (v2)

Academic grades (manual entry or Tracking Manager export) → Effort/Attainment RAG
    └─→ Subject-level breakdown (v2)
    └─→ Overall RAG composite

Pastoral log entries → Pastoral RAG
    └─→ Concern flag (manual override)
    └─→ Overall RAG composite

CE mock scores (manual) → CE_Risk_Flag
    └─→ Overall RAG composite (Year 8 only)

Overall RAG → Cohort overview view (final output)
```

---

## MVP Recommendation

Build in this order for maximum immediate value:

**Week 1 (before mock results are in):**
1. Cohort overview sheet with identity fields imported from iSAMS (forms 7M, 7S, 8L, 8S)
2. SEN flag, boarding status, concern flag columns
3. Scholarship tracker tab (immediate: Matilda Constantinou's art interview in 8 days)

**Week 2 (as mock results arrive):**
4. CE mock score entry columns + CE RAG formula
5. Effort/attainment grade columns (last full report data — can be entered manually or imported from Tracking Manager)
6. Overall RAG formula

**Week 3+ (ongoing refinement):**
7. Pastoral log sub-sheet
8. CAT4 data import
9. Form tutor view (separate tabs or protected ranges)

**Defer to v2:**
- Subject-level RAG breakdown
- Trend arrows
- Attendance flag
- SLT summary tab
- CE prediction model

---

## Sources

- iSAMS Export Documentation: [Creating a CSV from iSAMS](https://cdn.microlibrarian.net/importwizard/csv/helpers/mis-isams.html) — confirmed `ManagementSystemID`, `Surname`, `Forename`, `Gender`, `DateOfBirth`, `YearGroup`, `TutorGroup`
- iSAMS Pupil Manager: [Export Pupil Records](https://knowledgebase.reading-cloud.com/knowledge-base/exporting-a-csv-isams) — confirmed field wizard structure
- iSAMS Education Perfect integration: [How to export data from iSAMS](https://help.educationperfect.com/article/2065-how-to-export-data-from-isams) — confirmed `Preferred Name`, `Student Email Address`, `School ID`
- iSAMS Student Manager module: [Student Manager](https://www.isams.com/platform/modules/student-manager/) — confirmed SEN, discipline, transport, medical record categories
- iSAMS Tracking Manager: [Tracking Manager](https://www.isams.com/platform/modules/tracking-manager/) — confirmed grades, exam results, baseline test import capability
- CAT4 score structure: [CAT4 Test Results Explained](https://cat4-prep.com/cat4-test-results/) — confirmed four batteries, SAS (mean 100, SD 15), stanines 1–9, NPR
- CE 13+ subjects: [ISEB Common Entrance at 13+](https://www.iseb.co.uk/assessments/common-entrance/at-13-for-schools/) — confirmed compulsory (English, Maths, Science) + optional subjects
- iSAMS SEN Manager: [SEN Manager](https://www.isams.com/platform/modules/sen-manager/) — confirmed SEN Register as separate module
