'use client';

import { QuizQuestion, QuizResults } from '@/types/security';
import { AlertCircle, Award, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface HackOrSafeQuizProps {
  questions: QuizQuestion[];
}

export function HackOrSafeQuiz({ questions }: HackOrSafeQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: boolean }>({});
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);

  const currentQuestion = questions[currentIndex];
  const answered = answers[currentQuestion.id] !== undefined;

  const handleAnswer = (isCorrect: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: isCorrect,
    }));
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const correctCount = Object.values(answers).filter(Boolean).length;
    const totalPoints = Object.entries(answers).reduce((sum, [qId, isCorrect]) => {
      const question = questions.find(q => q.id === qId);
      return sum + (isCorrect && question ? question.pointsReward : 0);
    }, 0);

    const difficultyBreakdown = questions.reduce((acc, q) => {
      if (answers[q.id] !== undefined) {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    setResults({
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      totalPoints,
      difficulty: Object.keys(difficultyBreakdown).some(d => difficultyBreakdown[d] > 0)
        ? 'medium'
        : 'easy',
      completedAt: new Date().toISOString(),
    });
    setCompleted(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setCompleted(false);
    setResults(null);
  };

  if (completed && results) {
    return (
      <div className="space-y-6 bg-background/50 border border-border rounded-lg p-6">
        <div className="text-center space-y-3">
          <Award className="w-16 h-16 text-accent mx-auto" />
          <h3 className="text-2xl font-bold text-foreground">Quiz Complete!</h3>
          <p className="text-muted-foreground">Here&apos;s how you did:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Score</p>
            <p className="text-3xl font-bold text-primary">
              {results.correctAnswers}/{results.totalQuestions}
            </p>
            <p className="text-sm text-foreground mt-2">
              {Math.round((results.correctAnswers / results.totalQuestions) * 100)}%
            </p>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Points Earned</p>
            <p className="text-3xl font-bold text-accent">{results.totalPoints}</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Level</p>
            <p className="text-2xl font-bold text-green-500">Security</p>
            <p className="text-sm text-green-500 mt-2">Expert 🎓</p>
          </div>
        </div>

        {results.correctAnswers === results.totalQuestions ? (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
            <p className="font-semibold text-green-500">Perfect Score! You&apos;re a Security Ninja! 🥷</p>
          </div>
        ) : results.correctAnswers >= results.totalQuestions * 0.7 ? (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p className="font-semibold text-primary">Great job! You know your security fundamentals.</p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
            <p className="font-semibold text-yellow-500">Good effort! Study the explanations to improve.</p>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Object.values(answers).filter(Boolean).length} correct
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-background/50 border border-border rounded-lg p-6 space-y-4">
        {/* Difficulty Badge */}
        <div>
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
            currentQuestion.difficulty === 'easy'
              ? 'bg-green-500/20 text-green-500'
              : currentQuestion.difficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'bg-destructive/20 text-destructive'
          }`}>
            {currentQuestion.difficulty} - {
              currentQuestion.difficulty === 'easy' ? '10 pts' :
              currentQuestion.difficulty === 'medium' ? '20 pts' : '30 pts'
            }
          </span>
        </div>

        {/* Question */}
        <div>
          <h3 className="text-xl font-bold text-foreground">Hack or Safe?</h3>
          <p className="text-foreground mt-3">{currentQuestion.scenario}</p>
          
          {currentQuestion.code && (
            <div className="mt-4 bg-secondary/50 rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Code:</p>
              <pre className="text-xs font-mono text-foreground overflow-x-auto">
                <code>{currentQuestion.code}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mt-6">
          {currentQuestion.options.map((option, idx) => {
            const optionId = `${currentQuestion.id}-${idx}`;
            const isSelected = answers[currentQuestion.id] === option.isCorrect;
            const showFeedback = showResult && isSelected;

            return (
              <button
                key={optionId}
                onClick={() => handleAnswer(option.isCorrect)}
                disabled={showResult}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  showFeedback
                    ? option.isCorrect
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-destructive/10 border-destructive'
                    : 'bg-secondary/30 border-border hover:border-primary/50'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${
                    showFeedback
                      ? option.isCorrect ? 'text-green-500' : 'text-destructive'
                      : 'text-muted-foreground'
                  }`}>
                    {showFeedback && option.isCorrect && <CheckCircle className="w-5 h-5" />}
                    {showFeedback && !option.isCorrect && <XCircle className="w-5 h-5" />}
                    {!showFeedback && <div className="w-5 h-5 rounded border border-border" />}
                  </div>
                  <span className="font-semibold text-foreground">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showResult && (
          <div className={`mt-6 p-4 rounded-lg border ${
            answers[currentQuestion.id]
              ? 'bg-green-500/10 border-green-500'
              : 'bg-destructive/10 border-destructive'
          }`}>
            <div className="flex gap-2 mb-2">
              {answers[currentQuestion.id] ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              )}
              <p className={`font-semibold ${
                answers[currentQuestion.id] ? 'text-green-500' : 'text-destructive'
              }`}>
                {answers[currentQuestion.id] ? 'Correct!' : 'Wrong answer'}
              </p>
            </div>

            <p className="text-sm text-foreground mb-3">{currentQuestion.explanation}</p>

            <div className="bg-background/50 p-2 rounded border border-border">
              <p className="text-xs font-semibold text-accent mb-1">Hacker Tip:</p>
              <p className="text-xs text-foreground">{currentQuestion.hackerTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {showResult && (
        <button
          onClick={handleNext}
          className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
        >
          {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
        </button>
      )}
    </div>
  );
}
