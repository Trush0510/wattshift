---
name: verify-energy-autopilot
description: >-
  Activate before marking any task or feature slice complete, after editing
  battery optimisation math (src/lib/), Gemini explanation routes (server/),
  or dashboard scenarios, and before telling the user that AC1–AC5 work.
---

# SolarXchange Verification Runbook

Follow these exact checks in order before claiming any SolarXchange change is complete. Never skip a failed check or mark a task done based on compilation alone.

## 1. Type Safety & Deterministic Solver Gate (AC2 & AC3)

1. Run strict TypeScript checks across frontend and server:
   `npm run typecheck`
2. Run unit and API verification suites:
   `npm test` (and `npm run test:unit`)
3. Confirm the unit output explicitly passes all physical and financial invariants:
   - Exactly **24** hourly actions (`charge`, `discharge`, or `hold`) for `00:00`–`23:00`.
   - `minReserveKwh <= socKwh <= batteryCapacityKwh` and `0 <= powerKw <= maxPowerKw` at every hour.
   - Comparable boundary state: `optimised.startSocKwh === baseline.startSocKwh` and `Math.abs(optimised.endSocKwh - baseline.endSocKwh) < 1e-6` (no "free battery drain" savings inflation).
   - Exact savings identity: `savingsGbp === Number((baselineCostGbp - optimisedCostGbp).toFixed(2))` and `savingsPence >= 0` across `standard`, `cloudy`, and `price_spike`.

## 2. Backend & Offline-Fallback Smoke Check (AC4)

1. Verify `POST /api/explain` never crashes when Gemini is unavailable or unconfigured. Start the API server with an empty key if not already running on `:3001`:
   `GEMINI_API_KEY="" npx tsx server/index.ts`
2. Probe health and fallback explanation endpoints:
   - `curl -sf http://localhost:3001/api/health` must return HTTP `200`.
   - Send a sample `POST http://localhost:3001/api/explain` payload and confirm HTTP `200` with `"source": "offline-fallback"` and `"£"` figures matching the submitted `baselineCostGbp`, `optimisedCostGbp`, and `savingsGbp`.
3. Stop the temporary test server process cleanly once verified.

## 3. Live Vite + Chrome End-to-End Journey Gate (AC1–AC5)

1. Check that the Vite frontend serves cleanly (`HTTP 200` on `/`) and proxies `/api/explain`.
2. Run the Chromium end-to-end journey suite:
   `npm run test:e2e`
3. Verify the Playwright report confirms all six journey stages pass in headless Chromium:
   - **Configure & Forecast (AC1/AC5):** Loads without login, renders 24 hourly points, shows `Simulated Estimates`, and displays inline validation errors on invalid inputs (e.g., initial charge `< 10%` reserve).
   - **Optimise (AC2):** Clicking `Optimise My Energy` reveals 24 hourly actions and `baseline - optimised` savings.
   - **Simulate (AC3):** Selecting `Cloudy Weather` reduces 24h solar kWh; selecting `Price Spike` raises evening import `p/kWh` without page reload.
   - **Explain & Reset (AC4/AC5):** Clicking `Explain My Plan` renders a grounded or labelled offline explanation; clicking `Reset Demo` restores the `5 kWp / 10 kWh` baseline state.
