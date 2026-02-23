# Domain Pitfalls: Y7&8 Pupil Tracking Dashboard

**Domain:** Google Sheets-based pupil progress tracking system
**Researched:** 2026-02-23
**Scope:** ~46 pupils, 4 forms (7M, 7S, 8L, 8S), maintained by MARVIN (AI via MCP) and human staff

---

## Critical Pitfalls

Mistakes that cause data loss, compliance failures, or structural rewrites.

---

### Pitfall 1: Staff Overwriting Formula Cells with Paste Operations

**Severity:** HIGH

**What goes wrong:** A staff member copies a grade from another sheet and pastes it with Ctrl+V into a cell that contains a formula (e.g., a VLOOKUP pulling from the master roster, or a conditional average). The formula is silently replaced with a static value. The cell still shows the right number — until the source data changes, at which point the cell is now wrong but looks correct.

**Why it happens:** Google Sheets gives no visual indication that a cell contains a formula vs. a static value unless you click it. Staff doing quick bulk entry often paste values over calculated cells without realising.

**Consequences:**
- Silent data corruption: grades or summaries no longer reflect live data
- Errors may not surface until a review meeting or report deadline
- Version history can restore the formula, but only if someone notices and acts fast

**Prevention:**
- Protect all formula cells using Data > Protect sheets and ranges with a hard lock restricted to the sheet owner and MARVIN's service account
- Use soft-lock warnings on adjacent input cells that summarise to formula columns
- Use a visual convention: formula cells in a distinct background colour (e.g., light grey); input cells in white
- Add an Apps Script `onEdit` trigger that checks if a protected cell was edited by comparing it to expected formula output and alerts the editor

**Detection:** Review version history (File > Version History) after any bulk data entry session. Use an Apps Script audit sheet that logs cell changes with timestamps and editor email.

---

### Pitfall 2: AI (MARVIN) Writing to the Wrong Row or Column

**Severity:** HIGH

**What goes wrong:** MARVIN receives an instruction such as "update Amelia Chen's attainment score to 6" and writes to the wrong row because:
- Two pupils have similar names (e.g., "Amelia Chen" in 7M and "Amy Chen" in 8S)
- The spreadsheet has been sorted or filtered differently from when MARVIN last read it
- A new pupil row was inserted, shifting all subsequent rows down

**Why it happens:** The Google Sheets MCP works by row/column coordinates. If MARVIN resolves a pupil to row 14 based on a stale read, then writes to row 14 after a human has inserted a row above, it silently corrupts a different pupil's record.

**Consequences:**
- Wrong pupil's data updated
- No automatic error or alert
- Data may persist wrong until the next data review

**Prevention:**
- Never write by row number alone. MARVIN must always identify the target cell by matching a unique identifier (pupil ID from iSAMS, not name) before writing
- Include a read-then-verify step: after writing, re-read the cell and confirm the pupil name and ID in that row match the intended target
- Lock pupil ID and name columns so they cannot be reordered by sort operations — use freeze panes on identifier columns
- Define a canonical column index reference sheet (a named tab listing column names and their letter/index) so MARVIN reads column positions dynamically rather than hardcoding them
- Log every MARVIN write operation: timestamp, cell reference, previous value, new value, reason

**Detection:** Maintain a MARVIN audit log tab. After each AI-driven update session, MARVIN should report a summary of what it changed (pupil name + ID, field, old value, new value) for human spot-check.

---

### Pitfall 3: Pupil Data in Google Sheets — GDPR / UK Data Protection Non-Compliance

**Severity:** HIGH

**What goes wrong:** Pupil personal data (names, grades, SEN notes, pastoral incident records) is stored in a Google Sheet shared with multiple staff members. This processing of children's personal data triggers obligations under the UK GDPR (Data Protection Act 2018) and ICO guidance.

**Why it happens:** Schools move fast; staff create "working" spreadsheets without engaging the school's DPO or checking data processing agreements with Google Workspace.

**Consequences:**
- ICO investigation and potential enforcement action if a breach occurs
- Parental complaints if sensitive data (SEN, pastoral) is visible to staff who don't need it
- Reputational damage to the school
- Breach notification required to ICO within 72 hours

