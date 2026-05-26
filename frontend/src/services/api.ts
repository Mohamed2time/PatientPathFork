import type {
  Question,
  DynamicAnswers,
  Recommendation,
  AIRecommendation,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function analyzeImage(condition: string, imageFile: File | null): Promise<Question[]> {
  const formData = new FormData();
  formData.append('condition', condition);
  if (imageFile) formData.append('image', imageFile);
  const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Analysis request failed');
  const data = await res.json();
  return data.questions as Question[];
}

export async function getRecommendation(
  condition: string,
  answers: DynamicAnswers,
): Promise<Recommendation> {
  const res = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ condition, answers }),
  });
  if (!res.ok) throw new Error('Recommendation request failed');
  return res.json();
}

export async function getAIRecommendation(
  condition: string,
  answers: DynamicAnswers,
  imageFile: File | null,
  questions: Question[],
): Promise<AIRecommendation> {
  const formData = new FormData();
  formData.append('condition', condition);
  formData.append('answers_json', JSON.stringify(answers));
  // Send question text alongside IDs so the AI sees full question context
  formData.append(
    'questions_json',
    JSON.stringify(questions.map((q) => ({ id: q.id, text: q.text }))),
  );
  if (imageFile) formData.append('image', imageFile);

  const res = await fetch(`${API_BASE}/api/ai-recommend`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`AI recommendation failed: ${res.status} ${msg}`);
  }
  return res.json();
}
