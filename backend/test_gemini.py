import os
import json
from google import genai 
from dotenv import load_dotenv
from google.genai import types


load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
#loading up the system prompt
with open("systemprompt.txt", "r", encoding="utf-8") as f:
    systemprompt = f.read()
#loading up the image
with open("blackmole.jpeg", "rb") as f:
    image_bytes = f.read()

#acting like user
user_condition = "Mole or unusual growth"
user_answers = {
    "duration": "changed in size or shape recently",
    "sensation": ["Irregular edges"],
    "triggers": "Not sure",
    "spreading": "No",
}

user_message = f"""Selected concern: {user_condition}
User's answers to follow up questions: 
"""
for question_id, answer in user_answers.items():
    if isinstance(answer, list):
        user_message += f"- {question_id}: {', '.join(answer)}\n"
    else:
        user_message += f"- {question_id}: {answer}\n"
user_message += "\nPlease analyze the uploaded image along with the information above and provide care guidance."






response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        types.Content(
            parts=[
                types.Part.from_bytes(data = image_bytes, mime_type="image/jpeg"),
                types.Part.from_text(text=user_message)
            ],
        ),
    ],
    config=types.GenerateContentConfig(
        system_instruction=systemprompt,
        temperature=0.3,
    ),
)

# Parse
print("=== RAW ===")
print(response.text)

response_text = response.text.strip()
if response_text.startswith("```json"):
    response_text = response_text[7:]
if response_text.startswith("```"):
    response_text = response_text[3:]
if response_text.endswith("```"):
    response_text = response_text[:-3]

result = json.loads(response_text.strip())

print("\n=== PARSED ===")
print(f"Category: {result['category']}")
print(f"Confidence: {result['confidence']}/10")
print(f"Severity: {result['severity']}")
print(f"Care Level: {result['care_level']}")
print(f"Action: {result['action']}")
print(f"Reason: {result['reason']}")
print(f"Image Note: {result['image_note']}")
print(f"Tips:")
for tip in result['additional_tips']:
    print(f"  - {tip}")
print(f"Questions for doctor:")
for q in result['follow_up_questions']:
    print(f"  - {q}")
