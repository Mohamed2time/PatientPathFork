import os
import json
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def load_system_prompt() -> str:
    prompt_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "prompts",
        "systemprompt.txt"
    )
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def build_user_message(condition: str, answers: dict) -> str:
    """
    Combine selected condition and follow-up answers into one prompt message.
    """
    message = f"Selected concern: {condition}\n\n"
    message += "User's answers to follow-up questions:\n"

    for question_id, answer in answers.items():
        if isinstance(answer, list):
            message += f"- {question_id}: {', '.join(answer)}\n"
        else:
            message += f"- {question_id}: {answer}\n"

    message += "\nPlease analyze the uploaded image along with the information above and provide care guidance."
    return message


async def analyze_with_context(
    condition: str,
    answers: dict,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg"
) -> dict:
    """
    Send condition + answers + image (optional) to Gemini.
    Returns structured care guidance.
    """
    system_prompt = load_system_prompt()
    user_message = build_user_message(condition, answers)

    # Build the parts list
    parts = []

    # Add image if provided
    if image_bytes:
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

    # Always add the text message
    parts.append(types.Part.from_text(text=user_message))
    # Retries gemini call 3 times slower each time if it fails produces message
    max_retries = 3
    last_error: Optional[Exception] = None
    response = None
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[types.Content(parts=parts)],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3,
                ),
            )
            break
        except Exception as e:
            last_error = e
            msg = str(e)
            transient = (
                "503" in msg
                or "UNAVAILABLE" in msg
                or "overloaded" in msg.lower()
            )
            if transient and attempt < max_retries - 1:
                wait_seconds = 2 * (attempt + 1)
                print(
                    f"[gemini] transient error "
                    f"(attempt {attempt + 1}/{max_retries}), "
                    f"retrying in {wait_seconds}s: {msg[:140]}"
                )
                await asyncio.sleep(wait_seconds)
                continue
            raise

    if response is None:
        raise last_error if last_error else RuntimeError(
            "Gemini call failed without producing a response"
        )

    # Clean markdown wrapping
    response_text = response.text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return json.loads(response_text.strip())