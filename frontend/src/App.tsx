import React, { useState } from 'react';
import type { AppStep, UserAnswers, Recommendation } from './types';
import { analyzeImage, getRecommendation } from './services/api';
import Layout from './components/Layout';
import Landing from './steps/Landing';
import Consent from './steps/Consent';
import Upload from './steps/Upload';
import Questions from './steps/Questions';
import Loading from './steps/Loading';
import RecommendationStep from './steps/Recommendation';
import Education from './steps/Education';

const DEFAULT_ANSWERS: UserAnswers = {
  location: 'Skin',
  duration: '',
  symptoms: [],
  progression: [],
};

const STEP_SUBTITLES: Record<AppStep, string> = {
  landing: 'Care Guidance Tool',
  consent: 'Privacy & Consent',
  upload: 'Photo Upload',
  questions: 'Health Questions',
  loading: 'Analyzing…',
  recommendation: 'Your Guidance',
  education: 'Care Options Guide',
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [answers, setAnswers] = useState<UserAnswers>(DEFAULT_ANSWERS);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    setStep('questions');
  };

  const handleSubmitQuestions = async () => {
    setStep('loading');
    setError(null);
    try {
      if (imageFile) await analyzeImage(imageFile);
      const result = await getRecommendation(answers);
      setRecommendation(result);
      setStep('recommendation');
    } catch {
      setError('Something went wrong. Please check that the backend is running and try again.');
      setStep('questions');
    }
  };

  const reset = () => {
    setStep('landing');
    setImageFile(null);
    setAnswers(DEFAULT_ANSWERS);
    setRecommendation(null);
    setError(null);
  };

  return (
    <Layout subtitle={STEP_SUBTITLES[step]}>
      {step === 'landing' && (
        <Landing onStart={() => setStep('consent')} />
      )}
      {step === 'consent' && (
        <Consent onAgree={() => setStep('upload')} onBack={() => setStep('landing')} />
      )}
      {step === 'upload' && (
        <Upload
          onImageSelected={handleImageSelected}
          onSkip={() => setStep('questions')}
        />
      )}
      {step === 'questions' && (
        <Questions
          answers={answers}
          onChange={setAnswers}
          onSubmit={handleSubmitQuestions}
          error={error}
        />
      )}
      {step === 'loading' && <Loading />}
      {step === 'recommendation' && recommendation && (
        <RecommendationStep
          recommendation={recommendation}
          onLearnMore={() => setStep('education')}
          onReset={reset}
        />
      )}
      {step === 'education' && (
        <Education onBack={() => setStep('recommendation')} />
      )}
    </Layout>
  );
};

export default App;
