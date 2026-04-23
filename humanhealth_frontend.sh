#!/usr/bin/env bash
set -e

mkdir -p backend/prompts
mkdir -p backend/services
mkdir -p frontend/src/services
mkdir -p frontend/src/steps

cat > backend/prompts/system_prompt.txt <<'EOF'
You are a non-diagnostic health guidance assistant for HumanHealth.
You do NOT diagnose. You do NOT provide medical advice. Your role is
to help users understand what type of healthcare professional to
consider consulting based on a visible health concern.

You will receive THREE pieces of context about the user's concern:
1. SELECTED CONCERN - what the user believes their issue is
2. IMAGE - a photo of their concern (if provided)
3. ANSWERS - the user's responses to follow-up questions

Use ALL of these together. If the image suggests something different
from what the user selected, note this gently - do not override
their concern, but mention it as additional context for a provider.

Based on the combined context:
1. CATEGORY: Identify which group the concern most closely resembles:
- Acne / Rosacea
- Eczema / Dermatitis
- Psoriasis
- Fungal Infection
- Warts / Viral Skin Growths
- Hives / Allergic Reaction
- Bug Bites / Stings
- Skin Infection
- Suspicious Mole / Growth
- Eye Concern
- Wound / Slow Healing
- Unknown / Unclear

2. CONFIDENCE: Rate 1-10. If below 5, default to Unknown / Unclear.
3. SEVERITY:
- Mild (small area, minimal symptoms)
- Moderate (noticeable spread, clear symptoms)
- Severe (large area, significant symptoms, signs of infection)

4. CARE LEVEL:
- Self-care
- Primary care physician
- Dermatologist
- Urgent care

5. ACTION: Clear action statement (e.g. "See a Dermatologist Soon")
6. REASON: 2-3 sentence explanation referencing the image and answers.
7. ADDITIONAL TIPS: 4 actionable tips for the user.
8. IMAGE NOTE: If image suggests something different from what the
user selected, provide a gentle note. Otherwise set to null.
9. FOLLOW-UP QUESTIONS: 2-3 questions the user should ask their
healthcare provider during their visit.
10. DISCLAIMER: Always include.

Respond ONLY in this JSON format:
{
  "category": "",
  "confidence": 0,
  "severity": "",
  "care_level": "",
  "action": "",
  "reason": "",
  "additional_tips": [],
  "image_note": null,
  "follow_up_questions": [],
  "disclaimer": "This is not a medical diagnosis. Always consult a licensed healthcare provider for proper evaluation and treatment."
}
EOF

cat > backend/services/__init__.py <<'EOF'
# Makes the services folder a Python package.
EOF

cat > backend/services/gemini_service.py <<'EOF'
import json
import os
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def load_system_prompt() -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "prompts",
        "system_prompt.txt",
    )
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def build_user_message(condition: str, answers: dict) -> str:
    msg = f"Selected concern: {condition}\n\n"
    msg += "User's answers:\n"

    for qid, ans in answers.items():
        if isinstance(ans, list):
            msg += f"- {qid}: {', '.join(ans)}\n"
        else:
            msg += f"- {qid}: {ans}\n"

    msg += "\nAnalyze the image with this info."
    return msg


async def analyze_with_context(
    condition: str,
    answers: dict,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
) -> dict:
    system_prompt = load_system_prompt()
    user_message = build_user_message(condition, answers)

    parts = []
    if image_bytes:
        parts.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            )
        )

    parts.append(types.Part.from_text(text=user_message))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[types.Content(parts=parts)],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.3,
        ),
    )

    response_text = response.text.strip()

    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return json.loads(response_text.strip())
EOF

cat > backend/main.py <<'EOF'
from typing import Dict, List, Optional, Union

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.gemini_service import analyze_with_context

