import React from 'react';
import type { Question, DynamicAnswers } from '../types';

interface Props {
  condition: string;
  questions: Question[];
  answers: DynamicAnswers;
  onChange: (answers: DynamicAnswers) => void;
  onSubmit: () => void;
  error: string | null;
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const Questions: React.FC<Props> = ({ condition, questions, answers, onChange, onSubmit, error }) => {
  const setSingle = (id: string, value: string) => {
    onChange({ ...answers, [id]: value });
  };

  const EXCLUSIVE_OPTIONS = new Set(['None of these', 'Neither', 'No changes noticed']);

  const toggleMulti = (id: string, value: string) => {
    const current = (answers[id] as string[] | undefined) ?? [];
    let updated: string[];
    if (EXCLUSIVE_OPTIONS.has(value)) {
      updated = current.includes(value) ? [] : [value];
    } else {
      const withoutExclusive = current.filter((v) => !EXCLUSIVE_OPTIONS.has(v));
      updated = withoutExclusive.includes(value)
        ? withoutExclusive.filter((v) => v !== value)
        : [...withoutExclusive, value];
    }
    onChange({ ...answers, [id]: updated });
  };

  const canSubmit = questions
    .filter((q) => q.type === 'single')
    .every((q) => {
      const ans = answers[q.id];
      return typeof ans === 'string' && ans !== '';
    });

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-500 text-sm">Loading questions…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Tell us about your concern</h2>
        {condition && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            {condition}
          </div>
        )}
      </div>

      {questions.map((q) => {
        if (q.type === 'single') {
          const selected = (answers[q.id] as string | undefined) ?? '';
          return (
            <section key={q.id}>
              <p className="text-base font-bold text-slate-800 mb-3">{q.text}</p>
              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSingle(q.id, opt)}
                    className={`w-full text-left py-4 px-5 rounded-2xl border-2 font-medium text-base transition-all flex items-center justify-between ${
                      selected === opt
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    {selected === opt && (
                      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckIcon />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          );
        }

        // multi
        const selected = (answers[q.id] as string[] | undefined) ?? [];
        return (
          <section key={q.id}>
            <p className="text-base font-bold text-slate-800 mb-1">{q.text}</p>
            <p className="text-slate-400 text-sm mb-3">Select all that apply.</p>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleMulti(q.id, opt)}
                    className={`w-full text-left py-4 px-5 rounded-2xl border-2 font-medium text-base transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckIcon />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

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
