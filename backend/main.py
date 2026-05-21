import os

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Union
from services.gemini_service import analyze_with_context

app = FastAPI(title="HumanHealth API")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    id: str
    text: str
    type: str  # "single" | "multi"
    options: List[str]


class AnswersPayload(BaseModel):
    condition: str
    answers: Dict[str, Union[str, List[str]]]


class Recommendation(BaseModel):
    action: str
    riskLevel: str  # Low | Moderate | Higher
    urgency: str    # Low | Medium | High
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
    "Unexplained bruising": [
        {
            "id": "injury",
            "text": "Was there an injury or trauma that caused this bruise?",
            "type": "single",
            "options": ["Yes", "No", "Not sure"],
        },
        {
            "id": "count",
            "text": "How many bruises do you have?",
            "type": "single",
            "options": ["Just one", "A few (2–4)", "Many (5 or more)"],
        },
        {
            "id": "duration",
            "text": "How long has the bruising been present?",
            "type": "single",
            "options": ["Less than one week", "1–4 weeks", "More than a month"],
        },
        {
            "id": "medications",
            "text": "Are you taking blood thinners, aspirin, or anti-inflammatory medication?",
            "type": "single",
            "options": ["Yes", "No", "Not sure"],
        },
    ],
    "Skin discoloration or pigmentation": [
        {
            "id": "appearance",
            "text": "How would you describe the discoloration?",
            "type": "multi",
            "options": ["Dark spots or patches", "Lighter or pale patches", "Redness or pink areas", "Multiple colors"],
        },
        {
            "id": "duration",
            "text": "How long has it been present?",
            "type": "single",
            "options": ["Less than one week", "1–4 weeks", "More than a month"],
        },
        {
            "id": "changing",
            "text": "Has it been changing over time?",
            "type": "single",
            "options": ["Yes, getting larger", "Yes, getting darker or lighter", "No", "Not sure"],
        },
        {
            "id": "texture",
            "text": "Is there any raised texture, scaling, or roughness?",
            "type": "single",
            "options": ["Yes", "No"],
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
    """
    Accepts an optional image upload and the selected condition.
    Returns a condition-specific question set. No image is stored.
    """
    return {
        "received_image": image is not None,
        "questions": get_questions_for_condition(condition),
    }


@app.post("/api/recommend", response_model=Recommendation)
async def recommend(payload: AnswersPayload):
    """
    Applies condition-aware triage logic, then falls back to generic symptom rules.
    No AI is used — all logic is deterministic.
    """
    condition = payload.condition
    answers = payload.answers

    def get_list(key: str) -> set:
        val = answers.get(key, [])
        return set(val) if isinstance(val, list) else set()

    def get_str(key: str) -> str:
        val = answers.get(key, "")
        return val if isinstance(val, str) else ""

    # --- Condition-specific rules ---

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

    if condition == "Unexplained bruising":
        injury = get_str("injury")
        count = get_str("count")
        medications = get_str("medications")
        if injury == "No" and (count in ("A few (2–4)", "Many (5 or more)") or medications == "Yes"):
            return Recommendation(
                action="Schedule a Primary Care Visit",
                riskLevel="Moderate",
                urgency="Medium",
                reason=(
                    "Multiple unexplained bruises or bruising while on blood-thinning medication "
                    "can be a sign of an underlying condition affecting clotting or blood vessels. "
                    "A primary care provider can evaluate and order appropriate tests if needed."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Contact your primary care provider to schedule an appointment within the next few days.",
                    "Bring a list of all medications, supplements, and vitamins you are taking.",
                    "Avoid aspirin or ibuprofen unless prescribed, as these can worsen bruising.",
                    "Document the size and location of bruises with photos to track any changes.",
                ],
            )
        if injury == "No" and count == "Just one":
            return Recommendation(
                action="Monitor at Home",
                riskLevel="Low",
                urgency="Low",
                reason=(
                    "A single unexplained bruise without other symptoms is often minor and resolves on its own. "
                    "Monitor over the next week and seek care if new bruises appear or this one does not improve."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Apply a cold compress for the first 24–48 hours to reduce swelling.",
                    "Keep track of any new bruises that appear without explanation.",
                    "Note any accompanying symptoms such as fatigue, unusual bleeding, or joint pain.",
                    "See a primary care provider if it worsens or does not resolve within two weeks.",
                ],
            )

    if condition == "Skin discoloration or pigmentation":
        changing = get_str("changing")
        duration = get_str("duration")
        texture = get_str("texture")
        if changing in ("Yes, getting larger", "Yes, getting darker or lighter") or texture == "Yes":
            return Recommendation(
                action="See a Dermatologist",
                riskLevel="Moderate",
                urgency="Medium",
                reason=(
                    "Skin discoloration that is changing in size, color, or has developed texture "
                    "warrants evaluation by a dermatologist. These changes can sometimes indicate "
                    "conditions that benefit from early specialist review."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Schedule an appointment with a board-certified dermatologist.",
                    "Take clear, well-lit photos to document the current appearance before your visit.",
                    "Avoid picking, scratching, or applying untested home remedies to the area.",
                    "Note when you first noticed it and describe any changes since then to your provider.",
                ],
            )
        if duration == "More than a month":
            return Recommendation(
                action="Schedule a Primary Care or Dermatology Visit",
                riskLevel="Low",
                urgency="Medium",
                reason=(
                    "Skin discoloration that has been present for more than a month without change "
                    "is often benign, but a provider can confirm this and rule out underlying causes "
                    "such as hormonal changes, sun damage, or other skin conditions."
                ),
                disclaimer=DISCLAIMER,
                additionalTips=[
                    "Contact your primary care provider or a dermatologist for a routine evaluation.",
                    "Use broad-spectrum sunscreen (SPF 30+) on the area to prevent further pigment changes.",
                    "Document the area with photos to track any future changes.",
                    "Mention any recent hormonal changes, new medications, or significant sun exposure.",
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

    # --- Generic symptom-based fallback (applies to all conditions) ---

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
    """
    AI-powered care recommendation using condition + answers + optional image.
    Sends all context to Gemini in a single call.
    Image is not stored.
    """
    import json as json_module

    # Parse answers from JSON string
    try:
        answers = json_module.loads(answers_json)
    except json_module.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid answers format.")

    # Read image if provided
    image_bytes = None
    mime_type = "image/jpeg"
    if image:
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"File type {image.content_type} not supported."
            )
        image_bytes = await image.read()
        mime_type = image.content_type

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Call Gemini with everything
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