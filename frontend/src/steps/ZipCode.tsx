import React, { useState } from 'react';

interface Props {
  onContinue: (zip: string) => void;
  onBack: () => void;
}

const ZipCode: React.FC<Props> = ({ onContinue, onBack }) => {
  const [zip, setZip] = useState('');
  const isValid = /^\d{5}$/.test(zip);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue(zip.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Find Care Near You</h2>
        <p className="text-slate-500 text-sm">
          Enter your zip code so we can show nearby clinics with your recommendation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="zip" className="block text-sm font-semibold text-slate-700 mb-2">
            Zip Code
          </label>
          <input
            id="zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 98101"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
            className="w-full border-2 border-slate-200 focus:border-emerald-500 outline-none rounded-2xl px-4 py-4 text-slate-800 font-semibold text-lg transition-colors"
          />
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-sm"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => onContinue('')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-4 px-6 rounded-2xl transition-all"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default ZipCode;
