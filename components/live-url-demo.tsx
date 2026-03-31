'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { VulnerabilitySimulator } from './vulnerability-simulator';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface Finding {
  id: string;
  title: string;
  severity: string;
  category?: string;
}

interface LiveUrlDemoProps {
  url?: string;
  findings?: Finding[];
  onAnalyze?: (url: string) => void;
}

interface SimulationData {
  vulnerabilityId: string;
  vulnerabilityType: string;
  demonstration: {
    title: string;
    scenario: string;
    steps: Array<{
      stepNumber: number;
      action: string;
      payload?: string;
      result: string;
      impact: string;
    }>;
  };
  attackPlayground: {
    formFields: Array<{
      name: string;
      type: string;
      placeholder: string;
      vulnerable: boolean;
    }>;
    testPayloads: Array<{
      name: string;
      payload: string;
      description: string;
    }>;
  };
  visualization: {
    before: string;
    after: string;
    attackSurface: string;
  };
}

export function LiveUrlDemo({ url, findings = [], onAnalyze }: LiveUrlDemoProps) {
  const [inputUrl, setInputUrl] = useState(url || '');
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSimulation = async (findingId: string) => {
    if (!inputUrl) {
      setError('Please enter a URL first');
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedFinding(findingId);

    try {
      const response = await fetch('/api/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerabilityId: findingId,
          url: inputUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load simulation');
      }

      const data = await response.json();
      setSimulation(data.simulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load simulation');
      setSelectedFinding(null);
    } finally {
      setLoading(false);
    }
  };

  if (simulation) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSimulation(null);
            setSelectedFinding(null);
          }}
          className="text-primary hover:text-accent transition-colors flex items-center gap-2"
        >
          ← Back to Findings
        </button>

        <VulnerabilitySimulator
          vulnerabilityType={simulation.vulnerabilityType}
          scenario={simulation.demonstration.scenario}
          steps={simulation.demonstration.steps}
          attackPlayground={simulation.attackPlayground}
          visualization={simulation.visualization}
          url={inputUrl}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card className="bg-card border border-border p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Live Hacking Demo</h2>
        <p className="text-muted-foreground mb-6">
          Enter a website URL to see interactive demonstrations of how each vulnerability could be exploited.
        </p>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && onAnalyze) {
                  onAnalyze(inputUrl);
                }
              }}
            />
            {onAnalyze && (
              <button
                onClick={() => onAnalyze(inputUrl)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Analyze
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* Vulnerabilities List */}
      {findings.length > 0 && (
        <Card className="bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Available Attack Demos</h3>
          <div className="space-y-2">
            {findings.map((finding) => (
              <button
                key={finding.id}
                onClick={() => handleLoadSimulation(finding.id)}
                disabled={loading && selectedFinding === finding.id}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedFinding === finding.id && loading
                    ? 'bg-primary/20 border-primary'
                    : 'bg-background/50 border-border hover:border-primary hover:bg-background/80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{finding.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{finding.category || 'Security'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      finding.severity === 'critical'
                        ? 'bg-destructive/20 text-destructive'
                        : finding.severity === 'high'
                        ? 'bg-red-900/20 text-red-400'
                        : finding.severity === 'medium'
                        ? 'bg-yellow-900/20 text-yellow-400'
                        : 'bg-blue-900/20 text-blue-400'
                    }`}>
                      {finding.severity}
                    </span>
                    {selectedFinding === finding.id && loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {findings.length === 0 && inputUrl && (
        <Card className="bg-background/50 border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No vulnerabilities found to demonstrate. Analyze a website first to see available attack scenarios.
          </p>
        </Card>
      )}

      {!inputUrl && (
        <Card className="bg-background/50 border border-border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Enter a URL above to get started with live hacking demonstrations.</p>
        </Card>
      )}
    </div>
  );
}
