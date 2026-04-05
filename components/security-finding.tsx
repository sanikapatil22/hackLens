'use client';

import { SecurityFinding as SecurityFindingType } from '@/types/security';
import { AttackTimeline } from './attack-timeline';
import { BeforeAfterComparison } from './before-after-comparison';
import { CodeFixSnippets } from './code-fix-snippets';
import { ExplainLikeImFive } from './explain-like-im-five';
import { HackerConfidenceMeter } from './hacker-confidence-meter';
import { TryAttackSandbox } from './try-attack-sandbox';
import { Card } from '@/components/ui/card';
import { ChevronDown, Zap } from 'lucide-react';
import { useState } from 'react';
import type { SecurityExplainer } from './security-explainer';

interface SecurityFindingProps {
  finding: SecurityFindingType;
  explanation?: SecurityExplainer;
  url?: string;
  onTryLiveDemo?: (findingId: string, url: string) => void;
  isFocusArea?: boolean;
}

const severityConfig = {
  critical: { bg: 'bg-destructive/20', text: 'text-destructive', label: 'Critical Risk' },
  high: { bg: 'bg-red-900/20', text: 'text-red-400', label: 'High Risk' },
  medium: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', label: 'Medium Risk' },
  low: { bg: 'bg-blue-900/20', text: 'text-blue-400', label: 'Low Risk' },
};

function getSeverityMessage(severity: SecurityFindingType['severity']): string {
  if (severity === 'critical' || severity === 'high') {
    return '🔴 High risk — immediate action required';
  }

  if (severity === 'medium') {
    return '🟡 Moderate risk — should be addressed';
  }

  return '🟢 Low risk — best practice improvement';
}

function getFixPriority(finding: SecurityFindingType): 'High' | 'Medium' | 'Low' {
  if (finding.severity === 'critical' || finding.severity === 'high') {
    return 'High';
  }

  if (finding.severity === 'medium') {
    return 'Medium';
  }

  return 'Low';
}

export function SecurityFinding({ finding, explanation, url, onTryLiveDemo, isFocusArea = false }: SecurityFindingProps) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[finding.severity];
  const severityMessage = getSeverityMessage(finding.severity);
  const fixPriority = getFixPriority(finding);

  return (
    <Card className="bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 hover:bg-secondary/20 transition-colors text-left flex items-start justify-between gap-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            {isFocusArea && (
              <span className="px-2 py-1 rounded text-xs font-medium border border-amber-500/40 bg-amber-500/10 text-amber-300">
                ⚠️ Focus Area for You
              </span>
            )}
            <span className="text-xs text-muted-foreground">{finding.category}</span>
          </div>
          <h3 className="text-lg font-semibold">{finding.title}</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-primary mb-2">🔍 What I Noticed</h4>
            <p className="text-muted-foreground">{finding.observed}</p>
          </div>

          <div>
            <h4 className="font-semibold text-accent mb-2">😈 How I&apos;d Attack This</h4>
            <p className="text-muted-foreground">{finding.hackerPerspective}</p>
          </div>

          <div>
            <h4 className="font-semibold text-destructive mb-2">💥 What Could Happen</h4>
            <p className="text-muted-foreground">{finding.impact}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">🛠 How to Fix It</h4>
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-muted-foreground text-sm">{finding.fix}</p>
            </div>
          </div>

          {explanation && (
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-foreground">Security Explainer</h4>
                {explanation.confidence && (
                  <span className="rounded-full border border-border/60 bg-secondary/20 px-2.5 py-1 text-xs font-medium text-foreground">
                    🤖 AI Confidence: {explanation.confidence}
                  </span>
                )}
              </div>

              <div className="rounded-md border border-border/50 bg-secondary/20 px-3 py-2">
                <p className="text-xs font-medium text-foreground">{severityMessage}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">🧠 AI Insight</p>
                <p className="mt-1 text-sm text-muted-foreground">{explanation.insight}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">⚠️ Risk</p>
                <p className="mt-1 text-sm text-muted-foreground">{explanation.risk}</p>
              </div>

              {explanation.attack_scenario && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">🎯 Attack Scenario</p>
                  <p className="mt-1 text-sm text-muted-foreground">{explanation.attack_scenario}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">🛠 Fix</p>
                <p className="mt-1 text-sm text-muted-foreground">{explanation.fix}</p>
              </div>

              {explanation.fix_code && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">🛠 Fix Code</p>
                  <pre className="mt-1 overflow-x-auto rounded-md border border-border/60 bg-background/70 p-3 text-xs text-foreground">
                    <code>{explanation.fix_code}</code>
                  </pre>
                </div>
              )}

              <div className="rounded-md border border-border/50 bg-secondary/20 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">⏱ Fix Priority</p>
                <p className="mt-1 text-sm font-medium text-foreground">{fixPriority}</p>
              </div>

              {explanation.fix_effort && (
                <div className="rounded-md border border-border/50 bg-secondary/20 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🛠 Fix Effort</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{explanation.fix_effort}</p>
                </div>
              )}

              {explanation.impact && (
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-md border border-red-500/30 bg-red-900/10 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-300">📉 Before Fix</p>
                    <p className="mt-1 text-sm text-muted-foreground">{explanation.impact.before}</p>
                  </div>
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-900/10 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">📈 After Fix</p>
                    <p className="mt-1 text-sm text-muted-foreground">{explanation.impact.after}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Try Live Demo Button */}
          {url && onTryLiveDemo && (
            <button
              onClick={() => onTryLiveDemo(finding.id, url)}
              className="w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Try Live Demo for {url.split('//')[1]?.split('/')[0] || url}
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-border/50 my-4" />

          {/* Enhanced Features */}
          {finding.codeExample && (
            <div>
              <CodeFixSnippets example={finding.codeExample} />
            </div>
          )}

          {finding.beforeAfterComparison && (
            <div>
              <BeforeAfterComparison {...finding.beforeAfterComparison} />
            </div>
          )}

          {finding.eli5 && (
            <div>
              <ExplainLikeImFive explanation={finding.eli5} isOpen={false} />
            </div>
          )}

          {finding.hackerConfidence && (
            <div>
              <HackerConfidenceMeter metrics={finding.hackerConfidence} />
            </div>
          )}

          {finding.attackTimeline && finding.attackTimeline.length > 0 && (
            <div>
              <AttackTimeline steps={finding.attackTimeline} />
            </div>
          )}

          {finding.interactiveDemo && (
            <div>
              <TryAttackSandbox demo={finding.interactiveDemo} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
