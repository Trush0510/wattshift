# SolarXchange — AI Energy Autopilot

**Product Requirements Brief | MVP v1.0**

### 1. Problem and User

**Target Customer:** UK homeowners who own rooftop solar panels and home battery storage.

**Problem:** Solar generation, household electricity demand, and import/export tariffs fluctuate throughout the day. Homeowners lack a simple way to determine whether electricity should be consumed, stored, or exported to minimise costs. Existing monitoring dashboards provide historical information but often leave these decisions to the homeowner.

**Solution:** SolarXchange is a browser-based AI Energy Autopilot that forecasts hourly energy generation and consumption, computes a cost-optimised 24-hour battery schedule, and uses Google Gemini to explain recommendations and estimated financial savings.

**Primary Value:** Turn complicated energy data into actionable, transparent, money-saving decisions.

### 2. Core Workflow

1. **Configure:** Open the app with a preloaded UK household demonstration (5 kWp solar, 10 kWh battery). Adjust solar capacity, battery capacity, initial charge, and import/export electricity tariffs.

2. **Forecast:** View an interactive 24-hour dashboard showing estimated solar generation, household demand, electricity prices, and battery state of charge.

3. **Optimise and Explore:** Click **Optimise My Energy** to generate an hourly charge/discharge schedule. Use the **Energy Time Machine** to simulate cloudy weather or an evening electricity price spike and compare baseline versus optimised costs.

4. **Understand:** Click **Explain My Plan** to receive a Gemini-generated explanation referencing the actual calculated schedule, electricity prices, and estimated savings.

### 3. Acceptance Criteria

- **AC1 — Dashboard and Configuration:** Opening the app in Chrome without login displays 24 hourly data points, energy charts, editable system settings, and populated financial metrics. Changing solar or battery settings updates the corresponding model inputs and calculated outputs.

- **AC2 — Verifiable Optimisation:** Clicking **Optimise My Energy** displays 24 hourly battery actions (charge, discharge, or hold), baseline cost, optimised cost, and savings calculated as **baseline cost minus optimised cost**. Battery state remains within capacity and minimum-reserve limits, and charge/discharge power constraints are respected. Both schedules use comparable starting and ending battery conditions.

- **AC3 — Interactive Scenario Simulation:** Selecting **Cloudy Weather** reduces forecast solar generation; selecting **Price Spike** increases evening import prices. Each scenario recalculates the energy schedule, charts, and cost comparison without refreshing the page. **Reset Demo** restores the original inputs and results.

- **AC4 — Grounded Gemini Explanations:** Clicking **Explain My Plan** returns a readable explanation referencing the current scenario, battery decisions, and calculated financial values. Gemini must not invent savings or contradict the optimisation output. If the Gemini API fails, the interface clearly displays a labelled offline explanation instead of crashing.

- **AC5 — Browser-Verified End-to-End Journey:** In Chrome, a user can complete **Configure → Forecast → Optimise → Simulate → Explain → Reset**. All buttons and inputs respond correctly, chart values remain consistent with calculations, and invalid inputs produce visible validation messages. Results are labelled **Simulated Estimates**, not guaranteed savings.

### 4. Non-Goals

The MVP excludes authentication, payments, native mobile apps, live smart-meter integration, real battery/EV control, electricity trading, supplier connections, and carbon-credit issuance.

Forecasts use transparent demonstration data and configurable assumptions rather than verified household measurements. The app provides **decision support, not autonomous control of physical equipment**.

The priority is one complete, functioning user journey rather than a partially implemented energy marketplace.

### 5. Stack Choice

- **React + TypeScript + Vite:** Fast, modular browser application with type-safe components.

- **Tailwind CSS + Recharts:** Responsive interface and interactive hourly energy visualisations.

- **TypeScript Optimisation Engine:** Deterministic battery scheduling with enforceable physical constraints and reproducible financial calculations.

- **Google Gemini API + Node.js:** Server-side AI integration for grounded, natural-language explanations while protecting API credentials.

- **Seeded JSON + localStorage:** Reliable demonstration data and persistent preferences without requiring a database or external hardware.

**Why This Stack:** Supports rapid development in Google Antigravity, deterministic unit testing, browser-based verification, and a clear separation between numerical optimisation and generative AI.

**Definition of Done:** A UK solar homeowner can open SolarXchange in Chrome, configure an energy system, view a 24-hour forecast, generate a feasible cost-optimised battery schedule, compare two changing scenarios, and receive an accurate AI explanation of estimated savings — all through a complete, tested browser experience.

### 6. Repository & Engineering Conventions

- **Directory Structure:** Pure TypeScript domain logic, validation, scenarios, and deterministic optimisation live in `src/lib/`; React UI components live in `src/components/`; server-side Express & Gemini integration lives in `server/`; automated tests live in `tests/unit/` and `tests/e2e/`.
- **No ORM / No Database:** Demonstration data is loaded from `src/data/ukHouseholdDemo.json` and user preferences are persisted in browser `localStorage` using the `solarxchange_v1_` key prefix (`solarxchange_v1_config`).
- **Component Modularity:** Keep React components focused, type-safe (strict TypeScript), and concise (< 200 lines).
- **Scripts:** `npm run dev` starts both frontend and backend; `npm test` (alias `npm run test:unit`), `npm run typecheck`, `npm run lint`, and `npm run test:e2e` verify all acceptance criteria.
- **Pre-Commit Hygiene & Line-Limit Gate:** Before committing, verify `wc -l src/components/*.tsx` has zero files ≥ 200 lines (extract subcomponents or parameterize repeated JSX blocks into typed config arrays if exceeded) and confirm `git status` contains no leftover archives (`*.zip`, `*.tar.gz`) or unused prototype artifacts.
