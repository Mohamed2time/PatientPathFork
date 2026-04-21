import React from 'react';
import { CONDITION_OPTIONS } from '../types';

interface Props {
  onSelect: (condition: string) => void;
  onBack: () => void;
}

const ConditionSelection: React.FC<Props> = ({ onSelect, onBack }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">What's your concern?</h2>
      <p className="text-slate-500 text-sm">
        Select the option that best describes what you're seeing.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {CONDITION_OPTIONS.map(({ label, icon }) => (
        <button
          key={label}
          onClick={() => onSelect(label)}
          className="flex flex-col items-start gap-2 p-4 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-400 active:border-emerald-500 rounded-2xl transition-all text-left"
        >
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-semibold text-slate-700 leading-snug">{label}</span>
        </button>
      ))}
    </div>

    <button
      onClick={onBack}
      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-4 px-6 rounded-2xl transition-all"
    >
      Back
    </button>
  </div>
);

export default ConditionSelection;
