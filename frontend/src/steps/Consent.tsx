import React from 'react';

interface Props {
  onAgree: () => void;
  onBack: () => void;
}

const Consent: React.FC<Props> = ({ onAgree, onBack }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Privacy &amp; Consent</h2>
      <p className="text-slate-500 text-sm">Please read before continuing.</p>
    </div>

    <div className="space-y-4">
      {[
        {
          icon: '📷',
          title: 'Photo Handling',
          body: 'If you upload a photo, it is sent securely to our server only to generate your recommendation. It is not stored, shared, or analyzed by a human.',
        },
        {
          icon: '🚫',
          title: 'No Permanent Storage',
          body: 'Images are discarded immediately after your recommendation is generated. No identifiable data is retained.',
        },
        {
          icon: '⚕️',
          title: 'Not a Medical Diagnosis',
          body: 'HumanHealth is an informational triage tool only. It does not diagnose conditions and does not replace a licensed healthcare provider.',
        },
        {
          icon: '🎓',
          title: 'Academic Project',
          body: 'This tool was built as a University of Washington capstone project for educational purposes.',
        },
      ].map((item) => (
        <div key={item.title} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
          <span className="text-2xl flex-shrink-0">{item.icon}</span>
          <div>
            <p className="font-semibold text-slate-800 text-sm mb-1">{item.title}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{item.body}</p>
          </div>
        </div>
      ))}
    </div>

    <p className="text-slate-600 text-sm leading-relaxed">
      By clicking <strong>"I Agree &amp; Continue"</strong>, you consent to these terms and understand
      this tool provides guidance only, not diagnosis.
    </p>

    <div className="space-y-3 pt-2">
      <button
        onClick={onAgree}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-sm"
      >
        I Agree &amp; Continue
      </button>
      <button
        onClick={onBack}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-4 px-6 rounded-2xl transition-all"
      >
        Cancel
      </button>
    </div>
  </div>
);

export default Consent;
