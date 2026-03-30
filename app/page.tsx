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
import { CompareSites } from '@/components/compare-sites';
import { CompareResults } from '@/components/compare-results';
import { quizQuestions } from '@/lib/quiz-questions';

export default function Home() {
  const [activeTab, setActiveTab] = useState('website');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [htmlResult, setHtmlResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [compareSite1Data, setCompareSite1Data] = useState(null);
  const [compareSite2Data, setCompareSite2Data] = useState(null);

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

  const handleCompareSites = async (url1: string, url2: string) => {
    setLoading(true);
    setCompareResult(null);
    setCompareSite1Data(null);
    setCompareSite2Data(null);

    try {
      const [response1, response2] = await Promise.all([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url1 }),
        }),
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url2 }),
        }),
      ]);

      if (!response1.ok || !response2.ok) {
        throw new Error('Failed to analyze one or both websites');
      }

      const data1 = await response1.json();
      const data2 = await response2.json();

      setCompareSite1Data({
        url: url1,
        riskScore: data1.overallRiskScore || 0,
        criticalCount: data1.findings?.filter((f: any) => f.severity === 'critical').length || 0,
        highCount: data1.findings?.filter((f: any) => f.severity === 'high').length || 0,
        mediumCount: data1.findings?.filter((f: any) => f.severity === 'medium').length || 0,
        lowCount: data1.findings?.filter((f: any) => f.severity === 'low').length || 0,
      });

      setCompareSite2Data({
        url: url2,
        riskScore: data2.overallRiskScore || 0,
        criticalCount: data2.findings?.filter((f: any) => f.severity === 'critical').length || 0,
        highCount: data2.findings?.filter((f: any) => f.severity === 'high').length || 0,
        mediumCount: data2.findings?.filter((f: any) => f.severity === 'medium').length || 0,
        lowCount: data2.findings?.filter((f: any) => f.severity === 'low').length || 0,
      });

      setCompareResult(true);
    } catch (error) {
      setCompareResult({
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

          {/* Compare Sites Tab */}
          {activeTab === 'compare' && (
            <div className="flex flex-col items-center">
              {!compareResult ? (
                <CompareSites onCompare={handleCompareSites} loading={loading} />
              ) : compareResult.error ? (
                <div className="w-full">
                  <button
                    onClick={() => setCompareResult(null)}
                    className="mb-6 px-4 py-2 text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    ← Compare Other Sites
                  </button>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-destructive">
                    <p className="font-semibold mb-2">Error</p>
                    <p>{compareResult.error}</p>
                  </div>
                </div>
              ) : compareSite1Data && compareSite2Data ? (
                <div className="w-full">
                  <button
                    onClick={() => setCompareResult(null)}
                    className="mb-6 px-4 py-2 text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    ← Compare Other Sites
                  </button>
                  <CompareResults site1={compareSite1Data} site2={compareSite2Data} />
                </div>
              ) : null}
            </div>
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
