'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { AnalysisForm } from '@/components/analysis-form';
import { AnalysisResult } from '@/components/analysis-result';
import { LoadingState } from '@/components/loading-state';
import { TabsNavigation } from '@/components/tabs-navigation';
import { HtmlUpload } from '@/components/html-upload';
import { HackOrSafeQuiz } from '@/components/hack-or-safe-quiz';
import { LearnSecurity } from '@/components/learn-security';
import { quizQuestions } from '@/lib/quiz-questions';

export default function Home() {
  const [activeTab, setActiveTab] = useState('website');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [htmlResult, setHtmlResult] = useState(null);

  const handleAnalyzeWebsite = async (inputUrl: string) => {
    setUrl(inputUrl);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeHtml = async (htmlContent: string, fileName: string) => {
    setLoading(true);
    setHtmlResult(null);

    try {
      const response = await fetch('/api/analyze-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent, fileName }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze HTML');
      }

      const data = await response.json();
      setHtmlResult(data);
    } catch (error) {
      setHtmlResult({
        error: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-col items-center px-4 py-8">
        {/* Tabs Navigation */}
        <div className="w-full max-w-4xl">
          <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="w-full max-w-4xl mt-8">
          {/* Analyze Website Tab */}
          {activeTab === 'website' && (
            <>
              {!result ? (
                <>
                  {!loading && <Hero />}
                  <div className="w-full mt-8">
                    <AnalysisForm onAnalyze={handleAnalyzeWebsite} disabled={loading} />
                  </div>
                  {loading && <LoadingState />}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setResult(null)}
                    className="mb-6 px-4 py-2 text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    ← Analyze Another Site
                  </button>
                  <AnalysisResult result={result} url={url} />
                </>
              )}
            </>
          )}

          {/* Upload HTML Tab */}
          {activeTab === 'html' && (
            <div className="flex flex-col items-center">
              {!htmlResult ? (
                <HtmlUpload onAnalyze={handleAnalyzeHtml} disabled={loading} />
              ) : (
                <>
                  <button
                    onClick={() => setHtmlResult(null)}
                    className="mb-6 px-4 py-2 text-sm font-medium text-primary hover:text-accent transition-colors self-start"
                  >
                    ← Upload Another File
                  </button>
                  <AnalysisResult result={htmlResult} url={htmlResult?.fileName || 'HTML File'} />
                </>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="flex flex-col items-center">
              <div className="w-full bg-background/50 border border-border rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Hack or Safe?</h2>
                <p className="text-muted-foreground">
                  Test your security knowledge. Decide if each scenario is safe or vulnerable.
                </p>
              </div>
              <HackOrSafeQuiz questions={quizQuestions} />
            </div>
          )}

          {/* Learn Security Tab */}
          {activeTab === 'learn' && <LearnSecurity />}
        </div>
      </main>
    </div>
  );
}
