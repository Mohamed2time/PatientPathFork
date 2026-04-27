import React, { useState } from 'react';

interface Props {
  selectedCondition: string;
  onImageSelected: (file: File) => void;
  onSkip: () => void;
  onBack: () => void;
}

const Upload: React.FC<Props> = ({ selectedCondition, onImageSelected, onSkip, onBack }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onImageSelected(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Upload a Photo</h2>
        <p className="text-slate-500 text-sm">
          Take or select a clear, close-up photo of the concern. Centering it helps.
        </p>
      </div>

      {selectedCondition && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          {selectedCondition}
        </div>
      )}

      <label className="block relative border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-3xl overflow-hidden cursor-pointer transition-colors bg-slate-50 min-h-[260px] flex items-center justify-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-3xl"
          />
        ) : (
          <div className="flex flex-col items-center text-center p-8 z-0">
            <div className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-emerald-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
            </div>
            <p className="font-bold text-slate-700 text-base">Tap to take or choose photo</p>
            <p className="text-slate-400 text-sm mt-1">Center the concern inside the guide above</p>
          </div>
        )}
      </label>

      <button
        onClick={onSkip}
        className="w-full text-slate-500 hover:text-emerald-600 font-medium transition-colors py-2 text-sm"
      >
        Continue without a photo
      </button>

      <button
        onClick={onBack}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-4 px-6 rounded-2xl transition-all"
      >
        Back
      </button>
    </div>
  );
};

export default Upload;
