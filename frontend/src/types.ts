export type AppStep =
  | 'landing'
  | 'consent'
  | 'upload'
  | 'questions'
  | 'loading'
  | 'recommendation'
  | 'education';

export type RiskLevel = 'Low' | 'Moderate' | 'Higher';
export type Urgency = 'Low' | 'Medium' | 'High';

export interface UserAnswers {
  location: 'Skin' | 'Eye';
  duration: string;
  symptoms: string[];
  progression: string[];
}

export interface Recommendation {
  action: string;
  riskLevel: RiskLevel;
  urgency: Urgency;
  reason: string;
  disclaimer: string;
  additionalTips: string[];
}

export const DURATION_OPTIONS = [
  'Less than one week',
  '1-4 weeks',
  'More than a month',
];

export const SYMPTOM_OPTIONS = [
  'Pain',
  'Itching',
  'Bleeding',
  'Swelling',
  'Fever or chills',
  'None of these',
];

export const PROGRESSION_OPTIONS = [
  'Change in size',
  'Change in shape',
  'Change in color',
  'Spreading to other areas',
  'No changes noticed',
];
