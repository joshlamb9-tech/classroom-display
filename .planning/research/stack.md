# Technology Stack Research

**Project:** Y7&8 Pupil Tracking Dashboard
**Dimension:** Stack
**Researched:** 2026-02-23
**Overall confidence:** HIGH (Google Sheets/Apps Script are mature, well-documented platforms)

---

## Recommended Stack

| Layer | Technology | Version/Status | Purpose |
|-------|-----------|----------------|---------|
| Primary data store | Google Sheets | Current (2025) | All pupil data, RAG status, grades, logs |
| Automation | Google Apps Script | V8 runtime (current) | onEdit triggers, custom menus, CSV import helpers |
| Access control | Google Drive sharing | Current | Viewer/editor/commenter permissions per file |
| AI maintenance | Google Workspace MCP | Active (Josh has this) | MARVIN reads/writes sheet data from conversation |
| Data source | iSAMS CSV export | Manual workflow | Grade imports, attendance data |

No external hosting, databases, or paid tools required. Everything runs within the Google Workspace Josh already has.

---

## 1. Google Sheets Native Capabilities

### What Sheets does without any scripting

**Conditional formatting (RAG status):** Native and robust. You can apply red/amber/green fill to cells based on text values ("Red", "Amber", "Green") or formula conditions. Rules apply across entire rows when using `$A2` absolute column + relative row syntax. Up to 400 rules per sheet — well within our needs. **This is the right tool for RAG colouring.** No script needed.

**Data validation:** Dropdown menus for controlled values (RAG status, form, SEN flag, scholarship status). Prevents free-text errors. Apply to entire columns. Native, no script required. Recommended for any field with a fixed set of values.

**Filtering:** Native filter views let different users filter the cohort overview (by form, gender, SEN, RAG status) without affecting other users' views. Filter views are saved and named. This is the mechanism for "show me just 8L" or "show me all Red pupils." CRITICAL: use Filter Views (not the basic filter) so one person's filter doesn't affect what other staff see simultaneously.

**Charts:** Basic pivot charts from cohort data (e.g. RAG distribution by form) are native. More useful for SLT review than day-to-day use. No script required.

**Pivot tables:** Useful for summarising grade distributions across the cohort. Insert > Pivot Table. Can filter by any column. Performance is good for 46-pupil datasets.

**QUERY function:** More powerful than VLOOKUP for this use case. Use `=QUERY(PupilData!A:Z, "SELECT A, B, C WHERE D='8L'")` to pull filtered subsets onto a form-specific view. Better performance than chained VLOOKUP, more readable, and handles empty cells gracefully.

**XLOOKUP (not VLOOKUP):** Google Sheets supports XLOOKUP natively. Use this instead of VLOOKUP everywhere — it handles left-side lookups, returns ranges, and has better error handling. No script required.

**Named ranges:** Define `PupilData`, `ScholarshipCandidates`, `Year8Cohort` etc. Makes formulas readable and maintainable. MARVIN can reference named ranges by name when writing formulas via MCP.

---

## 2. Google Apps Script Capabilities

### What requires scripting

**onEdit trigger (simple):** Fires automatically when any user edits a cell. Use for:
- Auto-timestamping a "Last Updated" column when a row is edited
- Auto-applying RAG colour logic when a status cell changes (though conditional formatting handles this better natively)
- Input validation beyond what data validation supports

**Limitation:** Simple onEdit cannot send emails or access external services. 30-second execution limit. Does not fire when MARVIN writes via the Sheets API (MCP writes are programmatic, not user edits).

**Installable triggers (authorised):** Required for anything needing authorisation:
- Email alerts to Josh when a pupil's RAG status changes to Red
- Scheduled weekly summary pulls
- Any script that reads/writes other files

**Custom menus:** `SpreadsheetApp.getUi().createMenu()` — adds a "Pupil Tracker" menu to the Sheets toolbar. Use for:
- "Import iSAMS data" (triggers the CSV import script)
- "Refresh cohort overview" (pulls latest data from pupil sheets)
- "Generate SLT report" (formats a summary for export)