app = FastAPI(title="HumanHealth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    id: str
    text: str
    type: str
    options: List[str]


class AnswersPayload(BaseModel):
    condition: str
    answers: Dict[str, Union[str, List[str]]]


class Recommendation(BaseModel):
    action: str
    riskLevel: str
    urgency: str
    reason: str
    disclaimer: str
    additionalTips: List[str]


class AIRecommendation(BaseModel):
    category: str
    confidence: int
    severity: str
    care_level: str
    action: str
    reason: str
    additional_tips: List[str]
    image_note: Optional[str]
    follow_up_questions: List[str]
    disclaimer: str


DISCLAIMER = (
    "This is not a medical diagnosis. Always consult a licensed healthcare "
    "provider for proper evaluation and treatment."
)

QUESTIONS_BY_CONDITION: Dict[str, List[dict]] = {
    "Mole or unusual growth": [
        {
            "id": "size_shape_change",
            "text": "Has it changed in size or shape recently?",
            "type": "single",
            "options": ["Yes", "No", "Not sure"],
        },
        {
            "id": "appearance",
            "text": "Does it have irregular edges or multiple colors?",
            "type": "multi",
            "options": ["Irregular edges", "Multiple colors", "Raised or bumpy", "None of these"],
        },
        {
            "id": "duration",
            "text": "How long have you had it?",
            "type": "single",
            "options": ["Less than 6 months", "6 months – 2 years", "More than 2 years", "Not sure"],
        },
        {
            "id": "texture",
            "text": "Is it raised or flat?",
            "type": "single",
            "options": ["Raised", "Flat", "Mixed or uneven"],
        },
    ],
    "Rash or irritated skin": [
        {
            "id": "duration",
            "text": "How long have you had it?",
            "type": "single",
            "options": ["Less than one week", "1–4 weeks", "More than a month"],
        },
        {
            "id": "sensation",
            "text": "Is there itching or burning?",
            "type": "multi",
            "options": ["Itching", "Burning", "Neither"],
        },
        {
            "id": "triggers",
            "text": "Have you changed soaps, detergents, or foods recently?",
            "type": "single",
            "options": ["Yes", "No", "Not sure"],
        },
        {
            "id": "spreading",
            "text": "Is it spreading?",
            "type": "single",
            "options": ["Yes, rapidly", "Yes, slowly", "No"],
        },
    ],
    "Eye redness or discharge": [
        {
            "id": "pain_light",
            "text": "Is there pain or sensitivity to light?",
            "type": "multi",
            "options": ["Pain", "Light sensitivity", "Neither"],
        },
        {
            "id": "discharge",
            "text": "Is there discharge, and if so what color?",
            "type": "single",
            "options": [
                "No discharge",
                "Clear discharge",
                "Yellow or green discharge",
                "Crusty or dried discharge",
            ],
        },
        {
            "id": "vision",
            "text": "Is your vision affected?",
            "type": "single",
            "options": ["Yes", "No", "Not sure"],
        },
        {
            "id": "duration",
            "text": "How long has it been red?",
            "type": "single",
            "options": ["Less than 24 hours", "1–3 days", "More than 3 days"],
        },
    ],
}

GENERIC_QUESTIONS: List[dict] = [
    {
        "id": "location",
        "text": "Where is the concern located?",
        "type": "single",
        "options": ["Skin", "Eye"],
    },
    {
        "id": "duration",
        "text": "How long has this been present?",
        "type": "single",
        "options": ["Less than one week", "1–4 weeks", "More than a month"],
    },
    {
        "id": "symptoms",
        "text": "Are you experiencing any of these?",
        "type": "multi",
        "options": ["Pain", "Itching", "Bleeding", "Swelling", "Fever or chills", "None of these"],
    },
    {
        "id": "progression",
        "text": "Have you noticed any changes?",
        "type": "multi",
        "options": [
            "Change in size",
            "Change in shape",
            "Change in color",
            "Spreading to other areas",
            "No changes noticed",
        ],
    },
]


def get_questions_for_condition(condition: str) -> List[dict]:
    return QUESTIONS_BY_CONDITION.get(condition, GENERIC_QUESTIONS)


@app.post("/api/analyze")
async def analyze(condition: str = Form(""), image: Optional[UploadFile] = File(None)):
    return {
        "received_image": image is not None,
        "questions": get_questions_for_condition(condition),
    }


@app.post("/api/recommend", response_model=Recommendation)
async def recommend(payload: AnswersPayload):
    condition = payload.condition
    answers = payload.answers

    def get_list(key: str) -> set:
        val = answers.get(key, [])
        return set(val) if isinstance(val, list) else set()

    def get_str(key: str) -> str:
        val = answers.get(key, "")
        return val if isinstance(val, str) else ""

    if condition == "Mole or unusual growth":
        appearance = get_list("appearance")
        if (
            "Irregular edges" in appearance
            or "Multiple colors" in appearance
            or get_str("size_shape_change") == "Yes"
        ):
            return Recommendation(
                action="See a Dermatologist Soon",
                riskLevel="Higher",
                urgency="High",
                reason=(
                    "Your mole or growth has features — such as irregular edges, multiple colors, "
                    "or recent change in size or shape — that warrant evaluation by a dermatologist. "
                    "These characteristics can be associated with conditions that benefit from early review."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Schedule an appointment with a board-certified dermatologist as soon as possible.",
                    "Do not attempt to remove or treat the growth at home.",
                    "Take clear photos over time to document any further changes.",
                    "Mention your full skin history, including sun exposure and family history of skin conditions.",
                ],
            )

    if condition == "Eye redness or discharge":
        pain_light = get_list("pain_light")
        if get_str("vision") == "Yes" or "Pain" in pain_light:
            return Recommendation(
                action="Consider Urgent Ophthalmology Care",
                riskLevel="Higher",
                urgency="High",
                reason=(
                    "Your symptoms — including changes to your vision or significant eye pain — "
                    "may indicate a condition that requires prompt evaluation by an eye care specialist. "
                    "Delays in treatment for certain eye conditions can affect outcomes."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Seek urgent care at an ophthalmology clinic or emergency department.",
                    "Avoid rubbing or touching your eye.",
                    "Do not use over-the-counter eye drops without guidance from a provider.",
                    "If you wear contact lenses, remove them immediately.",
                ],
            )

    if condition == "Wound that won't heal":
        if get_str("duration") == "More than a month":
            return Recommendation(
                action="Schedule a Primary Care Visit",
                riskLevel="Moderate",
                urgency="Medium",
                reason=(
                    "A wound that has not healed after more than four weeks should be evaluated "
                    "by a healthcare provider. Persistent wounds can have underlying causes — "
                    "such as circulation issues or infection — that require medical attention."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Contact your primary care provider to schedule an appointment within the next few days.",
                    "Keep the wound clean and covered with a sterile dressing.",
                    "Monitor for signs of infection: increasing redness, warmth, swelling, or discharge.",
                    "Note any related symptoms such as fever or pain to share with your provider.",
                ],
            )

    symptoms = get_list("symptoms")
    progression = get_list("progression")

    HIGH_RISK_SYMPTOMS = {"Bleeding", "Fever or chills"}
    HIGH_RISK_PROGRESSION = {"Spreading to other areas"}
    NO_CHANGE_PROGRESSION = {"No changes noticed"}
    MODERATE_SYMPTOMS = {"Pain"}

    if symptoms & HIGH_RISK_SYMPTOMS or progression & HIGH_RISK_PROGRESSION:
        return Recommendation(
            action="Consider Urgent Care",
            riskLevel="Higher",
            urgency="High",
            reason=(
                "One or more of your selected symptoms — such as bleeding, fever, or "
                "rapidly spreading concern — may require prompt medical attention. "
                "Urgent care or an emergency visit is recommended."
            ),
            disclaimer=DISCLAIMER,
            additionalTips=[
                "Visit an urgent care clinic or emergency room as soon as possible.",
                "Do not apply home remedies to an actively bleeding or infected area.",
                "Bring a list of any medications you are currently taking.",
                "If symptoms worsen rapidly (spreading, difficulty breathing), call 911.",
            ],
        )

    moderate_progression = progression - NO_CHANGE_PROGRESSION
    if MODERATE_SYMPTOMS & symptoms or moderate_progression:
        return Recommendation(
            action="Schedule a Primary Care Visit",
            riskLevel="Moderate",
            urgency="Medium",
            reason=(
                "Your concern shows signs of change or discomfort that should be "
                "evaluated by a healthcare provider within the next few days. "
                "A primary care physician can assess and refer you if needed."
            ),
            disclaimer=DISCLAIMER,
            additionalTips=[
                "Contact your primary care provider to schedule an appointment.",
                "Take clear photos of the concern over the next few days to track changes.",
                "Avoid scratching or irritating the area.",
                "Note any new symptoms before your appointment.",
            ],
        )

    if get_str("duration") == "More than a month":
        return Recommendation(
            action="Schedule a Primary Care Visit",
            riskLevel="Moderate",
            urgency="Medium",
            reason=(
                "Your concern has been present for more than a month. Even without "
                "alarming symptoms, a prolonged concern warrants evaluation by a "
                "healthcare provider to rule out underlying causes."
            ),
            disclaimer=DISCLAIMER,
            additionalTips=[
                "Contact your primary care provider to schedule an appointment.",
                "Take clear photos of the concern to document any changes over time.",
                "Note when it first appeared and any changes since then.",
                "Avoid irritating the area while you wait for your appointment.",
            ],
        )

    return Recommendation(
        action="Monitor at Home",
        riskLevel="Low",
        urgency="Low",
        reason=(
            "Based on your responses, this concern appears stable with no alarming "
            "symptoms. You can monitor it at home over the next week and seek care "
            "if anything changes."
        ),
        disclaimer=DISCLAIMER,
        additionalTips=[
            "Keep the area clean and dry.",
            "Avoid picking, scratching, or irritating the concern.",
            "Monitor for any new symptoms such as pain, spreading, or color change.",
            "Schedule a routine visit with your doctor if it has not resolved in two weeks.",
        ],
    )


@app.post("/api/ai-recommend", response_model=AIRecommendation)
async def ai_recommend(
    condition: str = Form(...),
    answers_json: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    import json as json_module

    try:
        answers = json_module.loads(answers_json)
    except json_module.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid answers format.")

    image_bytes = None
    mime_type = "image/jpeg"

    if image:
        allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if image.content_type not in allowed:
            raise HTTPException(status_code=400, detail="File type not supported.")

        image_bytes = await image.read()
        mime_type = image.content_type or "image/jpeg"

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    try:
        result = await analyze_with_context(
            condition=condition,
            answers=answers,
            image_bytes=image_bytes,
            mime_type=mime_type,
        )
        return AIRecommendation(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
EOF

cat > frontend/src/types.ts <<'EOF'
export type AppStep =
  | 'landing'
  | 'consent'
  | 'conditionSelection'
  | 'upload'
  | 'questions'
  | 'loading'
  | 'recommendation'
  | 'education';

export type RiskLevel = 'Low' | 'Moderate' | 'Higher';
export type Urgency = 'Low' | 'Medium' | 'High';

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multi';
  options: string[];
}

export type DynamicAnswers = Record<string, string | string[]>;

export interface Recommendation {
  action: string;
  riskLevel: RiskLevel;
  urgency: Urgency;
  reason: string;
  disclaimer: string;
  additionalTips: string[];
}

export interface AIRecommendation {
  category: string;
  confidence: number;
  severity: string;
  care_level: string;
  action: string;
  reason: string;
  additional_tips: string[];
  image_note: string | null;
  follow_up_questions: string[];
  disclaimer: string;
}

export const CONDITION_OPTIONS: { label: string; icon: string }[] = [
  { label: 'Rash or irritated skin', icon: '🩹' },
  { label: 'Mole or unusual growth', icon: '🔍' },
  { label: "Wound that won't heal", icon: '🩺' },
  { label: 'Swelling or lump', icon: '⚠️' },
  { label: 'Eye redness or discharge', icon: '👁️' },
  { label: 'Bruising or discoloration', icon: '🟣' },
  { label: 'Dry or flaking skin', icon: '🧴' },
  { label: 'Insect bite or sting', icon: '🐝' },
];
EOF

cat > frontend/src/services/api.ts <<'EOF'
import type {
  Question,
  DynamicAnswers,
  Recommendation,
  AIRecommendation,
} from '../types';

export async function analyzeImage(
  condition: string,
  imageFile: File | null
): Promise<Question[]> {
  const formData = new FormData();
  formData.append('condition', condition);

  if (imageFile) {
    formData.append('image', imageFile);
  }

  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Analysis request failed');
  }

  const data = await res.json();
  return data.questions as Question[];
}

export async function getRecommendation(
  condition: string,
  answers: DynamicAnswers
): Promise<Recommendation> {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ condition, answers }),
  });

  if (!res.ok) {
    throw new Error('Recommendation request failed');
  }

  return res.json();
}

