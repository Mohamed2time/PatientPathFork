# HumanHealth

A non-diagnostic health guidance tool built as a University of Washington capstone project.
Helps users understand what type of care to seek based on a visible health concern.

> **This tool does not provide medical diagnoses.** Always consult a licensed healthcare provider.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend  | FastAPI (Python 3.9+)               |
| Styling  | Tailwind CSS v3                     |
| Build    | Vite                                |

---

## Project Structure

```
HumanHealth/
├── backend/
│   ├── main.py           # FastAPI app with /api/analyze and /api/recommend
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root component, step routing
│   │   ├── types.ts          # Shared types and constants
│   │   ├── index.css         # Tailwind entry
│   │   ├── main.tsx          # React entry point
│   │   ├── components/
│   │   │   └── Layout.tsx    # Persistent header, disclaimer banner, footer
│   │   ├── services/
│   │   │   └── api.ts        # Backend fetch calls
│   │   └── steps/            # One file per step
│   │       ├── Landing.tsx
│   │       ├── Consent.tsx
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

## API Reference

### `POST /api/analyze`
Accepts an optional image upload. Returns the question schema. Image is not stored.

**Response:**
```json
{
  "received_image": true,
  "questions": {
    "location": ["Skin", "Eye"],
    "duration": ["Less than one week", "1-4 weeks", "More than a month"],
    "symptoms": ["Pain", "Itching", "Bleeding", "Swelling", "Fever or chills", "None of these"],
    "progression": ["Change in size", "Change in shape", "Change in color", "Spreading to other areas", "No changes noticed"]
  }
}
```

### `POST /api/recommend`
Accepts user answers and returns a care recommendation.

**Request body:**
```json
{
  "location": "Skin",
  "duration": "Less than one week",
  "symptoms": ["Pain"],
  "progression": ["Change in size"]
}
```

**Triage logic:**
| Condition | Risk Level | Action |
|-----------|------------|--------|
| Bleeding, Fever or chills, OR Spreading to other areas | Higher | Consider Urgent Care |
| Pain OR any progression changes (other than "No changes noticed") | Moderate | Schedule a Primary Care Visit |
| Everything else | Low | Monitor at Home |

---

## User Flow

1. **Landing** — Tool overview and start button
2. **Consent** — Privacy policy, no-storage notice, non-diagnostic disclaimer
3. **Upload** — Optional photo upload (not stored)
4. **Questions** — Location, duration, symptoms (multi-select), progression (multi-select)
5. **Loading** — Request in progress
6. **Recommendation** — Color-coded risk card, action, reason, tips, disclaimer
7. **Education** — Guide to care types (self-care, primary, urgent, specialist, ER)