Staff can use these without knowing any script syntax.

**Sheet protection via script:** `sheet.protect().addEditor(email)` — programmatically manage who can edit which ranges. Useful for locking formula columns so staff can only edit data-entry cells. MARVIN can call this during initial setup.

**CSV import handler:** Apps Script can parse a CSV string pasted into a dedicated "Import Zone" sheet tab and then write values into the correct rows of the data sheet using `setValues()`. This is the recommended iSAMS workflow (see Section 5 below).

**Batch writes:** `sheet.getRange(row, col, numRows, numCols).setValues(2dArray)` — write entire tables in one call. Much faster than cell-by-cell writes. Essential for migration of 46 markdown files.

---

## 3. Google Workspace MCP — MARVIN's Write Access

Josh has the Google Workspace MCP active. This means MARVIN (Claude Code) can, from conversation, directly read and write the spreadsheet at any time without Josh opening Sheets manually.

### Confirmed capabilities (from workspacemcp.com, HIGH confidence)

| Operation | Available | Notes |
|-----------|-----------|-------|
| Read any cell range | Yes | e.g. "read A2:Z50 from Cohort Overview" |
| Write/update cell ranges | Yes | e.g. update Matilda's RAG status to Amber |
| Clear ranges | Yes | e.g. clear last term's grades before import |
| Create new sheets/tabs | Yes | e.g. create a new "8S" tab |
| Inspect spreadsheet metadata | Yes | e.g. list all sheet names, find sheet IDs |

### What this means in practice

- Josh says "Mark Matilda as Red RAG, she had a tough week" → MARVIN writes directly to the cell
- Josh drops an iSAMS CSV in the conversation → MARVIN parses it and writes the rows
- MARVIN can be asked to pull a cohort summary mid-meeting without Josh touching Sheets
- After migration, MARVIN maintains the system as the primary data entry interface

### Limitation to note

MARVIN's MCP writes do NOT trigger onEdit simple triggers (those only fire on user edits). If onEdit is being used for auto-timestamping, MARVIN's writes will bypass it. Design choice: MARVIN should write timestamps explicitly when it updates records, rather than relying on the trigger.

---

## 4. Sheet Structure Pattern

### Recommended: Flat Cohort Data + Lookup Architecture

For 46 pupils, the correct pattern is a **single flat data table** (one row per pupil) rather than one tab per pupil. Here is why:

- One row per pupil = QUERY/FILTER/pivot tables work across the whole cohort
- One tab per pupil = 46+ tabs, no way to filter across them, MARVIN has to know which tab to open for each pupil
- One tab per pupil is appropriate for deep per-pupil logs (pastoral notes, intervention history) — use it only for those append-only log tables

### Recommended sheet structure

```
Spreadsheet: "Y7&8 Pupil Tracker — [Year]"
│
├── COHORT OVERVIEW          ← One row per pupil, all key fields, RAG status
├── GRADES — HT1             ← Subject grades grid, one row per pupil (repeat per half-term OR use columns)
├── CAT4 SCORES              ← Cognitive scores, one row per pupil
├── SCHOLARSHIP              ← Scholarship candidates only, extended fields
├── ATTENDANCE               ← One row per pupil, one column per half-term
│
├── LOGS — Pastoral          ← Append-only log: PupilID | Date | Note | Follow-up
├── LOGS — Interventions     ← Append-only log: PupilID | Date | Type | Delivered By | Outcome
├── LOGS — Parent Contact    ← Append-only log: PupilID | Date | Method | Subject | Outcome
│
├── _IMPORT_ZONE             ← Paste iSAMS CSV here; script reads and distributes
├── _LOOKUP_FORMS            ← Reference table: form names, tutor names, subject list
└── _LOOKUP_PUPILS           ← Master pupil list: ID | Name | Form | Gender | SEN | DOB
```

The underscore prefix on support tabs keeps them at the bottom of the tab bar and signals to staff they should not edit them directly.

### Key structural decisions

