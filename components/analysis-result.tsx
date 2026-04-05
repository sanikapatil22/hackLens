'use client';

import { useEffect, useState } from 'react';
import { SecurityFinding as SecurityFindingType } from '@/types/security';
import { SecurityFinding } from './security-finding';
import { LiveUrlDemo } from './live-url-demo';
import { Card } from '@/components/ui/card';
import { buildSecurityExplanation, type SecurityExplainer } from './security-explainer';
import { getUserStats } from '@/lib/ai/user-tracking';

interface AnalysisResultProps {
  result: any;
  url: string;
}

type UserProfilePayload = {
  stats?: {
    weakAreas?: string[];
  } | null;
};

type GeneratedReport = {
  summary: string;
  vulnerabilities: Array<{
    title: string;
    severity: string;
    priority: 'High' | 'Medium' | 'Low';
    risk: string;
    fix: string;
  }>;
  recommendations: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  hacking: 'Security (Hacking)',
  performance: 'Performance',
  compliance: 'Compliance & Privacy',
  seo: 'SEO & Discoverability',
  accessibility: 'Accessibility',
  general: 'General',
};

const CATEGORY_COLORS: Record<string, string> = {
  hacking: 'bg-red-900/20 text-red-400',
  performance: 'bg-orange-900/20 text-orange-400',
  compliance: 'bg-purple-900/20 text-purple-400',
  seo: 'bg-blue-900/20 text-blue-400',
  accessibility: 'bg-cyan-900/20 text-cyan-400',
  general: 'bg-gray-900/20 text-gray-400',
};

function getOrCreateLocalUserId(): string {
  const existing = window.localStorage.getItem('hacklens_user_id');
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem('hacklens_user_id', created);
  return created;
}

function normalizeTopic(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '_');
}

function isFocusWeakAreaMatch(finding: SecurityFindingType, weakAreas: string[]): boolean {
  if (weakAreas.length === 0) {
    return false;
  }

  const text = [
    finding.title,
    finding.observed,
    finding.impact,
    finding.riskType ?? '',
    finding.type ?? '',
    finding.category,
  ]
    .join(' ')
    .toLowerCase();

  const checks = weakAreas.map(normalizeTopic);

  return checks.some((topic) => {
    if (topic === 'input_validation') {
      return (
        text.includes('input') ||
        text.includes('inject') ||
        text.includes('xss') ||
        text.includes('sql') ||
        text.includes('command')
      );
    }

    if (topic === 'phishing' || topic === 'impersonation' || topic === 'smishing') {
      return text.includes('social') || text.includes('phish') || text.includes('imperson');
    }

    if (topic === 'malware') {
      return text.includes('malware') || text.includes('payload') || text.includes('rce');
    }

    return text.includes(topic.replace(/_/g, ' ')) || text.includes(topic);
  });
}