export async function getAIRecommendation(
  condition: string,
  answers: Record<string, string | string[]>,
  imageFile?: File | null
): Promise<AIRecommendation> {
  const formData = new FormData();
  formData.append('condition', condition);
  formData.append('answers_json', JSON.stringify(answers));

  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch('/api/ai-recommend', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'AI recommendation failed');
  }

  return response.json();
}
EOF

cat > frontend/src/App.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import type {
  AppStep,
  Question,
  DynamicAnswers,
  Recommendation,
  AIRecommendation,
} from './types';
import {
  analyzeImage,
  getRecommendation,
  getAIRecommendation,
} from './services/api';

import Layout from './components/Layout';
import Landing from './steps/Landing';
import Consent from './steps/Consent';
import ConditionSelection from './steps/ConditionSelection';
import Upload from './steps/Upload';
import Questions from './steps/Questions';
import Loading from './steps/Loading';
import RecommendationStep from './steps/Recommendation';
import Education from './steps/Education';

const STEP_SUBTITLES: Record<AppStep, string> = {
  landing: 'Care Guidance Tool',
  consent: 'Privacy & Consent',
  conditionSelection: 'Select Your Concern',
  upload: 'Photo Upload',
  questions: 'Health Questions',
  loading: 'Please Wait…',
  recommendation: 'Your Guidance',
  education: 'Care Options Guide',
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [loadingSubMessage, setLoadingSubMessage] = useState<string | undefined>(undefined);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (step === 'loading') {
      setShowSlowMessage(false);
      timer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 5000);
    } else {
      setShowSlowMessage(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step]);

  const handleConditionSelected = (condition: string) => {
    setSelectedCondition(condition);
    setAnswers({});
    setQuestions([]);
    setRecommendation(null);
    setAiResult(null);
    setUseAI(false);
    setStep('upload');
  };

  const fetchQuestionsAndProceed = async (file: File | null) => {
    setLoadingMessage('Loading Your Questions');
    setLoadingSubMessage('Tailoring questions to your selected concern…');
    setStep('loading');
    setError(null);

    try {
      const qs = await analyzeImage(selectedCondition, file);
      setQuestions(qs);
      setAnswers({});
      setStep('questions');
    } catch {
      setError('Could not load questions. Please check your connection and try again.');
      setStep('upload');
    }
  };

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    fetchQuestionsAndProceed(file);
  };

  const handleSkip = () => {
    setImageFile(null);
    fetchQuestionsAndProceed(null);
  };

  const handleSubmitQuestions = async () => {
    setStep('loading');
    setError(null);

    if (imageFile) {
      setLoadingMessage('Analyzing your image and responses...');
      setLoadingSubMessage('Using AI to generate more context-aware guidance.');
    } else {
      setLoadingMessage('Generating your guidance...');
      setLoadingSubMessage('Using our standard recommendation flow.');
    }

    try {
      if (imageFile) {
        const result = await getAIRecommendation(selectedCondition, answers, imageFile);
        setAiResult(result);
        setRecommendation(null);
        setUseAI(true);
      } else {
        const result = await getRecommendation(selectedCondition, answers);
        setRecommendation(result);
        setAiResult(null);
        setUseAI(false);
      }

      setStep('recommendation');
    } catch {
      try {
        const result = await getRecommendation(selectedCondition, answers);
        setRecommendation(result);
        setAiResult(null);
        setUseAI(false);
        setStep('recommendation');
      } catch {
        setError('Something went wrong. Please check that the backend is running and try again.');
        setStep('questions');
      }
    }
  };

  const reset = () => {
    setStep('landing');
    setSelectedCondition('');
    setImageFile(null);
    setQuestions([]);
    setAnswers({});
    setRecommendation(null);
    setAiResult(null);
    setUseAI(false);
    setError(null);
    setLoadingMessage(undefined);
    setLoadingSubMessage(undefined);
  };

  return (
    <Layout title="HumanHealth" subtitle={STEP_SUBTITLES[step]}>
      {step === 'landing' && (
        <Landing onStart={() => setStep('consent')} />
      )}

      {step === 'consent' && (
        <Consent
          onAgree={() => setStep('conditionSelection')}
          onBack={() => setStep('landing')}
        />
      )}

      {step === 'conditionSelection' && (
        <ConditionSelection
          onSelect={handleConditionSelected}
          onBack={() => setStep('consent')}
        />
      )}

      {step === 'upload' && (
        <Upload
          selectedCondition={selectedCondition}
          onImageSelected={handleImageSelected}
          onSkip={handleSkip}
        />
      )}

      {step === 'questions' && (
        <Questions
          condition={selectedCondition}
          questions={questions}
          answers={answers}
          onChange={setAnswers}
          onSubmit={handleSubmitQuestions}
          error={error}
        />
      )}

      {step === 'loading' && (
        <Loading
          message={loadingMessage}
          subMessage={
            showSlowMessage
              ? 'Taking longer than expected...'
              : loadingSubMessage
          }
        />
      )}

      {step === 'recommendation' && (
        <RecommendationStep
          recommendation={recommendation}
          aiRecommendation={aiResult}
          useAI={useAI}
          condition={selectedCondition}
          onLearnMore={() => setStep('education')}
          onReset={reset}
        />
      )}

      {step === 'education' && (
        <Education onBack={() => setStep('recommendation')} />
      )}
    </Layout>
  );
};