**Key compliance considerations for Mowden Hall:**
1. **Google Workspace Education agreement:** Mowden Hall must have a Google Workspace for Education account (not consumer Gmail) with a signed Data Processing Agreement from Google. Consumer Google accounts should never hold pupil data.
2. **Lawful basis:** Processing pupil academic data under "legitimate interests" or "public task" — ensure this is documented in the school's privacy notice.
3. **Special category data:** SEN records, medical information, and safeguarding notes are special category data under Article 9 UK GDPR. These require explicit Article 9 basis and should not be visible to general teaching staff. Keep SEN/pastoral detail in a separate, restricted sheet.
4. **Data minimisation:** Only store fields actually needed for pastoral and academic tracking. Avoid importing full iSAMS records if only a subset is required.
5. **Retention:** Define how long data is kept and how it is deleted when pupils leave.
6. **Subject access requests:** Parents and pupils (age 13+) can request to see their data. Ensure the sheet structure supports extracting an individual pupil's record cleanly.

**Prevention:**
- Confirm school has Google Workspace for Education (not consumer accounts) with DPA in place
- Involve the school's DPO or data lead before launch — do a lightweight Data Protection Impact Assessment (DPIA)
- Separate sensitive fields (SEN, pastoral incidents) into a restricted sheet visible only to Head of Year and SENCO
- Never share the sheet link publicly; use explicit user-by-user sharing within the school Google Workspace domain only
- Document the lawful basis and retention period in the school's data register

---

### Pitfall 4: SEN and Pastoral Data Visible to All Staff With Edit Access

**Severity:** HIGH

**What goes wrong:** A form tutor or class teacher is given edit access to the tracking dashboard to update their pupils' grades. The same sheet contains columns for SEN status, pastoral incident counts, or safeguarding flags. They can see (and accidentally edit) data they are not authorised to see.

**Why it happens:** Google Sheets' access model is file-level by default. Sharing with "edit" access gives full visibility of all tabs and columns unless explicit sheet or range protection is applied.

**Consequences:**
- Data protection breach (special category data visible to unauthorised staff)
- Risk of accidental deletion or modification of sensitive records
- Staff seeing data about pupils in other forms who are not their responsibility

**Prevention:**
- Separate SEN and pastoral records into a dedicated hidden/protected sheet tab
- Apply sheet-level protection to the SEN tab: only visible to Head of Year and SENCO (restrict via Data > Protect sheets)
- For the main dashboard, use column-level protection to lock any columns containing sensitive flags
- Consider a tiered sheet structure: one "staff view" sheet with safe-to-share columns (form, grades, attendance %) and a second "HoY view" sheet with pastoral and SEN detail
- Google Sheets does not support true row-level security; if staff should only see their own form's pupils, create per-form views (separate tabs with FILTER formulas pulling from master data) with appropriate protections

---

## Moderate Pitfalls

Issues that cause frustration, rework, or unreliable data if not addressed.

---

### Pitfall 5: iSAMS CSV Column Order or Header Changes Between Exports

**Severity:** MEDIUM

**What goes wrong:** iSAMS exports a CSV with columns in a particular order (e.g., Forename, Surname, Form, Date of Birth). A future export — perhaps after a system update or using a different report template — has columns in a different order or with renamed headers (e.g., "FirstName" instead of "Forename"). An import routine that references columns by position (column index 2) rather than header name now silently maps data to the wrong fields.

**Why it happens:** MIS systems like iSAMS allow custom report configurations. Different staff may export from different saved report templates.

**Consequences:**
- Pupil names or grades silently mapped to wrong fields
- If not validated, corrupted data enters the master sheet

**Prevention:**
- Always import by header name, not column index. Write the import script to find the "Forename" column by scanning row 1, not by assuming it's column A
- After each import, run a validation check: compare the total pupil count in the CSV against the expected count; flag any new names or missing names
- Store a canonical "expected headers" list and alert (or abort) if the incoming CSV headers don't match
- Standardise on a single saved iSAMS export template and document which template to use

---

### Pitfall 6: iSAMS CSV Encoding Issues — Special Characters in Pupil Names

**Severity:** MEDIUM