export function AnalysisResult({ result, url }: AnalysisResultProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLiveDemo, setShowLiveDemo] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [explanationsById, setExplanationsById] = useState<Record<string, SecurityExplainer>>({});
  const [userWeakAreas, setUserWeakAreas] = useState<string[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);

  const handleTryLiveDemo = (findingId: string, _url: string) => {
    setSelectedFinding(findingId);
    setShowLiveDemo(true);
  };

  if (result.error) {
    return (
      <Card className="bg-card border border-border p-8">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Oops! Something went wrong
          </p>
          <p className="text-muted-foreground">{result.error}</p>
          <p className="text-sm text-muted-foreground mt-4">
            This might happen if the website is unreachable or blocked from analysis.
          </p>
        </div>
      </Card>
    );
  }

  const findings: SecurityFindingType[] = result.findings || [];
  const riskScore = result.overallRiskScore || 0;
  const explainerMode = 'ai' as const;
  const filteredFindings = selectedCategory
    ? findings.filter((f) => f.category === selectedCategory)
    : findings;

  const prioritizedFindings = [...filteredFindings].sort((a, b) => {
    const aFocus = isFocusWeakAreaMatch(a, userWeakAreas) ? 1 : 0;
    const bFocus = isFocusWeakAreaMatch(b, userWeakAreas) ? 1 : 0;
    return bFocus - aFocus;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadExplanations() {
      if (findings.length === 0) {
        setExplanationsById({});
        return;
      }

      const entries = await Promise.all(
        findings.map(async (finding) => {
          const explanation = await buildSecurityExplanation(finding, explainerMode);
          return [finding.id, explanation] as const;
        })
      );

      if (!cancelled) {
        setExplanationsById(Object.fromEntries(entries));
      }
    }

    void loadExplanations();

    return () => {
      cancelled = true;
    };
  }, [findings]);

  useEffect(() => {
    let cancelled = false;

    async function loadUserWeakAreas() {
      try {
        const userId = getOrCreateLocalUserId();
        const response = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error('profile-unavailable');
        }

        const payload = (await response.json()) as UserProfilePayload;
        const weakAreas = payload.stats?.weakAreas ?? [];
        if (!cancelled) {
          setUserWeakAreas(Array.isArray(weakAreas) ? weakAreas : []);
        }
      } catch {
        const fallbackWeakAreas = getUserStats().weakAreas;
        if (!cancelled) {
          setUserWeakAreas(fallbackWeakAreas);
        }
      }
    }

    void loadUserWeakAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-destructive';
    if (score >= 50) return 'text-accent';
    if (score >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vulnerabilities: findings,
          explanations: explanationsById,
          userProfile: {
            weak_areas: userWeakAreas,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('report-generation-failed');
      }

      const generated = (await response.json()) as GeneratedReport;
      setReport(generated);
    } catch {
      setReportError('Unable to generate report right now. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  // If live demo is open, show it
  if (showLiveDemo) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowLiveDemo(false)}
          className="text-primary hover:text-accent transition-colors flex items-center gap-2"
        >
          ← Back to Analysis
        </button>
        <LiveUrlDemo url={url} findings={findings} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border p-6">
        <h2 className="text-2xl font-bold mb-4">Security Analysis Report</h2>
        <p className="text-muted-foreground mb-6">
          {url.startsWith('http') ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent"
            >
              {url}
            </a>
          ) : (
            <span>{url}</span>
          )}
        </p>

        {/* Risk Score and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Overall Risk Score</p>
            <p className={`text-3xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}%</p>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Findings</p>
            <p className="text-3xl font-bold text-primary">{findings.length}</p>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Severity Breakdown</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {findings.filter((f) => f.severity === 'critical').length > 0 && (
                <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded font-semibold">
                  Critical: {findings.filter((f) => f.severity === 'critical').length}
                </span>
              )}
              {findings.filter((f) => f.severity === 'high').length > 0 && (
                <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-semibold">
                  High: {findings.filter((f) => f.severity === 'high').length}
                </span>
              )}
              {findings.filter((f) => f.severity === 'medium').length > 0 && (
                <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 text-xs rounded font-semibold">
                  Medium: {findings.filter((f) => f.severity === 'medium').length}
                </span>
              )}
              {findings.filter((f) => f.severity === 'low').length > 0 && (
                <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded font-semibold">
                  Low: {findings.filter((f) => f.severity === 'low').length}
                </span>
              )}
            </div>
          </div>
        </div>

        {findings.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
            >
              {reportLoading ? 'Generating Report...' : '📄 Generate Report'}
            </button>

            {report && (
              <button
                onClick={() => window.print()}
                className="rounded-md border border-border/60 bg-secondary/20 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
              >
                🖨️ Print / Export
              </button>
            )}
          </div>
        )}

        {reportError && (
          <p className="mt-3 text-sm text-destructive">{reportError}</p>
        )}
      </Card>

      {report && (
        <Card className="bg-card border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Generated Security Report</h3>
          <p className="text-sm text-muted-foreground">{report.summary}</p>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Vulnerabilities</p>
            {report.vulnerabilities.map((item) => (
              <div key={`${item.title}-${item.priority}`} className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="rounded-full border border-border/60 bg-secondary/20 px-2 py-0.5 text-xs text-muted-foreground">
                    {item.priority} Priority
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Risk: {item.risk}</p>
                <p className="mt-1 text-xs text-muted-foreground">Fix: {item.fix}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Recommendations</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {report.recommendations.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      {findings.length > 0 && (
        <Card className="bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground mb-3">Filter by Category:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({findings.length})
            </button>
            {Array.from(
              new Map(findings.map((f) => [f.category, f])).entries()
            ).map(([category]) => {
              const count = findings.filter((f) => f.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : `${CATEGORY_COLORS[category]} hover:opacity-80`
                  }`}
                >
                  {CATEGORY_LABELS[category] || category} ({count})
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {prioritizedFindings.length === 0 ? (
        <Card className="bg-card border border-border p-8 text-center">
          <p className="text-lg font-semibold mb-2">Looks Pretty Solid!</p>
          <p className="text-muted-foreground">
            This site appears to have good basic security practices. But remember,
            security is never 100% perfect—there&apos;s always room to improve!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Here&apos;s what I found. Click on each finding to see code examples, attack timelines, and hacker confidence scores.
          </p>
          {selectedCategory && (
            <p className="text-sm text-primary font-medium">
              Showing {prioritizedFindings.length} findings in{' '}
              <span className={CATEGORY_COLORS[selectedCategory]}>
                {CATEGORY_LABELS[selectedCategory]}
              </span>
            </p>
          )}
          <div className="space-y-4">
            {prioritizedFindings.map((finding) => (
              <SecurityFinding 
                key={finding.id} 
                finding={finding}
                explanation={explanationsById[finding.id]}
                url={url}
                onTryLiveDemo={handleTryLiveDemo}
                isFocusArea={isFocusWeakAreaMatch(finding, userWeakAreas)}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="bg-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-3">Remember</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Security is a journey, not a destination</li>
          <li>Always test changes in a safe environment first</li>
          <li>Keep learning and stay curious about security</li>
          <li>If you find real vulnerabilities, report them responsibly to the site owner</li>
        </ul>
      </Card>
    </div>
  );
}