**Pupil ID column:** Every row in every sheet must have a PupilID (e.g. "8L-MATILDA"). This is the join key. MARVIN uses it to find any pupil across any sheet. Do not rely on names alone — there are duplicate first names across forms (confirmed: 4 pairs).

**Grades: columns vs sheets:** Put all half-term grades on one sheet using paired columns (HT1 Attainment | HT1 Effort | HT2 Attainment | HT2 Effort...). This is better than one sheet per half-term because MARVIN can write "update HT3 grades for all 8L pupils" in a single range write operation.

**Logs as append-only:** Pastoral notes, interventions, and parent contact are append-only (new rows added, old rows never edited). This preserves history and is simpler for MARVIN to manage — always append, never overwrite.

---

## 5. CSV Import Workflow (iSAMS)

iSAMS exports grade reports and attendance data as CSV. The recommended workflow prevents formula corruption:

### Recommended approach: Import Zone tab

1. iSAMS export is saved/copied
2. Staff (or Josh) pastes CSV data into the `_IMPORT_ZONE` sheet tab — a raw, unformatted staging area with no formulas
3. A custom Apps Script menu item "Process iSAMS Import" reads the Import Zone, maps column headers to the correct data sheet columns, and uses `setValues()` to write values (not formulas) to the target sheet
4. Import Zone is cleared after successful import

### Why this is better than direct paste

- Direct paste into a data sheet risks overwriting adjacent formula columns
- Import Zone is isolated — even a messy paste cannot break the live data
- The script does the column mapping, so it survives iSAMS changing column order
- MARVIN can also perform this import: Josh drops the CSV file in the conversation, MARVIN parses it and writes via MCP

### iSAMS column mapping

iSAMS exports will have its own column headers. Build a mapping table in `_LOOKUP_FORMS` that maps iSAMS column names to our sheet column names. When iSAMS changes their export format, only the mapping table needs updating, not the import script.

### Critical: paste values only

If ever pasting manually (not via script), always use Ctrl+Shift+V (Paste Special > Values Only). Pasting normally will overwrite number formats and may trigger formula recalculation across unrelated cells.

---

## 6. Access Control

### Google Drive permission model

| Role | Can do | Use for |
|------|--------|---------|
| Viewer | Read data, use filter views, export to PDF | SLT, subject teachers (read-only) |
| Commenter | Add comments, read data | Form tutors who flag concerns |
| Editor | Edit cells, add rows | Josh, deputy heads, pastoral leads |

Share the spreadsheet file via Google Drive with specific school email addresses (@mowdenhall.org.uk). Do not share via "anyone with link" — this is pupil data.

### Sheet-level protection

Use Apps Script to lock formula columns from editor access. Pattern:

- **Protected (no edit):** Formula columns (QUERY results, calculated RAG, trend arrows), header rows, the `_LOOKUP_` sheets
- **Editable:** Data entry columns (grades, pastoral notes, attendance figures)

This means an editor cannot accidentally break a formula by typing in the wrong cell, but can still update the data cells they need.

### Sensitive column access

There is no true per-user column hiding in Sheets — hiding a column does not prevent a viewer from unhiding it. For genuinely sensitive fields (e.g. medical notes, safeguarding concerns), the correct approach is:

1. Keep sensitive columns on a separate protected tab (`PASTORAL — SENSITIVE`)
2. Share that tab's parent sheet only with Josh and pastoral leads
3. The main cohort sheet shows only non-sensitive pastoral flags (RAG status, concern level)

Alternatively: use a separate Sheets file for the sensitive pastoral log, and use IMPORTRANGE to pull a sanitised summary column into the main cohort sheet. This is more robust for access control.

---

## 7. Migration: 46 Markdown Files to Sheets

### Assessment of existing files

- 46 markdown files, each matching the `TEMPLATE-pupil-record.md` structure
- Most fields currently blank (the template was created but not yet populated with real data)
- Structure is consistent: header table, academic snapshot, pastoral notes, attendance, interventions, parent contact, extracurricular, scholarship radar, next actions
- 4 duplicate first names across year groups (MARVIN already warned about this) — PupilID scheme essential

