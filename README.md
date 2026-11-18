# SolarXchange — AI Energy Autopilot

Browser-based AI Energy Autopilot for UK homeowners with rooftop solar panels and home battery storage. SolarXchange forecasts 24-hour generation, demand, and time-of-use tariffs, computes a cost-optimised battery schedule using deterministic dynamic programming, and provides grounded Google Gemini explanations with an automatic offline fallback.

> **Disclaimer:** All forecasts and financial figures are **Simulated Estimates** for decision support only — not guaranteed savings or autonomous hardware control.

## Quick Start

### Prerequisites
- Node.js 20+ and npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment (optional)
Copy `.env.example` to `.env` and add a Google Gemini API key if you want live AI explanations:
```bash
cp .env.example .env
```
If `GEMINI_API_KEY` is omitted or the API is unavailable, `POST /api/explain` automatically returns a clearly labelled **Offline Explanation** grounded in the exact calculated schedule and £ figures.

### 3. Start the app (single command)
```bash
npm run dev
```
This starts both the Express API server (`http://localhost:3001`) and the Vite frontend (`http://localhost:5173`) with `/api` proxying configured in `vite.config.ts`.

## Verification Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Vitest unit & API grounding-guard suite (alias: `npm run test:unit`) |
| `npm run typecheck` | Strict TypeScript check across frontend and server |
| `npm run lint` | TypeScript lint/check gate (`tsc --noEmit`) |
| `npm run test:e2e` | Playwright Chromium end-to-end journey (AC1–AC5) |
| `npm run build` | Production Vite build |

## Architecture

- **`src/lib/`** — Pure TypeScript domain models, validation (`validation.ts`), baseline self-consumption (`baseline.ts`), deterministic dynamic-programming optimiser (`optimiser.ts`), scenario modifiers (`scenarios.ts`), and offline explanation builder (`offlineExplanation.ts`).
- **`src/components/` & `src/hooks/`** — Modular React + Tailwind + Recharts dashboard components and `useEnergyAutopilot` state hook (persisting settings under `solarxchange_v1_config` in `localStorage`).
- **`src/data/ukHouseholdDemo.json`** — Preloaded UK household demonstration dataset (5 kWp solar, 10 kWh battery, 24 hourly points).
- **`server/`** — Express API (`index.ts`), Google Gemini client (`geminiService.ts`), and `groundingGuard.ts` to reject any AI response that hallucinates £ figures not matching the optimiser output.
- **`tests/`** — Vitest unit/API tests (`tests/unit/`) and Playwright E2E test (`tests/e2e/solarxchange.spec.ts`).
