'use client';

import { SecurityFinding as SecurityFindingType } from '@/types/security';
import { AttackTimeline } from './attack-timeline';
import { BeforeAfterComparison } from './before-after-comparison';
import { CodeFixSnippets } from './code-fix-snippets';
import { ExplainLikeImFive } from './explain-like-im-five';
import { HackerConfidenceMeter } from './hacker-confidence-meter';
import { TryAttackSandbox } from './try-attack-sandbox';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SecurityFindingProps {
  finding: SecurityFindingType;
}

const severityConfig = {
  critical: { bg: 'bg-destructive/20', text: 'text-destructive', label: 'Critical Risk' },
  high: { bg: 'bg-red-900/20', text: 'text-red-400', label: 'High Risk' },
  medium: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', label: 'Medium Risk' },
  low: { bg: 'bg-blue-900/20', text: 'text-blue-400', label: 'Low Risk' },
};

export function SecurityFinding({ finding }: SecurityFindingProps) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[finding.severity];

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
