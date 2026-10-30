# ExpiryWatch AI: Smart Product Expiry & Packaging Inspector

[![Live Production](https://img.shields.io/badge/Live%20Production-Vercel-success?style=for-the-badge&logo=vercel)](https://hacktoberfest-project-expirywatch.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> 🌐 **Live Web Application:** **[https://hacktoberfest-project-expirywatch.vercel.app/](https://hacktoberfest-project-expirywatch.vercel.app/)**
>
> **The Honesty Contract:** ExpiryWatch AI **never invents an expiry date**. LLMs only transcribe printed text and extract verbatim quotes. All date parsing, arithmetic, and verification decisions are executed by deterministic code. Nothing in the UI will ever state that a product is "safe".

---

## 📸 Screenshots & Architecture

*(Screenshots can be stored in [`docs/screenshots/`](./docs/screenshots/))*

### The Truth Ladder

Every expiry displayed carries exactly one verifiable provenance level:

| Provenance | Meaning | When Allowed |
|---|---|---|
| **`PRINTED`** | Date printed on the pack (`EXP` / `Best Before` / `Use By`) | Read and confirmed (`agreement = both` between OCR and AI, or user confirmed). |
| **`LABEL_RULE`** | Label states a relative rule (*"Best before 9 months from manufacture"*) | Rule read + confirmed MFG date; computed deterministically in code. |
| **`MANUFACTURER_CONFIRMED`** | Manufacturer or official regulator states expiry for this specific batch | Source quote contains the batch string **AND** a parseable full date. |
| **`CALCULATED`** | Confirmed MFG date + manufacturer-confirmed shelf life | Verified source with verbatim quote confirmed as a substring of fetched text + product match. |
| **`UNKNOWN`** | None of the above | Shows exact message: *"Expiry could not be reliably determined. Please contact the manufacturer or pharmacist."* |

---

## 🚀 Key Features

1. **Multi-Angle Packaging Photos:** Upload up to 5 photos (front, back, bottom, label, batch/EXP area) via drag-and-drop or mobile camera (`capture="environment"`).
2. **In-Browser OCR & Barcode Decoding:** Web Worker-based Tesseract.js v6 WASM OCR and native `BarcodeDetector` (with `zxing-wasm` fallback) ensure privacy and fast local processing.
3. **Structured Gemini Vision Analysis:** Dual-model fallback (`gemini-3.8-flash` primary, `gemini-3.5-flash-lite` fallback) reading labels, customer care contacts, and visible packaging defects.
4. **Bounding Box Packaging Damage Inspection:** Detects torn packaging, swollen containers, broken seals, leakage, and dents, rendering normalized `box_2d` overlays on pack images.
5. **Interactive Field Confirmation (Live Re-Assessment):** Resolves ambiguous dates (e.g. `03/04/2026` Day vs Month), highlights OCR vs AI agreement/conflicts, and recomputes assessment live.
6. **Verified Manufacturer Search (Tavily):** Automatic heuristic domain classifier distinguishing `MANUFACTURER` and `REGULATOR_LABEL` from `RETAILER` or `COMMUNITY` forums.
7. **Strict Anti-Hallucination Gate:** Quotes must match source text as an exact normalized substring; numbers and units are extracted with strict server regexes rather than LLM assertions.
8. **Stateless Privacy & Local History:** Zero server database. All images are processed transiently in memory; history is stored strictly in your browser via IndexedDB.

---

## 🛠️ Architecture & Technology Stack

```
Browser (React 19 + Vite 8 SPA)
  1. Compress images (JPEG, <= 1600 px, <= ~380 KB each, EXIF stripped)
  2. OCR each image in a Web Worker (Tesseract.js v6) -> text + confidences
  3. Decode barcodes (native BarcodeDetector, fallback to zxing-wasm)
  4. POST /api/scan (images + ocr + barcodes + user hints)
  5. User confirms/corrects fields (shared/ engine recomputes live)
  6. POST /api/investigate (only if no usable expiry or user-requested)
  7. Result saved to IndexedDB (idb-keyval; nothing stored on server)
        |
        v
Serverless API (Vercel Functions in /api; dev Express wrapper on :8787)
  /api/health      -> Mode status (live vs demo, model IDs)
  /api/scan        -> Gemini vision (structured JSON) + deterministic validation
  /api/investigate -> Open*Facts (identity only) + Tavily search + Gemini evidence extraction + quote verification
```

- **Frontend:** React 19, Vite 8, Tailwind CSS v4 (`@theme`, CSS-first), Lucide Icons, Sonner toasts, Recharts, IDB-Keyval.
- **Backend:** Node.js (ESM), `@google/genai` (official SDK), `tldts` (domain extraction), Express (dev wrapper).
- **Core Engine:** Pure deterministic JS in `shared/` (`dateParse.js`, `dateMath.js`, `labelRules.js`, `agreement.js`, `assess.js`, `recommendations.js`).

---

## 📁 Folder Structure

```
expirywatch-ai/
├─ api/                          # Serverless handlers (Vercel)
│  ├─ health.js
│  ├─ scan.js
│  └─ investigate.js
├─ server/
│  ├─ dev-server.js              # Express wrapper on port 8787
│  ├─ server.test.js             # Server unit tests
│  └─ lib/
│     ├─ gemini.js               # Gemini vision & evidence extraction
│     ├─ search.js               # Tavily search client
│     ├─ offLookup.js            # Open Food Facts identity corroboration
│     ├─ sourceClassifier.js     # Heuristic domain classifier
│     ├─ evidence.js             # Anti-hallucination quote verification
│     ├─ validate.js             # Magic bytes, image limits & normalization
│     ├─ rateLimit.js            # In-memory sliding rate limiter
│     ├─ demoFixtures.js         # Labelled demo scenarios
│     └─ http.js                 # Error handler wrapper
├─ shared/                       # Pure JS trust core (used by client & server)
│  ├─ constants.js               # Statuses, provenance & error texts
│  ├─ dateParse.js               # Normalizes OCR noise & parses dates
│  ├─ dateMath.js                # UTC date math & formula generation
│  ├─ labelRules.js              # Extracts relative shelf-life rules
│  ├─ agreement.js               # OCR vs AI agreement & barcode checksums
│  ├─ assess.js                  # Truth Ladder prioritization engine
│  ├─ recommendations.js         # Fixed category safety advice
│  └─ trust-core.test.js         # Trust core unit tests
├─ scripts/
│  ├─ smoke.js                   # API smoke tests (live & demo)
│  └─ make-fixtures.js           # Sharp synthetic image generator
├─ src/
│  ├─ components/
│  │  ├─ layout/ (Navbar, Footer, ErrorBoundary)
│  │  ├─ ui/ (StatusBadge, ProvenanceChip)
│  │  ├─ scanner/ (Step 1 Upload, Step 2 Progress, Step 3 Confirm)
│  │  └─ result/ (ExpiryCard, DamageOverlay, InvestigationAccordion, RecommendationsCard, ContactCareCard)
│  ├─ lib/ (api.js, image.js, ocr.js, barcode.js, history.js, format.js)
│  └─ pages/ (Home, Scanner, Result, Dashboard, History, About, NotFound)
├─ test-assets/                  # Generated synthetic label fixtures
├─ vercel.json
├─ .env.example
└─ README.md
```

---

## ⚙️ Prerequisites & Setup

- **Node.js:** `>= 20.19` or `>= 22.12` (Node 24 tested)
- **NPM:** `>= 10`

### 1. Installation

```bash
cd expirywatch-ai
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your API keys:
- `GEMINI_API_KEY`: Get a free key at [Google AI Studio](https://aistudio.google.com/apikey). *(Leave empty to run in labelled demo verification mode)*.
- `TAVILY_API_KEY`: Get a free key at [Tavily](https://app.tavily.com) (1,000 free search credits/month, no card required).
- `OFF_USER_AGENT`: Set a descriptive user agent for Open Food Facts identity lookups.

---

## 🏃 Running Commands

| Command | Action |
|---|---|
| `npm run dev` | Runs concurrently: Vite web client on `:5173` and API dev server on `:8787` |
| `npm test` | Runs all 22 unit tests across `shared/` and `server/` via Node's native test runner |
| `npm run smoke` | Runs end-to-end API smoke test suite (magic bytes, limits, headers, gating) |
| `npm run make-fixtures` | Renders synthetic label images in `test-assets/` using `sharp` |
| `npm run build` | Compiles Vite production build into `dist/` |
| `npm run preview` | Previews the production build locally |

---

## 🧪 Demo vs Live Mode

- **Without API Keys (Demo Mode):**
  If `GEMINI_API_KEY` is empty, the application functions in a fully offline demo verification mode. It returns three canned scenarios (Food with verified printed expiry, Cosmetic with missing expiry, and Medicine with unreadable expiry). A persistent amber banner **"DEMO DATA: not read from your photo"** is displayed.
- **With API Keys (Live Mode):**
  Images are passed to `gemini-3.8-flash` (or fallback `gemini-3.5-flash-lite`), and manufacturer investigations use live Tavily searches with server-side quote substring verification.

---

## 🔒 Privacy & Security Disclosures

- **Stateless Server:** Packaging photos and OCR text are processed transiently in memory and never written to disk or logged.
- **Google Gemini API:** Free-tier Gemini usage may use data to improve Google products in accordance with Google's API Terms of Service.
- **Tavily Search:** Only normalized product brand and variant names are sent in search queries; personal data and batch codes are excluded.
- **Client Storage:** Scan history is stored entirely on the client machine via browser IndexedDB.

---

## ⚠️ Known Limitations

1. **Curved and Foil Packaging:** Stamped or dot-matrix expiration print on curved bottle necks or textured foil crimps can suffer from glare. Always verify values in the Step 3 confirmation screen.
2. **Proprietary Batch Encodings:** Most consumer manufacturers do not publicly disclose how to decipher batch codes. ExpiryWatch AI investigates manufacturer websites but will never guess an unverified formula.
3. **Assistive Tool Only:** ExpiryWatch AI is an assistive scanner, not a certified food-safety device or pharmaceutical authority. It cannot verify chemical purity or microbial safety.

---

## 🎬 2-Minute Demo Script

- **0:00 - 0:15 | The Problem:** "Expiration dates on packaged goods are often smudged, missing, or embossed on crimped edges, and apps frequently hallucinate speculative dates."
- **0:15 - 0:45 | Printed Date Scan:** Upload a food pack with a printed date. Show in-browser OCR + Gemini vision agreement, the confirmation step, and the green `EXPIRY_VERIFIED` status with the `PRINTED ON PACK` provenance chip.
- **0:45 - 1:20 | Missing Expiry Investigation:** Scan a cosmetic with only MFG + batch code. Click "Investigate Manufacturer Info". Show the deterministic Tavily search queries, domain classification (Manufacturer vs Retailer), the verbatim quote substring verification, and the calculated formula (`MFG + 24 months - 1 day`).
- **1:20 - 1:40 | Medicine Unreadable Date Refusal:** Scan a medicine blister with a damaged date stamp. Demonstrate the system's strict refusal: *"Expiry could not be reliably determined. Please contact the manufacturer or pharmacist."*
- **1:40 - 1:55 | Packaging Defect Detection:** Inspect a can or carton with packaging damage. Toggle bounding box defect overlays and inspect category recommendations.
- **1:55 - 2:00 | Conclusion:** "ExpiryWatch AI is built on the Honesty Contract: it never invents a date."

---

## 🚀 Deployment to Vercel

1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/expirywatch-ai.git
   git branch -M main
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New -> Project -> Import**.
3. Framework Preset: **Vite** (Build command: `npm run build`, Output directory: `dist`).
4. Set Environment Variables in the Vercel dashboard:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-3.8-flash`
   - `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite`
   - `TAVILY_API_KEY`
   - `OFF_USER_AGENT=ExpiryWatchAI/1.0 (contact: your-email@example.com)`
   - `DATE_ORDER=DMY`
5. Click **Deploy**. Verify `/api/health` shows `ai.mode: live` and `search.mode: tavily`.