export default App;
EOF

cat > frontend/src/steps/Recommendation.tsx <<'EOF'
import React from 'react';
import type { Recommendation, AIRecommendation } from '../types';

interface Props {
  recommendation: Recommendation | null;
  aiRecommendation: AIRecommendation | null;
  useAI: boolean;
  condition: string;
  onLearnMore: () => void;
  onReset: () => void;
}

const riskStyles: Record<
  'Low' | 'Moderate' | 'Higher',
  { card: string; dot: string }
> = {
  Low: {
    card: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  Moderate: {
    card: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-500',
  },
  Higher: {
    card: 'bg-rose-50 border-rose-200 text-rose-800',
    dot: 'bg-rose-500',
  },
};

const careStyles: Record<string, string> = {
  'Self-care': 'bg-green-50 border-green-300 text-green-800',
  'Primary care physician': 'bg-yellow-50 border-yellow-300 text-yellow-800',
  Dermatologist: 'bg-orange-50 border-orange-300 text-orange-800',
  'Urgent care': 'bg-red-50 border-red-300 text-red-800',
};

const RecommendationStep: React.FC<Props> = ({
  recommendation,
  aiRecommendation,
  useAI,
  condition,
  onLearnMore,
  onReset,
}) => {
  if (useAI && aiRecommendation) {
    const careStyle =
      careStyles[aiRecommendation.care_level] ??
      'bg-slate-50 border-slate-300 text-slate-800';

    return (
      <div className="space-y-6">
        <div className={`rounded-3xl border-2 p-6 ${careStyle}`}>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide">
            AI Care Guidance
          </div>

          {condition && (
            <div className="mb-3 inline-flex rounded-full bg-white/70 px-3 py-1 text-sm font-medium">
              {condition}
            </div>
          )}

          <h2 className="text-2xl font-bold">{aiRecommendation.action}</h2>
          <p className="mt-3 text-base leading-7">{aiRecommendation.reason}</p>

          <div className="mt-4 rounded-2xl border border-white/60 bg-white/60 p-4">
            <div className="text-sm font-semibold">Recommended care level</div>
            <div className="mt-1 text-lg font-bold">{aiRecommendation.care_level}</div>
            <div className="mt-2 text-sm">Severity: {aiRecommendation.severity}</div>
          </div>

          {aiRecommendation.image_note && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <strong>Note from image analysis:</strong> {aiRecommendation.image_note}
            </div>
          )}

          <div className="mt-4 text-sm text-slate-700">
            Confidence: {aiRecommendation.confidence}/10 • Category: {aiRecommendation.category}
          </div>

          <div className="mt-5 rounded-2xl bg-white/60 p-4 text-sm">
            {aiRecommendation.disclaimer}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Additional Tips</h3>
          <ul className="mt-4 space-y-3">
            {aiRecommendation.additional_tips.map((tip, i) => (
              <li key={i} className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Questions for Your Visit</h3>
          <ul className="mt-4 space-y-3">
            {aiRecommendation.follow_up_questions.map((q, i) => (
              <li key={i} className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                {q}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onLearnMore}
            className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Understanding care options
          </button>

          <button
            onClick={onReset}
            className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
          >
            Start New Assessment
          </button>
        </div>

        <p className="text-sm text-slate-500">
          If symptoms worsen rapidly — such as rapid spreading, severe pain, or difficulty breathing —
          seek emergency care immediately.
        </p>
      </div>
    );
  }

  if (!recommendation) return null;

  const styles = riskStyles[recommendation.riskLevel] ?? riskStyles.Low;

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border-2 p-6 ${styles.card}`}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-sm font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
          {recommendation.riskLevel} Concern
        </div>

        {condition && (
          <div className="mb-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-sm font-medium">
              {condition}
            </span>
          </div>
        )}

        <h2 className="text-2xl font-bold">{recommendation.action}</h2>
        <p className="mt-3 text-base leading-7">{recommendation.reason}</p>

        <div className="mt-5 rounded-2xl bg-white/60 p-4 text-sm">
          {recommendation.disclaimer}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold">Suggested Next Steps</h3>
        <ul className="mt-4 space-y-3">
          {recommendation.additionalTips.map((tip, i) => (
            <li key={i} className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onLearnMore}
          className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
        >
          Understanding care options
        </button>

        <button
          onClick={onReset}
          className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
        >
          Start New Assessment
        </button>
      </div>

      <p className="text-sm text-slate-500">
        If symptoms worsen rapidly — such as rapid spreading, severe pain, or difficulty breathing —
        seek emergency care immediately.
      </p>
    </div>
  );
};

export default RecommendationStep;
EOF

cat > frontend/src/steps/Consent.tsx <<'EOF'
import React from 'react';

interface ConsentProps {
  onAgree: () => void;
  onBack: () => void;
}

const Consent: React.FC<ConsentProps> = ({ onAgree, onBack }) => {
  const consentItems = [
    {
      title: 'How your image is used',
      body:
        "If you upload an image, it will be analyzed by Google's Gemini AI to help generate your recommendation. Your image is not stored and is discarded immediately after analysis.",
    },
    {
      title: 'Important limitation',
      body:
        'This tool provides guidance only and does not diagnose medical conditions or replace a licensed healthcare provider.',
    },
    {
      title: 'When to seek urgent help',
      body:
        'If you have severe pain, trouble breathing, major bleeding, or sudden vision loss, seek emergency care right away.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Before You Continue</h2>
        <p className="mt-3 text-slate-600">
          Please review the information below and confirm that you understand how this tool works.
        </p>

        <div className="mt-6 space-y-4">
          {consentItems.map((item) => (
            <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onAgree}
          className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
        >
          I Understand and Agree
        </button>

        <button
          onClick={onBack}
          className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default Consent;
EOF

cat > frontend/src/steps/Loading.tsx <<'EOF'
import React from 'react';

interface LoadingProps {
  message?: string;
  subMessage?: string;
}

const Loading: React.FC<LoadingProps> = ({ message, subMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      <h2 className="mt-6 text-2xl font-bold text-slate-900">
        {message || 'Loading...'}
      </h2>
      <p className="mt-3 max-w-md text-slate-600">
        {subMessage || 'Please wait while we prepare your guidance.'}
      </p>
    </div>
  );
};

export default Loading;
EOF

python3 - <<'EOF'
from pathlib import Path

req = Path("backend/requirements.txt")
required = [
    "fastapi",
    "uvicorn",
    "python-multipart",
    "pydantic",
    "google-genai",
    "python-dotenv",
]

if req.exists():
    existing = [line.strip() for line in req.read_text().splitlines() if line.strip()]
    for pkg in required:
        if pkg not in existing:
            existing.append(pkg)
    req.write_text("\n".join(existing) + "\n")
else:
    req.write_text("\n".join(required) + "\n")
EOF

echo "Done."
echo "Next:"
echo "1) Put GEMINI_API_KEY=your_key in backend/.env"
echo "2) cd backend && pip install -r requirements.txt"
echo "3) cd frontend && npm install"
echo "4) git add . && git commit -m 'Add Gemini AI recommendation flow' && git push"