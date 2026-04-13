from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

app = FastAPI(title="HumanHealth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnswersPayload(BaseModel):
    location: str
    duration: str
    symptoms: List[str]
    progression: List[str]


class Recommendation(BaseModel):
    action: str
    riskLevel: str  # Low | Moderate | Higher
    urgency: str    # Low | Medium | High
    reason: str
    disclaimer: str
    additionalTips: List[str]


DISCLAIMER = (
    "This is not a medical diagnosis. Always consult a licensed healthcare "
    "provider for proper evaluation and treatment."
)


@app.post("/api/analyze")
async def analyze(image: Optional[UploadFile] = File(None)):
    """
    Accepts an optional image upload and returns the hardcoded question schema.
    No image is stored — it is discarded immediately after this call.
    """
    return {
        "received_image": image is not None,
        "questions": {
            "location": ["Skin", "Eye"],
            "duration": ["Less than one week", "1-4 weeks", "More than a month"],
            "symptoms": ["Pain", "Itching", "Bleeding", "Swelling", "Fever or chills", "None of these"],
            "progression": [
                "Change in size",
                "Change in shape",
                "Change in color",
                "Spreading to other areas",
                "No changes noticed",
            ],
        },
    }


@app.post("/api/recommend", response_model=Recommendation)
async def recommend(payload: AnswersPayload):
    """
    Applies rule-based triage logic and returns a care recommendation.
    No AI is used — all logic is deterministic.
    """
    symptoms = set(payload.symptoms)
    progression = set(payload.progression)

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
