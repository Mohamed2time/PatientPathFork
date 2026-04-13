import React from 'react';

interface Props {
  onBack: () => void;
}

const Education: React.FC<Props> = ({ onBack }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Understanding Care Options</h2>
      <p className="text-slate-500 text-sm">
        Knowing where to go helps you get the right care faster.
      </p>
    </div>

    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏠</span>
          <h3 className="font-bold text-slate-800">Self-Care at Home</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Suitable for minor, stable concerns with no alarming symptoms. Keep the area clean,
          monitor for changes, and avoid irritating it. See a doctor if it does not resolve in
          one to two weeks.
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🩺</span>
          <h3 className="font-bold text-emerald-800">Primary Care</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Your family doctor or general practitioner handles stable, non-emergency concerns.
          They know your medical history, can order tests, and refer you to a specialist
          if needed.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⚡</span>
          <h3 className="font-bold text-amber-800">Urgent Care</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Best for concerns that need attention within 24 hours but are not life-threatening.
          Useful for rapid symptom changes, pain, or when your primary doctor is unavailable
          on weekends or evenings.
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔬</span>
          <h3 className="font-bold text-indigo-800">Specialist Visit</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Dermatologists focus on skin conditions while ophthalmologists specialize in eye
          health. A specialist is recommended when a concern requires expert tools,
          diagnostic procedures, or is outside the scope of general care.
        </p>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🚨</span>
          <h3 className="font-bold text-rose-800">Emergency Room</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Call 911 or go to the nearest ER for life-threatening situations: difficulty breathing,
          uncontrolled bleeding, sudden vision loss, severe allergic reaction, or any symptom
          that is rapidly worsening.
        </p>
      </div>
    </div>

    <button
      onClick={onBack}
      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl transition-all"
    >
      Back to Recommendation
    </button>
  </div>
);

export default Education;