**What goes wrong:** Pupil names containing accented characters (e.g., Léa, O'Brien, Ó Ceallaigh) are exported from iSAMS as Windows-1252 encoded CSV and imported into Google Sheets. Characters display as garbled mojibake (e.g., Léa becomes LÃ©a). The pupil's name now differs from their official record and from what appears in other school systems.

**Why it happens:** iSAMS and many Windows applications default to Windows-1252 encoding rather than UTF-8. Google Sheets expects UTF-8.

**Consequences:**
- Pupil name mismatches when cross-referencing with iSAMS or other systems
- VLOOKUP/MATCH formulas fail to find the pupil because the stored name doesn't match the lookup key
- Professional embarrassment if pupil-facing materials use garbled names

**Prevention:**
- Before importing, open the CSV in a text editor (VS Code, Notepad++) and verify/convert encoding to UTF-8 without BOM
- Alternatively, open in Google Sheets directly (Google Sheets handles encoding detection reasonably well when you import via File > Import rather than paste)
- After import, do a spot-check: scan for any cell values containing "Ã", "â", or other mojibake markers using a SEARCH formula
- Maintain an encoding conversion step in any automated import script

---

### Pitfall 7: Duplicate Pupil Names Across Year Groups

**Severity:** MEDIUM

**What goes wrong:** The project brief notes 4 known duplicate name pairs across Y7 and Y8. Any lookup using name as the key (VLOOKUP on "Name" column) will return the first match — which may be the wrong year group's pupil.

**Why it happens:** Using non-unique natural keys (names) as row identifiers is a structural choice that creates silent errors whenever duplicates exist.

**Consequences:**
- Grades, attendance, or pastoral notes written to the wrong pupil's record
- MARVIN could update the wrong pupil when resolving by name
- Dashboard summaries double-count or mis-attribute pupil data

**Prevention:**
- Never use name as the primary key. Use iSAMS pupil ID (or a combination of ID + year group) as the unique identifier for every row
- The "Name" column is for display only; all lookups, references, and MARVIN writes use the unique ID
- Add a validation formula that alerts if any pupil ID appears more than once: `=COUNTIF(ID_column, this_ID)>1`
- When displaying pupil names, always show form alongside name (e.g., "Amelia Chen (7M)") to surface ambiguity visually

---

### Pitfall 8: Concurrent Editing — Human and MARVIN Editing Simultaneously

**Severity:** MEDIUM

**What goes wrong:** A staff member is entering grades into the dashboard at the same time MARVIN is running an automated update via MCP. Google Sheets' real-time sync handles concurrent edits to different cells gracefully, but if both try to write to the same cell within a short window, the last write wins — silently overwriting the other.

**Why it happens:** Google Sheets does not have a locking mechanism for API writes. When MARVIN uses the Sheets API or MCP to write, it does not acquire a cell lock, so a human edit to the same cell at the same moment results in silent overwrite.

**Consequences:**
- A carefully entered teacher grade is silently overwritten by MARVIN's stale data
- No error or conflict notification
- Version history can recover it, but only if someone checks

**Prevention:**
- Schedule MARVIN's automated update runs during off-hours (e.g., automated overnight syncs rather than during the school day)
- Before any batch write, MARVIN should check the "last edited" timestamp on the sheet (via the Sheets API) and warn if recent human edits (within 10 minutes) are detected
- For synchronous on-demand updates (during a session), confirm with Josh before MARVIN writes to cells that staff have recently edited
- Define clear "MARVIN writes to these columns; humans write to these columns" conventions and enforce with column protection

---

### Pitfall 9: Stale Data — Dashboard Becomes Unreliable Between Terms

**Severity:** MEDIUM

**What goes wrong:** The dashboard is set up, works well for the first term, and then grades are not updated at the start of the next term. Staff stop trusting it; it falls into disuse. By the end of the year, it reflects last term's grades and nobody is sure which data is current.

**Why it happens:** Updating a tracking system requires deliberate effort at each data point (end of each term, after each assessment cycle). Without a prompt or process, it simply doesn't happen.

**Consequences:**
- Dashboard shows outdated grades, giving false picture of pupil progress
- Staff make intervention decisions based on stale data
- System loses credibility and is abandoned

**Prevention:**
- Add a "Last Updated" cell at the top of each pupil record sheet that auto-stamps when data changes (`=NOW()` triggered by onEdit)
- Create a "Data Freshness" warning banner on the dashboard summary tab: if any pupil's grade is older than 80 days, display a red warning with the oldest update date
- MARVIN should proactively flag at the start of each term: "Grades were last updated X weeks ago — is it time for a data entry session?"
- Define and document the termly data entry workflow: who updates what, by when, and who owns the master import from iSAMS

---

## Minor Pitfalls

Issues that are annoying or slow things down but don't cause data loss.

---

### Pitfall 10: Google Sheets Cell and Formula Performance

**Severity:** LOW

**What goes wrong:** With 46 pupils and moderate formula complexity, performance is not a serious concern — Google Sheets handles 10 million cells. However, certain patterns cause unnecessary slowdowns:
- Using open-ended ranges (A:A instead of A1:A100) in VLOOKUP or COUNTIF formulas
- Chaining multiple VLOOKUP formulas across sheets (each cross-sheet reference is a recalculation trigger)
- Overusing volatile functions (NOW(), TODAY(), RAND()) which recalculate on every sheet change

**Prevention:**
- Use bounded ranges: `A2:A47` rather than `A:A`
- Prefer INDEX/MATCH or XLOOKUP over VLOOKUP for column-order flexibility
- Use named ranges for readability and to reduce formula errors
- Cache frequently referenced cross-sheet data on a local summary tab rather than VLOOKUP-ing from a master sheet on every row

---

### Pitfall 11: Apps Script Execution Time Limits

**Severity:** LOW

**What goes wrong:** If Apps Script is used for import automation or audit logging, individual executions are capped at 6 minutes. Large CSV imports that exceed this limit will terminate mid-run, leaving the sheet in a partially imported state.

**Prevention:**
- For imports of 46 pupils, the 6-minute limit is not a practical concern — the import should complete in seconds
- If import logic grows more complex (multi-sheet updates, validation passes), break into batched operations with a continuation trigger
- Always run imports in a transaction-like pattern: import to a staging sheet first, validate, then copy to the live sheet — never write directly to live data mid-import

---

### Pitfall 12: Conditional Formatting Rule Accumulation

**Severity:** LOW

**What goes wrong:** Over time, staff add conditional formatting rules to the sheet (highlight red if grade < 4, yellow if absent >3 times, etc.) without removing old or contradictory rules. Google Sheets processes rules in order; conflicting rules produce confusing results. Rule accumulation also slows rendering.

**Prevention:**
- Centralise all conditional formatting rules in the initial setup; document them in a "Sheet Guide" tab
- Restrict the ability to add conditional formatting to sheet owner only (via sheet protection)
- Periodically audit via Format > Conditional Formatting sidebar and remove redundant rules
- Prefer formula-based rules over colour-based value rules — they are easier to understand and maintain

---

### Pitfall 13: Partial iSAMS Import Overwriting Good Data

**Severity:** MEDIUM

**What goes wrong:** An import script runs, but the CSV only contains Y7 pupils (because staff exported from the wrong iSAMS report). The script interprets missing Y8 rows as "pupils to delete" or overwrites Y8 data with blanks.

**Prevention:**
- Never treat absence from a CSV as a deletion signal
- Always append/update on pupil ID match; never delete rows based on CSV contents
- After each import, compare the count of imported pupils against the expected total (46) and abort with an error if significantly fewer are found
- Require explicit human confirmation before any delete or blank-overwrite operation

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial data migration from 46 markdown files | Duplicate name pairs causing mis-assignment | Use iSAMS pupil ID as primary key from day one; never use name as key |
| iSAMS CSV import setup | Column order or encoding changes | Parse by header name; validate encoding before import |
| Sheet access setup | SEN/pastoral data visible to all editors | Design tiered sheet structure before sharing with any staff |
| MARVIN write operations | Writing to wrong row/column | Always resolve by unique ID; read-verify-write pattern |
| End of each term | Grade data going stale | Data freshness warnings + MARVIN proactive prompts |
| Staff onboarding | Formula cells overwritten | Protect formula cells before sharing; train staff on paste-special |
| GDPR compliance | Sensitive data in shared sheet | Confirm Google Workspace EDU DPA; DPIA before launch |

---

## Sources

- [Google Apps Script Quotas (official, updated 2025-12-11)](https://developers.google.com/apps-script/guides/services/quotas)
- [Google Sheets Row and Cell Limits — Row Zero](https://rowzero.com/blog/google-sheets-limits)
- [Slow Google Sheets: 27 Techniques — Ben Collins](https://www.benlcollins.com/spreadsheets/slow-google-sheets/)
- [Google Sheets Protection and Locking — Sheetify CRM](https://www.sheetifycrm.com/blogs/updates/how-to-lock-cells-in-google-sheets)
- [Data Migration Risks — Datafold](https://www.datafold.com/blog/common-data-migration-risks)
- [GDPR for Independent Schools — LegalVision UK](https://legalvision.co.uk/data-privacy-it/data-protection-act-gdpr-independent-schools/)
- [GDPR Compliance for Schools — DataGuard](https://www.dataguard.com/blog/gdpr-compliance-for-schools-in-the-uk)
- [Education and UK GDPR in 2025 — GDPR Sentry](https://gdprsentry.com/education-and-uk-gdpr-in-2025-seven-years-on-are-we-getting-it-right/)
- [Google Sheets Security Best Practices — Kulkan Security](https://blog.kulkan.com/security-best-practices-for-google-sheets-shared-files-9f781228d773)
- [UTF-8 Encoding for CSV Import — Highview Apps](https://www.highviewapps.com/blog/how-to-change-file-encoding-to-utf-8-with-google-sheets/)
- [iSAMS CSV Export Guide — Reading Cloud Knowledge Base](https://knowledgebase.reading-cloud.com/knowledge-base/exporting-a-csv-isams)
- [Concurrent Editing Conflicts — Google Docs Editors Community](https://support.google.com/docs/thread/5282099)
