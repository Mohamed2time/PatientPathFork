# HumanHealth

A non-diagnostic health guidance tool built as a University of Washington capstone project.
Helps users understand what type of care to seek based on a visible health concern.

> **This tool does not provide medical diagnoses.** Always consult a licensed healthcare provider.

---

## Tech Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend  | FastAPI (Python 3.9+)                |
| Styling  | Tailwind CSS v3                      |
| Build    | Vite                                 |

---

## Project Structure

```
HumanHealth/
├── backend/
│   ├── main.py           # FastAPI app with /api/analyze and /api/recommend
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Root component, step routing and state
│   │   ├── types.ts              # Shared types, Question, DynamicAnswers, CONDITION_OPTIONS
│   │   ├── index.css             # Tailwind entry
│   │   ├── main.tsx              # React entry point
│   │   ├── components/
│   │   │   └── Layout.tsx        # Persistent header, disclaimer banner, footer
│   │   ├── services/
│   │   │   └── api.ts            # Backend fetch calls
│   │   └── steps/                # One file per step
│   │       ├── Landing.tsx
│   │       ├── Consent.tsx
│   │       ├── ConditionSelection.tsx
│   │       ├── Upload.tsx
│   │       ├── Questions.tsx
│   │       ├── Loading.tsx
│   │       ├── Recommendation.tsx
│   │       └── Education.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts    # Dev proxy: /api → http://127.0.0.1:8000
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

---

## Running Locally

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at **http://127.0.0.1:8000**

Interactive docs: http://127.0.0.1:8000/docs

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies all `/api/*` requests to the FastAPI backend automatically.

---

## User Flow (8 Steps)

1. **Landing** — Tool overview and start button
2. **Consent** — Privacy policy, no-storage notice, non-diagnostic disclaimer
3. **Condition Selection** — User picks their concern from a grid of 8 cards (see below)
4. **Upload** — Optional photo upload (not stored); selected condition shown as context
5. **Questions** — Condition-specific question set loaded from the backend; renders dynamically
6. **Loading** — Spinner shown while fetching questions or generating a recommendation
7. **Recommendation** — Color-coded risk card, action, reason, tips, disclaimer
8. **Education** — Guide to care types (self-care, primary, urgent, specialist, ER)

---

## Condition Options

The condition selection screen presents 8 cards:

| Condition | Icon |
|-----------|------|
| Rash or irritated skin | 🔴 |
| Mole or unusual growth | 🔵 |
| Wound that won't heal | 🩹 |
| Swelling or lump | 🟡 |
| Eye redness or discharge | 👁️ |
| Bruising or discoloration | 🟣 |
| Dry or flaking skin | 🌿 |
| Insect bite or sting | 🐛 |

---

## API Reference

### `POST /api/analyze`

Accepts a selected condition and an optional image upload. Returns a condition-tailored question set.
Image is not stored — it is discarded immediately after this call.

**Form fields:**
- `condition` (string) — the selected condition label
- `image` (file, optional) — photo of the concern

**Response:**
```json
{
  "received_image": true,
  "questions": [
    {
      "id": "size_shape_change",
      "text": "Has it changed in size or shape recently?",
      "type": "single",
      "options": ["Yes", "No", "Not sure"]
    },
    {
      "id": "appearance",
      "text": "Does it have irregular edges or multiple colors?",
      "type": "multi",
      "options": ["Irregular edges", "Multiple colors", "Raised or bumpy", "None of these"]
    }
  ]
}
```

**Question sets by condition:**

| Condition | Questions |
|-----------|-----------|
| Mole or unusual growth | Size/shape change, appearance (irregular edges, colors), duration, texture |
| Rash or irritated skin | Duration, sensation (itching/burning), recent trigger changes, spreading |
| Eye redness or discharge | Pain/light sensitivity, discharge color, vision affected, duration |
| All other conditions | Generic: location, duration, symptoms (multi-select), progression (multi-select) |

---

### `POST /api/recommend`

Accepts the selected condition and dynamic user answers. Returns a care recommendation.

**Request body:**
```json
{
  "condition": "Mole or unusual growth",
  "answers": {
    "size_shape_change": "Yes",
    "appearance": ["Irregular edges", "Multiple colors"],
    "duration": "Less than 6 months",
    "texture": "Raised"
  }
}
```

**Triage logic:**

Condition-specific rules are checked first, then generic symptom rules apply as a fallback:

| Condition | Trigger | Risk | Action |
|-----------|---------|------|--------|
| Mole or unusual growth | Irregular edges, multiple colors, OR recent size/shape change | Higher | See a Dermatologist Soon |
| Eye redness or discharge | Vision affected OR pain reported | Higher | Consider Urgent Ophthalmology Care |
| Wound that won't heal | Duration more than a month | Moderate | Schedule a Primary Care Visit |
| Any | Bleeding, fever/chills, OR spreading (generic answers) | Higher | Consider Urgent Care |
| Any | Pain OR any progression change (generic answers) | Moderate | Schedule a Primary Care Visit |
| Any | Everything else | Low | Monitor at Home |

---

## Design Notes

- **No database** — fully stateless; no user data is persisted anywhere
- **No authentication** — anonymous use by design
- **No AI** — all triage logic is deterministic and rule-based
- **Privacy-first** — image uploads are discarded server-side immediately after the API call
- **Non-diagnostic** — every recommendation carries a medical disclaimer; the tool guides users toward the appropriate care setting only
