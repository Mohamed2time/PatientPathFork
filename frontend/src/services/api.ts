import type {
  Question,
  DynamicAnswers,
  Recommendation,
  AIRecommendation,
} from '../types';

export async function analyzeImage(condition: string, imageFile: File | null): Promise<Question[]> {
  const formData = new FormData();
  formData.append('condition', condition);
  if (imageFile) formData.append('image', imageFile);
  const res = await fetch('/api/analyze', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Analysis request failed');
  const data = await res.json();
  return data.questions as Question[];
}

export async function getRecommendation(
  condition: string,
  answers: DynamicAnswers,
): Promise<Recommendation> {
  const res = await fetch('/api/recommend', {
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
): Promise<AIRecommendation> {
  const formData = new FormData();
  formData.append('condition', condition);
  formData.append('answers_json', JSON.stringify(answers));
  if (imageFile) formData.append('image', imageFile);

  const res = await fetch('/api/ai-recommend', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`AI recommendation failed: ${res.status} ${msg}`);
  }
  return res.json();
}
