'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { AnalysisForm } from '@/components/analysis-form';
import { AnalysisResult } from '@/components/analysis-result';
import { LoadingState } from '@/components/loading-state';
import { TabsNavigation } from '@/components/tabs-navigation';
import { InteractiveDemo } from '@/components/interactive-demo';
import { LiveUrlDemo } from '@/components/live-url-demo';
import SimulateAttack from '@/components/ai-simulation/simulate-attack';
import DotBackgroundDemo from '@/components/dot-background-demo';
import { GlobalIntelligencePanel } from '@/components/global-intelligence-panel';

export default function Home() {
  const [activeTab, setActiveTab] = useState('website');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [liveDemoFindings, setLiveDemoFindings] = useState<any[]>([]);

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

  return (
    <DotBackgroundDemo className="overflow-x-hidden">
      <div className="w-screen min-h-screen">
        <Header />
        <main className="flex min-h-screen w-full flex-col py-8">
          {/* Tabs Navigation */}
          <div className="w-full px-4 md:px-8 lg:px-12">
            <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="mt-4 w-full px-4 md:px-8 lg:px-12">
            <GlobalIntelligencePanel />
          </div>

          {/* Tab Content */}
          <div className="mt-8 w-full px-4 md:px-8 lg:px-12">
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

            {/* Live Hacking Demo Tab */}
            {activeTab === 'live-demo' && (
              <div className="flex w-full flex-col">
                <LiveUrlDemo
                  url={liveDemoUrl}
                  findings={liveDemoFindings}
                  onAnalyze={(url) => {
                    setLiveDemoUrl(url);
                    handleAnalyzeWebsite(url).then(() => {
                      // After analysis, populate findings for live demo
                      if (result?.findings) {
                        setLiveDemoFindings(result.findings);
                      }
                    });
                  }}
                />
              </div>
            )}

            {/* Interactive Demo Tab */}
            {activeTab === 'interactive' && (
              <div className="flex w-full flex-col">
                <InteractiveDemo />
              </div>
            )}

            {/* Simulate Attack Tab */}
            {activeTab === 'simulate' && (
              <div className="flex w-full flex-col">
                <SimulateAttack />
              </div>
            )}
          </div>
        </main>
      </div>
    </DotBackgroundDemo>
  );
}
