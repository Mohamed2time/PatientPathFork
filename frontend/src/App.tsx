import React, { useState } from 'react';
import type { AppStep, Question, DynamicAnswers, Recommendation } from './types';
import { analyzeImage, getRecommendation } from './services/api';
import Layout from './components/Layout';
import Landing from './steps/Landing';
import Consent from './steps/Consent';
import ConditionSelection from './steps/ConditionSelection';
import Upload from './steps/Upload';
import Questions from './steps/Questions';
import Loading from './steps/Loading';
import RecommendationStep from './steps/Recommendation';
import Education from './steps/Education';

const STEP_SUBTITLES: Record<AppStep, string> = {
  landing: 'Care Guidance Tool',
  consent: 'Privacy & Consent',
  conditionSelection: 'Select Your Concern',
  upload: 'Photo Upload',
  questions: 'Health Questions',
  loading: 'Please Wait…',
  recommendation: 'Your Guidance',
  education: 'Care Options Guide',
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [loadingSubMessage, setLoadingSubMessage] = useState<string | undefined>(undefined);

  const handleConditionSelected = (condition: string) => {
    setSelectedCondition(condition);
    setAnswers({});
    setQuestions([]);
    setStep('upload');
  };

  const fetchQuestionsAndProceed = async (file: File | null) => {
    setLoadingMessage('Loading Your Questions');
    setLoadingSubMessage('Tailoring questions to your selected concern…');
    setStep('loading');
    setError(null);
    try {
      const qs = await analyzeImage(selectedCondition, file);
      setQuestions(qs);
      setAnswers({});
      setStep('questions');
    } catch {
      setError('Could not load questions. Please check your connection and try again.');
      setStep('upload');
    }
  };

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    fetchQuestionsAndProceed(file);
  };

  const handleSkip = () => {
    setImageFile(null);
    fetchQuestionsAndProceed(null);
  };

  const handleSubmitQuestions = async () => {
    setLoadingMessage(undefined);
    setLoadingSubMessage(undefined);
    setStep('loading');
    setError(null);
    try {
      const result = await getRecommendation(selectedCondition, answers);
      setRecommendation(result);
      setStep('recommendation');
    } catch {
      setError('Something went wrong. Please check that the backend is running and try again.');
      setStep('questions');
    }
  };

  const reset = () => {
    setStep('landing');
    setSelectedCondition('');
    setImageFile(null);
    setQuestions([]);
    setAnswers({});
    setRecommendation(null);
    setError(null);
    setLoadingMessage(undefined);
    setLoadingSubMessage(undefined);
  };

  return (
    <Layout subtitle={STEP_SUBTITLES[step]}>
      {step === 'landing' && (
        <Landing onStart={() => setStep('consent')} />
      )}
      {step === 'consent' && (
        <Consent onAgree={() => setStep('conditionSelection')} onBack={() => setStep('landing')} />
      )}
      {step === 'conditionSelection' && (
        <ConditionSelection
          onSelect={handleConditionSelected}
          onBack={() => setStep('consent')}
        />
      )}
      {step === 'upload' && (
        <Upload
          selectedCondition={selectedCondition}
          onImageSelected={handleImageSelected}
          onSkip={handleSkip}
        />
      )}
      {step === 'questions' && (
        <Questions
          condition={selectedCondition}
          questions={questions}
          answers={answers}
          onChange={setAnswers}
          onSubmit={handleSubmitQuestions}
          error={error}
        />
      )}
      {step === 'loading' && (
        <Loading message={loadingMessage} subMessage={loadingSubMessage} />
      )}
      {step === 'recommendation' && recommendation && (
        <RecommendationStep
          recommendation={recommendation}
          condition={selectedCondition}
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
