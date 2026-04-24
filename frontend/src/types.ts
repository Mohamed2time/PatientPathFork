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
  severity: 'low' | 'moderate' | 'high';
  care_level: 'self-care' | 'primary care' | 'urgent care' | 'emergency';
  action: string;
  reason: string;
  additional_tips: string[];
  image_note?: string | null;
  follow_up_questions: string[];
  disclaimer: string;
}

export type AnyRecommendation =
  | ({ kind: 'rule' } & Recommendation)
  | ({ kind: 'ai' } & AIRecommendation);

export const CONDITION_OPTIONS: { label: string; icon: string }[] = [
  { label: 'Rash or irritated skin', icon: '🔴' },
  { label: 'Mole or unusual growth', icon: '🔵' },
  { label: "Wound that won't heal", icon: '🩹' },
  { label: 'Swelling or lump', icon: '🟡' },
  { label: 'Eye redness or discharge', icon: '👁️' },
  { label: 'Bruising or discoloration', icon: '🟣' },
  { label: 'Dry or flaking skin', icon: '🌿' },
  { label: 'Insect bite or sting', icon: '🐛' },
];
