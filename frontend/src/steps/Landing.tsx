import React from 'react';

interface Props {
  onStart: () => void;
}

const Landing: React.FC<Props> = ({ onStart }) => (
  <div className="text-center space-y-6">
    <div className="flex justify-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-10 h-10 text-emerald-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
          />
        </svg>
      </div>
    </div>

    <div>
      <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-3">
        Unsure what to do about a visible health concern?
      </h2>
      <p className="text-slate-500 text-base leading-relaxed max-w-sm mx-auto">
        HumanHealth helps you understand what type of care to seek — whether that's
        monitoring at home, seeing a doctor, or visiting urgent care.
      </p>
    </div>

    <div className="grid grid-cols-3 gap-3 text-center text-sm">
      {[
        { icon: '🔒', label: 'Private', sub: 'Images not stored' },
        { icon: '⚡', label: 'Fast', sub: '2-minute check' },
        { icon: '🩺', label: 'Guided', sub: 'Clear next steps' },
      ].map((item) => (
        <div key={item.label} className="bg-slate-50 rounded-2xl p-3">
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className="font-semibold text-slate-700">{item.label}</div>
          <div className="text-slate-400 text-xs">{item.sub}</div>
        </div>
      ))}
    </div>

    <button
      onClick={onStart}
      className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md text-lg"
    >
      Start Assessment
    </button>

    <p className="text-xs text-slate-400 leading-relaxed">
      This tool does not provide medical diagnoses. For emergencies, call 911.
    </p>
  </div>
);

export default Landing;
