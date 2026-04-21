import React from 'react';

interface Props {
  message?: string;
  subMessage?: string;
}

const Loading: React.FC<Props> = ({
  message = 'Analyzing Your Responses',
  subMessage = 'Determining the appropriate care guidance for you…',
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 border-8 border-slate-100 rounded-full" />
      <div className="absolute inset-0 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">{message}</h3>
      <p className="text-slate-500 text-base">{subMessage}</p>
    </div>
    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
      This may take a moment. Please do not close or refresh the page.
    </p>
  </div>
);

export default Loading;
