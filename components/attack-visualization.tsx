'use client';

import { Card } from '@/components/ui/card';
import { AlertTriangle, Shield, Network, Database, Eye, Lock } from 'lucide-react';

interface AttackStep {
  title: string;
  description: string;
  impact: string;
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string[];
}

interface AttackVisualizationProps {
  vulnerability: string;
  steps: AttackStep[];
  dataExposed?: string[];
}

export function AttackVisualization({
  vulnerability,
  steps,
  dataExposed,
}: AttackVisualizationProps) {
  const severityColors = {
    low: 'bg-blue-900/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-900/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-900/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Vulnerability Overview */}
      <Card className="bg-card border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Attack Chain: {vulnerability}</h3>
        <p className="text-muted-foreground">
          This visualization shows how an attacker would exploit this vulnerability step by step.
        </p>
      </Card>

      {/* Attack Steps Timeline */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index} className={`border border-border p-6 space-y-3 ${severityColors[step.severity]}`}>
            <div className="flex items-start gap-4">
              <div className="mt-1">{step.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-foreground text-lg">Step {index + 1}: {step.title}</h4>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full border"
                    style={{
                      backgroundColor: step.severity === 'critical' ? 'rgb(239, 68, 68)' : 
                                      step.severity === 'high' ? 'rgb(234, 88, 12)' :
                                      step.severity === 'medium' ? 'rgb(202, 138, 4)' : 'rgb(59, 130, 246)',
                      borderColor: step.severity === 'critical' ? 'rgb(239, 68, 68)' :
                                  step.severity === 'high' ? 'rgb(234, 88, 12)' :
                                  step.severity === 'medium' ? 'rgb(202, 138, 4)' : 'rgb(59, 130, 246)',
                      color: 'white'
                    }}
                  >
                    {step.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-foreground mb-3">{step.description}</p>
                <div className="bg-background/50 rounded p-3 border border-border/50 mb-3">
                  <p className="text-sm font-semibold text-foreground mb-1">Impact:</p>
                  <p className="text-sm text-muted-foreground">{step.impact}</p>
                </div>
                {step.details && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase">Technical Details:</p>
                    <ul className="space-y-1">
                      {step.details.map((detail, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Data Exposed */}
      {dataExposed && dataExposed.length > 0 && (
        <Card className="bg-destructive/10 border border-destructive/30 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h4 className="font-semibold text-destructive">Data Exposed in Attack</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dataExposed.map((data, index) => (
              <div key={index} className="bg-background/50 rounded p-3 flex items-center gap-2 border border-destructive/20">
                <Eye className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{data}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Prevention */}
      <Card className="bg-green-900/10 border border-green-500/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          <h4 className="font-semibold text-green-400">How to Prevent This Attack</h4>
        </div>
        <ul className="space-y-2">
          <li className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Use HTTPS/TLS encryption for all data in transit</span>
          </li>
          <li className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Implement proper input validation and parameterized queries</span>
          </li>
          <li className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Use security headers (CSP, X-Frame-Options, etc.)</span>
          </li>
          <li className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Apply principle of least privilege for database access</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
