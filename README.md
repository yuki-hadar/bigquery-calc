# Yuki BigQuery Pricing & Savings Dashboard

## Motivation

**BigQuery** usage can be expensive when teams rely on **on-demand pricing**: you pay per TiB scanned ($6.25/TiB) with no commitment. Many workloads are predictable enough to benefit from **reservations** (slot-based pricing), but the trade-off is non-trivial: you must choose between Standard and Enterprise slots, mix on-demand and reserved capacity, and reason about “chargeable” savings when a third party helps optimize.

**Yuki** helps customers shift workload from on-demand to reservations (or the other way around) and charges a fee based on the **value created**: the reduction in BigQuery spend, minus the cost of any new capacity in the other model. That fee is expressed in **Yuki Credits (YC)** (1 YC = $2 USD), so customers see both the gross savings and what they pay Yuki.

This dashboard exists to:

- **Make the model visible** — Customers can see how “original” usage (on-demand TiB, slot-hours) compares to a “Yuki optimized” state, and how the **queries moved %** slider affects remaining on-demand vs. reservation usage.
- **Build trust** — By exposing the formula (chargeable units = gross units saved − cost-equivalent of new units) and letting users tweak constants (e.g. $/TiB, slot $/hr, YC price), the dashboard demystifies how the Yuki fee is calculated.
- **Support different scenarios** — Scenario A (on-demand → slots), B (slots → on-demand), and C (hybrid) reflect real migration patterns; the UI adapts so customers can explore the one that matches their situation.

It is a **frontend-only demo** for now: all logic runs in the browser. A future backend could persist scenarios, support multiple customers, or plug into actual billing data.

---

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. **http://localhost:5173/**).

## Build

```bash
npm run build
```

Output is in `dist/`.

---

## What the dashboard does

- **Scenario A/B/C** — Switch between on-demand→slots, slots→on-demand, and hybrid; each loads a preset and shows only the relevant inputs (original on-demand, original slots, existing + Yuki’s on-demand/slots).
- **Pricing constants** — Edit YC price, on-demand $/TiB, and Standard/Enterprise $/hr to match your context.
- **Original vs optimized** — Set “original” usage, then the “Existing + Yuki” values (and **Queries moved %** slider) to see interpolated state; changing any “New” field updates the slider from the implied percentage.
- **KPIs** — Original cost, new cost, gross savings, Yuki fee (USD and YC), and customer net savings.
- **Charts** — Bar chart (original vs with Yuki; BigQuery cost vs Yuki fee in purple) and an efficiency gauge (Yuki’s share of gross savings, target ~32%).
- **Original vs shifted panel** — Four boxes: original OD TiB and slot-hours, then shifted OD TiB and shifted slot-hours (with a light purple accent on the Yuki/shifted side).

## Tech stack

- React 19, TypeScript, Vite  
- Tailwind CSS v4  
- Recharts (bar chart)
