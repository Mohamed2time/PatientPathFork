import React from 'react';
import type { AnyRecommendation } from '../types';

interface Props {
  recommendation: AnyRecommendation;
  condition: string;
  onLearnMore: () => void;
  onReset: () => void;
}

const riskStyles: Record<string, { card: string; badge: string; dot: string }> = {
  Low: {
    card: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  Moderate: {
    card: 'bg-amber-50 border-amber-200 text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  Higher: {
    card: 'bg-rose-50 border-rose-200 text-rose-800',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
};

const severityStyles = {
  low: riskStyles.Low,
  moderate: riskStyles.Moderate,
  high: riskStyles.Higher,
} as const;

const Disclaimer: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-white/60 rounded-2xl p-4 flex items-start gap-3">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-70"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
    <p className="text-sm font-semibold italic leading-snug">{text}</p>
  </div>
);

const LearnMoreButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 hover:border-slate-200 rounded-2xl transition-all text-slate-700 font-bold"
  >
    <span>Understanding care options</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 text-slate-400"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  </button>
);

const ResetFooter: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="pt-4 border-t border-slate-100 text-center space-y-4">
    <p className="text-slate-400 text-sm leading-relaxed">
      If symptoms worsen rapidly — such as rapid spreading, severe pain, or difficulty breathing — seek emergency care immediately.
    </p>
    <button
      onClick={onReset}
      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md text-base"
    >
      Start New Assessment
    </button>
  </div>
);

const Recommendation: React.FC<Props> = ({ recommendation, condition, onLearnMore, onReset }) => {
  if (recommendation.kind === 'ai') {
    const styles = severityStyles[recommendation.severity] ?? severityStyles.low;
    const severityLabel =
      recommendation.severity.charAt(0).toUpperCase() + recommendation.severity.slice(1);

    return (
      <div className="space-y-6">
        <div className={`rounded-3xl p-6 border-2 ${styles.card}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest opacity-70">
              AI Care Guidance
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${styles.badge}`}>
              {severityLabel} · {recommendation.confidence}%
            </span>
          </div>

          {(condition || recommendation.category) && (
            <p className="text-xs font-semibold opacity-60 mb-2 uppercase tracking-wide">
              {condition}
              {recommendation.category && ` · ${recommendation.category}`}
            </p>
          )}

          <h2 className="text-2xl font-black mb-2 leading-tight">{recommendation.action}</h2>

          <p className="text-sm font-semibold opacity-80 mb-3">
            Suggested care level: <span className="capitalize">{recommendation.care_level}</span>
          </p>

          <p className="text-base font-medium leading-relaxed opacity-90 mb-4">
            {recommendation.reason}
          </p>

          {recommendation.image_note && (
            <p className="text-sm italic opacity-75 mb-4">
              Note on the photo: {recommendation.image_note}
            </p>
          )}

          <Disclaimer text={recommendation.disclaimer} />
        </div>

        {recommendation.additional_tips.length > 0 && (
          <div>
            <h4 className="text-base font-bold text-slate-800 mb-3">Suggested Next Steps</h4>
            <div className="space-y-2">
              {recommendation.additional_tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${styles.dot}`} />
                  <span className="text-slate-700 text-sm font-medium leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendation.follow_up_questions.length > 0 && (
          <div>
            <h4 className="text-base font-bold text-slate-800 mb-3">
              Questions to ask your provider
            </h4>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-slate-700 leading-relaxed">
              {recommendation.follow_up_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        <LearnMoreButton onClick={onLearnMore} />
        <ResetFooter onReset={onReset} />
      </div>
    );
  }

  const styles = riskStyles[recommendation.riskLevel] ?? riskStyles.Low;

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl p-6 border-2 ${styles.card}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-widest opacity-70">
            Care Guidance
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${styles.badge}`}>
            {recommendation.riskLevel} Concern
          </span>
        </div>

        {condition && (
          <p className="text-xs font-semibold opacity-60 mb-2 uppercase tracking-wide">
            {condition}
          </p>
        )}
        <h2 className="text-2xl font-black mb-3 leading-tight">{recommendation.action}</h2>
        <p className="text-base font-medium leading-relaxed opacity-90 mb-5">
          {recommendation.reason}
        </p>

        <Disclaimer text={recommendation.disclaimer} />
      </div>

      <div>
        <h4 className="text-base font-bold text-slate-800 mb-3">Suggested Next Steps</h4>
        <div className="space-y-2">
          {recommendation.additionalTips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${styles.dot}`} />
              <span className="text-slate-700 text-sm font-medium leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <LearnMoreButton onClick={onLearnMore} />
      <ResetFooter onReset={onReset} />
    </div>
  );
};

export default Recommendation;
