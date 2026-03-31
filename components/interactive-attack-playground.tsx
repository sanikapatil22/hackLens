'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Copy, Check } from 'lucide-react';

interface PayloadExample {
  name: string;
  description: string;
  payload: string;
  resultMessage: string;
}

interface InteractiveAttackPlaygroundProps {
  vulnerability: string;
  targetField: string;
  payloads: PayloadExample[];
  onAttack?: (payload: string) => void;
}

export function InteractiveAttackPlayground({
  vulnerability,
  targetField,
  payloads,
  onAttack,
}: InteractiveAttackPlaygroundProps) {
  const [customPayload, setCustomPayload] = useState('');
  const [activePayload, setActivePayload] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customResult, setCustomResult] = useState<string | null>(null);

  const handlePayloadClick = (index: number) => {
    setActivePayload(index);
    const payload = payloads[index];
    setResult(payload.resultMessage);
    setCustomPayload(payload.payload);
    setCustomResult(null);
    onAttack?.(payload.payload);
  };

  const handleCustomPayload = () => {
    if (!customPayload.trim()) return;
    
    // Simulate detection
    let detectionResult = 'Custom payload detected!';
    
    if (customPayload.includes('OR') || customPayload.includes('or')) {
      detectionResult = 'SQL Injection detected: OR operator found';
    } else if (customPayload.includes('<script>') || customPayload.includes('javascript:')) {
      detectionResult = 'XSS Attack detected: Script tag found';
    } else if (customPayload.includes('$(') || customPayload.includes('`')) {
      detectionResult = 'Command Injection detected: Command substitution found';
    }
    
    setCustomResult(detectionResult);
    setActivePayload(null);
    setResult(null);
    onAttack?.(customPayload);
  };

  const handleCopy = (payload: string, index: number) => {
    navigator.clipboard.writeText(payload);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Playground</h3>
        <p className="text-muted-foreground text-sm">
          Try attack payloads against the {vulnerability}. See what happens when these inputs are processed.
        </p>
      </Card>

      {/* Payload Examples */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground text-sm">Pre-Built Payloads (Click to Test):</h4>
        <div className="grid gap-3">
          {payloads.map((payload, index) => (
            <button
              key={index}
              onClick={() => handlePayloadClick(index)}
              className={`text-left p-4 rounded-lg border transition-all ${
                activePayload === index
                  ? 'bg-primary/20 border-primary/50'
                  : 'bg-secondary/20 border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm mb-1">{payload.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{payload.description}</p>
                  <code className="text-xs bg-background/50 rounded px-2 py-1 text-accent break-all">
                    {payload.payload}
                  </code>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(payload.payload, index);
                  }}
                  className="p-2 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                  title="Copy payload"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Payload Input */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground text-sm">Create Custom Payload:</h4>
        <Card className="bg-card border border-border p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Payload Input ({targetField})
            </label>
            <textarea
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder="Enter custom attack payload..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={handleCustomPayload}
            disabled={!customPayload.trim()}
            className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test Custom Payload
          </button>
        </Card>
      </div>

      {/* Results */}
      {(result || customResult) && (
        <Card className={`p-6 border ${
          result 
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-yellow-900/10 border-yellow-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-1 ${
              result ? 'text-destructive' : 'text-yellow-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold mb-2 ${result ? 'text-destructive' : 'text-yellow-500'}`}>
                Attack Result
              </p>
              <p className="text-sm text-muted-foreground">
                {result || customResult}
              </p>
              {result && activePayload !== null && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Payload Used:</span> {payloads[activePayload].payload}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-blue-900/10 border border-blue-500/30 p-4">
        <p className="text-sm text-blue-400 font-semibold mb-2">Playground Tips:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Click any pre-built payload to see it in action</li>
          <li>• Write custom payloads to test variations</li>
          <li>• Each payload is safely sandboxed - no real systems are affected</li>
          <li>• Learn how attackers craft exploits for different vulnerabilities</li>
        </ul>
      </Card>
    </div>
  );
}
