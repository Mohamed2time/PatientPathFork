import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Non-diagnostic disclaimer banner — visible on every screen */}
      <div className="w-full max-w-xl mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-amber-800 text-sm font-medium leading-snug">
            <strong>Not a diagnosis.</strong> This tool helps you understand what type of care to seek.
            Always consult a licensed healthcare provider.
          </p>
        </div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 3.89 2.421 7.22 5.834 8.497L12 21l3.166-2.759C18.579 16.964 21 13.634 21 9.744c0-1.285-.203-2.52-.578-3.682A11.959 11.959 0 0112 2.714z"
                />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">HumanHealth</span>
              {subtitle && (
                <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 sm:p-8">{children}</main>

        {/* Footer */}
        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            University of Washington · Capstone Project · Non-Diagnostic Tool
          </p>
        </footer>
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center max-w-sm leading-relaxed">
        If you are experiencing a life-threatening emergency, call 911 or your local emergency services immediately.
      </p>
    </div>
  );
};

export default Layout;
