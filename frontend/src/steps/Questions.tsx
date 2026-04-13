import React from 'react';
import type { UserAnswers } from '../types';
import { DURATION_OPTIONS, SYMPTOM_OPTIONS, PROGRESSION_OPTIONS } from '../types';

interface Props {
  answers: UserAnswers;
  onChange: (answers: UserAnswers) => void;
  onSubmit: () => void;
  error: string | null;
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const Questions: React.FC<Props> = ({ answers, onChange, onSubmit, error }) => {
  const toggleMulti = (field: 'symptoms' | 'progression', value: string) => {
    const current = answers[field];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...answers, [field]: updated });
  };

  const canSubmit = answers.duration !== '';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Tell us about your concern</h2>
        <p className="text-slate-500 text-sm">Answer all questions for the most accurate guidance.</p>
      </div>

      {/* Location — single select */}
      <section>
        <p className="text-base font-bold text-slate-800 mb-3">Where is the concern located?</p>
        <div className="grid grid-cols-2 gap-3">
          {(['Skin', 'Eye'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => onChange({ ...answers, location: loc })}
              className={`py-4 px-4 rounded-2xl border-2 font-bold text-base transition-all ${
                answers.location === loc
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </section>

      {/* Duration — single select */}
      <section>
        <p className="text-base font-bold text-slate-800 mb-3">How long has this been present?</p>
        <div className="grid grid-cols-1 gap-3">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...answers, duration: opt })}
              className={`w-full text-left py-4 px-5 rounded-2xl border-2 font-medium text-base transition-all flex items-center justify-between ${
                answers.duration === opt
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{opt}</span>
              {answers.duration === opt && (
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckIcon />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Symptoms — multi-select */}
      <section>
        <p className="text-base font-bold text-slate-800 mb-1">Are you experiencing any of these?</p>
        <p className="text-slate-400 text-sm mb-3">Select all that apply.</p>
        <div className="grid grid-cols-1 gap-3">
          {SYMPTOM_OPTIONS.map((opt) => {
            const selected = answers.symptoms.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleMulti('symptoms', opt)}
                className={`w-full text-left py-4 px-5 rounded-2xl border-2 font-medium text-base transition-all flex items-center justify-between ${
                  selected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>{opt}</span>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    selected ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                  }`}
                >
                  {selected && <CheckIcon />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Progression — multi-select */}
      <section>
        <p className="text-base font-bold text-slate-800 mb-1">Have you noticed any changes?</p>
        <p className="text-slate-400 text-sm mb-3">Select all that apply.</p>
        <div className="grid grid-cols-1 gap-3">
          {PROGRESSION_OPTIONS.map((opt) => {
            const selected = answers.progression.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleMulti('progression', opt)}
                className={`w-full text-left py-4 px-5 rounded-2xl border-2 font-medium text-base transition-all flex items-center justify-between ${
                  selected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>{opt}</span>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    selected ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                  }`}
                >
                  {selected && <CheckIcon />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="text-rose-600 text-sm font-medium bg-rose-50 p-3 rounded-xl">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md text-lg"
      >
        View Recommendation
      </button>
    </div>
  );
};

export default Questions;
