# 🌍 UNMAPPED

> AI-powered infrastructure that connects real-world skills to economic opportunities — calibrated to local labor-market and education data from the World Bank.

UNMAPPED translates informal, unstructured skills into standardized profiles, matches them to occupations, issues verifiable Open Badges, and surfaces aggregate signals for policymakers. It is designed as an **infrastructure layer** that adapts to any country via configurable data sources rather than hard-coded locales.

---

## 🧭 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Surface](#-api-surface)
- [Data Sources](#-data-sources)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ Features

### Youth interface (`/`, `/opportunities`, `/badge/:uid`)
- **Discover** — paste free-text experience and get standardized ESCO skills, suggested roles, and a risk lens (skills at risk, durable skills, resilience pathways).
- **Opportunities** — per-skill matching occupations with match %, descriptions, and live re-fetching as you change your skill selection. Cached per user in `localStorage`.
- **Skills Passport (Badge)** — generate a UID-addressable badge that lists verified skills and the matching occupations (with match %). Share via URL, export as JSON or as a binary `.blob`. Backwards-compatible payload format.
- **Internationalization** — full `en` / `es` UI with cookie-persisted locale.

### Policymaker dashboard (`/dashboard`)
- **Resilience Gauge** — composite 0–100 score (GDP growth, youth unemployment, labor-force participation), color-coded.
- **Macro stat cards** — broadband penetration, internet users, mobile subs, GDP per capita (PPP), youth unemployment, labor-force participation, tertiary enrollment. Up/down deltas vs. a comparison country.
- **Education Transition chart** — Wittgenstein Centre projections for 2025 / 2030 / 2035 across education attainment buckets.
- **Regional Comparison Tool** — side-by-side panels for any two ISO-3 countries.
- **Skeleton loaders** — "Calibrating from official sources…" while World Bank fetches resolve.

### Recruiter interface (`/for-companies`)
- Paste a vacancy's required skills and find registered users that match, with matched/missing-skills breakdown.

---

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  apps/web       │ ──▶ │  apps/api        │     │  apps/ml_server    │
│  Next.js 15     │     │  Express + TS    │     │  FastAPI (Python)  │
│  React / Tailwind│ ──▶ │  Auth, sessions  │ ──▶ │  ESCO, ILO, WDI    │
└─────────────────┘     └──────────────────┘     │  Wittgenstein,     │
                                                 │  Open Badges       │
                                                 └────────────────────┘
```

The web app talks directly to the FastAPI ML server for `/analyze`, `/lens`, `/occupations`, `/api/dashboard/aggregate`, and `/api/badges/issue`, and to the Express API for authentication.

---

## 🧰 Tech Stack

- **Frontend**: Next.js 15 (App Router, RSC), React 19, TailwindCSS, Framer Motion, shadcn-style UI primitives, Sonner toasts, custom i18n provider.
- **Backend (Auth/App)**: Node.js + Express + TypeScript.
- **ML/Econometrics**: Python 3.11, FastAPI, pydantic, pandas, scikit-learn, [`wbgapi`](https://pypi.org/project/wbgapi/) for live World Bank queries.
- **Data**: ESCO skills/occupations CSVs, ILO automation-risk table A1, Wittgenstein Centre projections (`wcde_data.csv`), WDI indicators via `wbgapi`.
- **Tooling**: pnpm workspaces, concurrently, ESLint, Prettier.

---

## 📁 Project Structure

```
.
├── apps/
│   ├── web/         # Next.js 15 frontend (App Router)
│   ├── api/         # Express + TypeScript backend (auth, sessions)
│   └── ml_server/   # FastAPI ML & econometrics server
├── packages/
│   ├── config/      # Shared config
│   └── types/       # Shared TypeScript types
├── package.json     # pnpm workspace root
└── pnpm-workspace.yaml
```

Key files in `apps/web`:

```
apps/web/
├── app/
│   ├── page.tsx                   # Discover
│   ├── opportunities/page.tsx     # Per-skill occupations + badge generation
│   ├── badge/[uid]/page.tsx       # Skills Passport viewer (localStorage-addressed)
│   ├── dashboard/page.tsx         # Policymaker dashboard (gauge, charts, comparison)
│   └── for-companies/page.tsx     # Recruiter matching
├── components/                    # UI primitives, Navbar, Results, etc.
├── lib/
│   ├── api.ts / api.routes.ts     # Typed API client
│   ├── auth.ts                    # Local user + auth events
│   ├── storage.ts                 # Per-user localStorage (skills, occupations, etc.)
│   ├── countries.ts               # Curated ISO-3 country list with flags
│   ├── occupations.ts             # /occupations response → per-skill index
│   └── i18n.tsx                   # Locale provider (en/es)
└── locales/{en,es}.json
```

Key files in `apps/ml_server`:

```
apps/ml_server/
├── api/
│   ├── Main.py                    # FastAPI app, registers routers
│   ├── core/Config.py             # Settings (WDI indicators, paths, model files)
│   └── endpoints/
│       ├── SkillsApi.py           # /analyze
│       ├── RiskApi.py             # /lens, /occupations
│       ├── BadgesApi.py           # /api/badges/issue (Open Badges v3)
│       └── DashboardApi.py        # /api/dashboard/aggregate
├── ml_engine/
│   ├── SkillAssessor.py           # ESCO matching
│   ├── Econometrics.py            # WDI + Wittgenstein fetchers
│   └── LaborMarketSignals.py      # ISCO → sector growth + wage proxy
└── local_models/training_data/    # ESCO, ILO, Wittgenstein CSVs
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20, **pnpm** ≥ 9
- Python ≥ 3.11 (for `apps/ml_server`)

### Install

```bash
pnpm install
```

### Run all dev servers

In separate terminals:

```bash
# Frontend (Next.js) — http://localhost:3000
pnpm --filter web dev

# Auth/API (Express) — http://localhost:3001
pnpm --filter api dev

# ML server (FastAPI) — http://localhost:8000
cd apps/ml_server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.Main:app --reload --port 8000
```

Or, for the Node side only:

```bash
pnpm dev-all   # runs web + api with concurrently
```

---

## 🔐 Environment Variables

`apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001       # Express API base
NEXT_PUBLIC_ML_API_URL=http://localhost:8000    # FastAPI ML server base
```

`apps/ml_server/.env` (optional — sensible defaults exist):

```env
DEBUG=true
TAXONOMY_NAME=esco
ISSUER_ID=https://unmapped.worldbank.org/issuers/1
ISSUER_NAME=UNMAPPED – World Bank Youth Summit
# Override WDI indicators by editing WDI_INDICATOR_MAP (JSON string).
```

---

## 🔌 API Surface

### ML server (`apps/ml_server`)

| Method | Path                           | Purpose                                                            |
| ------ | ------------------------------ | ------------------------------------------------------------------ |
| POST   | `/analyze`                     | Free-text → standardized ESCO skills + suggested roles             |
| POST   | `/lens`                        | Risk lens: skills_at_risk, durable_skills, resilience_pathways     |
| POST   | `/occupations`                 | Skill list → matching occupations with match %, growth, wage signal |
| POST   | `/api/badges/issue`            | Open Badges v3 credential                                          |
| POST   | `/api/dashboard/aggregate`     | Country-level macro indicators, education projections, resilience  |

### Auth API (`apps/api`)

| Method | Path              |
| ------ | ----------------- |
| POST   | `/auth/register`  |
| POST   | `/auth/signin`    |

---

## 🌐 Data Sources

- **ESCO** — European Skills/Competences and Occupations taxonomy (skills, occupations, occupation–skill relations).
- **ILO** — Automation risk index (Table A1).
- **World Bank WDI** — Live via [`wbgapi`](https://pypi.org/project/wbgapi/) with the indicator map in `Config.WDI_INDICATOR_MAP` (broadband, internet users, mobile subs, GDP/cap PPP, youth unemployment, labor-force participation, tertiary enrollment).
- **Wittgenstein Centre** — Multi-decade education projections (`wcde_data.csv`).

All ML routes accept an ISO-3 country code; nothing is hard-coded to a specific locale.

---

## 🗺 Roadmap

- Youth-side scorecards on `/opportunities` (Ready-Now vs. Upskilling Required) with signal tooltips.
- Persisted dashboard preferences (last-selected country, comparison pair).
- Skill-gap recommendations linking to MOOCs / training.
- Verifiable issuance of badges via DID + status list.

---

## 📄 License

[MIT](./LICENSE)