### Recommended migration method: MARVIN via MCP

Given that:
1. Most fields are blank (little data to lose if done wrong)
2. MARVIN has MCP write access to Sheets
3. The markdown structure maps cleanly to flat columns

The most efficient approach is:

**Phase 1 (one-off):** MARVIN reads all 46 markdown files, extracts the header fields (Name, Form, Tutor, Boarding/Day, RAG Status), and batch-writes them as rows to the `_LOOKUP_PUPILS` and `COHORT OVERVIEW` sheets. One MCP batch write per sheet.

**Phase 2:** Any populated sections (pastoral notes, interventions) get migrated to the log sheets as individual rows. This can be done file-by-file in a single session.

**Manual alternative:** Export the 46 header tables as a TSV, paste into Sheets. Doable but slower and more error-prone than letting MARVIN parse and write.

**Do not use:** Apps Script to read the markdown files — Apps Script cannot access the local filesystem. It could read files in Google Drive, but the markdown files are local. MARVIN (via Claude Code + MCP) is the right tool here because it can read local files AND write to Sheets in the same operation.

---

## Key Limitations and Gotchas

| Limitation | Detail | Mitigation |
|------------|--------|------------|
| 10 million cell limit | Effectively unlimited for 46 pupils | Not a concern |
| Sheet tab limit | ~200 tabs practical maximum | Use flat structure; avoid one tab per pupil |
| onEdit does not fire on API writes | MARVIN's MCP writes bypass onEdit triggers | MARVIN writes timestamps explicitly |
| Volatile functions slow recalc | NOW(), TODAY(), RAND() recalculate on every change | Avoid in formula columns; use static date values |
| Column hiding is not true security | Any user can unhide columns | Use separate sheets/files for sensitive data |
| Conditional formatting + large range = slow | Applying to 10,000+ rows causes lag | Apply only to data rows (rows 2–50), not whole columns |
| IMPORTRANGE requires authorisation | First use needs a manual click "Allow Access" | Josh does this once during setup |
| No per-user column permissions | Cannot hide pastoral notes from subject teachers at column level | Separate sensitive-data sheet |
| Simple triggers cannot send email | onEdit cannot alert Josh by email when RAG changes | Use installable trigger or MARVIN flags it in session |
| Apps Script 30-second execution limit | Complex migration scripts may need batching | Write in batches of 20 pupils; use Utilities.sleep() between batches |
| Duplicate names across forms | E.g. two Archies (7S and 8L) | PupilID = Form + FirstName; always show form column |

---

## Sources

- [Google Sheets conditional formatting rules](https://support.google.com/docs/answer/78413?hl=en) — HIGH confidence (official docs)
- [Apps Script simple triggers](https://developers.google.com/apps-script/guides/triggers) — HIGH confidence (official docs)
- [Apps Script installable triggers](https://developers.google.com/apps-script/guides/triggers/installable) — HIGH confidence (official docs)
- [Apps Script Protection class](https://developers.google.com/apps-script/reference/spreadsheet/protection) — HIGH confidence (official docs)
- [Apps Script CSV import samples](https://developers.google.com/apps-script/samples/automations/import-csv-sheets) — HIGH confidence (official docs)
- [Google Sheets limits](https://rowzero.com/blog/google-sheets-limits) — MEDIUM confidence (third-party, consistent with community reports)
- [Slow Google Sheets — 27 techniques](https://www.benlcollins.com/spreadsheets/slow-google-sheets/) — MEDIUM confidence (expert practitioner)
- [Google Workspace MCP Server](https://workspacemcp.com/) — MEDIUM confidence (product docs, actively maintained)
- [Hide columns from certain users](https://www.thebricks.com/resources/how-to-hide-columns-in-google-sheets-from-certain-users) — MEDIUM confidence (third-party, consistent with official behaviour)
- [VLOOKUP vs XLOOKUP 2025](https://isitdev.com/vlookup-vs-xlookup-2025/) — MEDIUM confidence (third-party comparison)
