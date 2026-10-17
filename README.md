# Graduation Blueprint

A working prototype for the Neeley AI Forward competition (Advanced Track: *The Graduation Blueprint*). It turns a TCU Neeley student's degree audit or course record into a checked, semester-by-semester plan, explains every recommendation with its source, and sends anything it can't verify to an academic advisor.

**Open it:** `index.html` is the whole app in one file. Double-click it, or host it anywhere that serves static files.

## What it does

- **Start from a real record.** Upload a TCU Academic Advising Report (PDF, read in the browser; name and student ID are discarded), load the sample audit, or pick a demo student.
- **Plan.** Builds every remaining semester for any of the 8 Neeley majors, 8 minors and 3 certificates: prerequisites (including C- minimums), fall-only and spring-only courses, corequisites, hour caps, upper-division and TCU-residency minimums, study abroad, and sample section times.
- **Suggestions.** Finds ways to finish sooner, courses to register for first, minors that fit without delay, and warnings (retakes, GPA, AP Statistics).
- **What if.** Switch majors, add a second major, or add a minor/certificate and see what still counts, what stops counting, what's new, and the effect on the finish date.
- **Credit by exam.** AP, IB and CLEP scores mapped to TCU courses using TCU's tables.
- **Before you register.** Independent rule checks and a copyable summary for the student's advisor.
- **Findings, Validation, Cost of a delay.** The Part 1 analysis, a live test suite, and a cost calculator for the pitch.
- **Guided demo** (header button) walks through all four judging scenarios.

## Share it with others

Pick one:

| Option | Steps | Notes |
|---|---|---|
| **Claude artifact link** (already live) | Open the artifact in Claude → **Share** → choose who can view | Viewers signed in to Claude also get the Claude features (plain-language intake, plan explanations, course ideas). |
| **GitHub Pages** (free public URL) | 1. Create a GitHub repo and push this folder. 2. Repo **Settings → Pages → Source: GitHub Actions**. 3. Push to `main`. | `.github/workflows/pages.yml` builds the page, runs the tests, and publishes. The URL appears under Settings → Pages. |
| **Netlify / any web server** | Drag `index.html` onto app.netlify.com/drop, or copy it to any web folder | No server code, database or API keys needed. |
| **Email / USB** | Send `index.html` | Opens offline in any modern browser. PDF upload needs an internet connection (it loads the PDF reader from a CDN); pasting the report text works offline. |

Outside Claude, the Claude-powered buttons hide themselves and everything else works. Nothing a student enters is stored or sent anywhere.

## Update the data without touching the code

All academic data lives in `data/`, separate from the app:

| File | Contents | How to refresh |
|---|---|---|
| `data/courselist.json` | 3,888 TCU course descriptions | `python3 tools/import_courselist.py TCU_COURSE_LIST.xlsx` |
| `data/catalog.json` | Programs, courses, prerequisites, offering terms, policies, sources, exam credit, known issues | `python3 tools/import_programs.py TCU_Neeley_Programs.xlsx` and `python3 tools/import_exams.py TCU_Credit_by_Exam.xlsx`; small fixes can be edited by hand |
| `data/students.json` | Demo students (all made up) | Edit by hand |
| `data/sample-audit.txt` | Sample audit in the registrar's format (made up) | Edit by hand |

Then rebuild and test:

```
python3 tools/build.py      # writes index.html
node tests/run-tests.js     # 37 engine checks; must all pass
```

Importers need Python 3 with `openpyxl` (`pip install openpyxl`). Section times in `catalog.json → sections` are samples; replace them with an export from Purple Schedule Builder.

## How it's built

```
src/engine.js     rules engine: requirements, scheduler, checks, bottlenecks, suggestions, what-if, audit parser (no UI code; also runs in Node)
src/ui.js         planner interface
src/views.js      Programs, Findings, Validation, Cost of a delay, guided demo
src/template.html page layout and styles
```

Design rule: **the rules engine decides, Claude explains.** Requirements, prerequisites and scheduling are computed in code from cited sources. Claude (when available) turns plain language into proposed changes and explains plans; every course code it returns is checked against the course list, and nothing changes until the student applies it.

## Known limitations

- Most courses have no published fall/spring pattern; they are labeled "assumed."
- Section times are synthetic.
- Only post–Summer 2025 program requirements are fully loaded; older catalog years are refused for the catalog planner (audit upload still works).
- 105 prerequisite sets were read automatically from course descriptions and are labeled "auto-read."
- TCU Core overlap is approximated.
- Not an official degree audit; it never certifies graduation eligibility.

Sources and data issues are listed in the app under **Sources** and **Findings**.
