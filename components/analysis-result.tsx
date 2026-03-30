'use client';

import { useState } from 'react';
import { SecurityFinding as SecurityFindingType } from '@/types/security';
import { SecurityFinding } from './security-finding';
import { Card } from '@/components/ui/card';

interface AnalysisResultProps {
  result: any;
  url: string;
}

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

export function AnalysisResult({ result, url }: AnalysisResultProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
  const filteredFindings = selectedCategory
    ? findings.filter((f) => f.category === selectedCategory)
    : findings;

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-destructive';
    if (score >= 50) return 'text-accent';
    if (score >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

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
      </Card>

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

      {filteredFindings.length === 0 ? (
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
              Showing {filteredFindings.length} findings in{' '}
              <span className={CATEGORY_COLORS[selectedCategory]}>
                {CATEGORY_LABELS[selectedCategory]}
              </span>
            </p>
          )}
          <div className="space-y-4">
            {filteredFindings.map((finding) => (
              <SecurityFinding key={finding.id} finding={finding} />
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
