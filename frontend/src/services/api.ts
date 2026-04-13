import type { UserAnswers, Recommendation } from '../types';

export async function analyzeImage(imageFile: File | null): Promise<void> {
  const formData = new FormData();
  if (imageFile) {
    formData.append('image', imageFile);
  }
  const res = await fetch('/api/analyze', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Analysis request failed');
}

export async function getRecommendation(answers: UserAnswers): Promise<Recommendation> {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  if (!res.ok) throw new Error('Recommendation request failed');
  return res.json();
}
