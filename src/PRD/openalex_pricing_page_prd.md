# OpenAlex API Pricing Page — PRD (v2)

### Goal
A simple, developer-focused page that shows endpoint costs in **cents**, includes a **usage calculator**, and offers **three prepaid credit packs** for purchase.

---

## 1. Pricing Table

**Purpose:** Show per-call costs across all main endpoints, with clear cent values.  
A toggle lets users switch between **¢** and **$**.

**Design:**
- Columns: | Endpoint | Description | Price per call | Notes |
- Use minimal table style; compact, readable on mobile.
- Small toggle button: “Show in dollars.”

**Data:**

| Endpoint | Description | Price per call (¢) | Notes |
|-----------|--------------|------------------|-------|
| **A – Lookup by ID** | Retrieve by OpenAlex ID | **Free** | Limit: 1M/day |
| **B – List entities** | Query works, authors, sources | **0.01¢** | Up to 100 results/page |
| **C – PDF downloads** | Get full-text PDFs | **1¢** | Up to 25 MB each |
| **D – Vector search** | Semantic / embedding search | **10¢** | Top 50 results included |

---

## 2. Pricing Calculator

**Purpose:** Let users estimate monthly cost by entering expected usage.

**Inputs:**
- Fields for monthly calls of A–D (A is free).
- Dropdown for credit pack (Standard / Big / Enterprise).

**Outputs:**
- Total monthly cost (¢ and $).
- Total credits required.
- Live update as user types.

**Formula (simplified):**
```
cost = (B * 0.01¢ + C * 1¢ + D * 10¢) * pack_multiplier
```
Pack multipliers:
- Standard = 1×  
- Big = 0.5×  
- Enterprise = 0.1×

**UI Tips:**
- Inline, right below table.
- Live totals, reset button, clean typography.
- Small footnote: “Estimates only; rounded to nearest cent.”

---

## 3. Credit Pack Ladder

**Purpose:** Sell prepaid credits and show effective discounts.

**Layout:**
- Three columns side-by-side:
  1. **Standard Pack**
  2. **Big Pack**
  3. **Enterprise Pack**

**Content:**

| Pack | Credits | Price | Effective rate | Action |
|------|----------|--------|----------------|--------|
| **Standard** | 1 000 credits | **$1** | $0.001 / credit | **Buy →** |
| **Big** | 100 000 credits | **$50** | $0.0005 / credit (5× discount) | **Buy →** |
| **Enterprise** | 10 000 000 credits | **$1 000** | $0.0001 / credit (10× discount) | **Contact Sales →** |

Hover or expand shows examples like:
> “$50 = 500 M list queries or 5 M PDFs or 500 K vector searches.”

---

## 4. Header & Footer Copy

**Header:**
> **Simple, transparent pricing**  
> Start free – pay only for what you use.

**Free Tier Banner:**  
> Includes 50 000 free credits each month (≈ 500 k list queries or 500 PDFs).

**Buttons:**
- “Buy Credits” (scrolls to packs)
- “Contact Sales”

**Optional FAQ (accordion):**
1. *What are credits?* → 1 credit = 0.01¢.  
2. *Do credits expire?* → After 12 months.  
3. *Out of credits?* → Pause until top-up or enable auto-recharge.
