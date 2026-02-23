# Y7&8 Pupil Tracking Dashboard

## What This Is

A Google Sheets-based dashboard for tracking the academic and pastoral progress of a year group cohort (starting with Year 8). Provides a cohort-level overview with RAG status and demographic breakdowns, individual pupil tracking sheets for each student, and a dedicated scholarship candidate tracker. Staff across the school can view and contribute. MARVIN can update records at any time from iSAMS exports or conversation.

## Core Value

Give Josh and his team instant visibility of how every pupil in a year group is doing — academically and pastorally — so no one slips through the cracks and scholarship candidates get the preparation they need.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Cohort overview sheet with RAG status per pupil, filterable by gender and SEN status
- [ ] Individual pupil tracking sheets covering all core data points
- [ ] Subject-by-subject effort and attainment grades (updated each term/half-term)
- [ ] CAT4 cognitive ability scores per pupil (verbal, non-verbal, spatial, quantitative)
- [ ] Pastoral and behaviour log (incidents, commendations, concerns)
- [ ] Exam and test results including CE mock scores
- [ ] Scholarship candidate section: target senior schools, interview dates, outcomes
- [ ] Scholarship prep log: interventions, sessions, staff responsible
- [ ] iSAMS CSV import workflow (grades and results fed in via export)
- [ ] Migration of existing 46 markdown pupil files into the Sheets structure
- [ ] Wider staff access (form tutors, subject teachers, SLT)
- [ ] MARVIN can update any record from conversation or file drop

### Out of Scope

- Real-time iSAMS API integration — manual CSV export workflow is sufficient for v1
- Parent-facing portal — staff only for now
- Automated alerts / email notifications — MARVIN handles flagging in session

## Context

- Existing pupil tracking infrastructure: 46 individual markdown files at `content/pupil-tracking/` covering all Y7&8 pupils across 4 forms (7M, 7S, 8L, 8S). MASTER-OVERVIEW and TEMPLATE files exist.
- School MIS is iSAMS — data can be exported as CSV/spreadsheet
- Josh has Google Workspace integration active (Sheets, Drive, Docs all working)
- Four forms: 7M, 7S (Year 7), 8L, 8S (Year 8) — 4 duplicate name pairs across year groups
- Scholarship Lead role: Matilda Constantinou currently tracking for art scholarship (w/c 2 March interview)
- Dashboard needs to support SLT conversations, ISI inspection evidence, and parent meetings
- MARVIN (Claude Code) is the primary maintainer — Josh or staff provide data, MARVIN structures it

## Constraints

- **Tech stack**: Google Sheets — must work within Sheets/Drive, no external hosting
- **Access**: Shareable via Google Drive with standard permission levels (view/edit)
- **Data entry**: Mix of iSAMS CSV drops and manual updates via MARVIN in session
- **Existing data**: 46 markdown pupil files must be migrated, not rebuilt from scratch

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google Sheets over web dashboard | Staff familiarity, no hosting needed, shareable via Drive | — Pending |
| RAG status on cohort overview | Instant triage — Josh needs to spot concerns at a glance | — Pending |
| Migrate markdown files rather than rebuild | 46 records already structured by Elvis — wasteful to discard | — Pending |
| Start with Year 8 | Most urgent (CE mocks next week, scholarship candidate active) | — Pending |

---
*Last updated: 2026-02-23 after initialization*
