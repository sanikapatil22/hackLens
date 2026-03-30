'use client';

import { CodeExample } from '@/types/security';
import { Check, Copy, X } from 'lucide-react';
import { useState } from 'react';

interface CodeFixSnippetsProps {
  example: CodeExample;
}

export function CodeFixSnippets({ example }: CodeFixSnippetsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Fix with Code Snippets</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vulnerable Code */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <X className="w-5 h-5 text-destructive" />
            <h4 className="font-semibold text-destructive">Vulnerable Code</h4>
          </div>
          <div className="relative bg-destructive/5 border border-destructive/30 rounded-lg p-4">
            <pre className="text-xs font-mono text-foreground overflow-x-auto">
              <code>{example.vulnerable}</code>
            </pre>
            <button
              onClick={() => copyCode(example.vulnerable, 0)}
              className="absolute top-2 right-2 p-2 bg-background hover:bg-secondary rounded transition-colors"
              title="Copy code"
            >
              {copiedIndex === 0 ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Fixed Code */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-green-500">Fixed Code</h4>
          </div>
          <div className="relative bg-green-500/5 border border-green-500/30 rounded-lg p-4">
            <pre className="text-xs font-mono text-foreground overflow-x-auto">
              <code>{example.fixed}</code>
            </pre>
            <button
              onClick={() => copyCode(example.fixed, 1)}
              className="absolute top-2 right-2 p-2 bg-background hover:bg-secondary rounded transition-colors"
              title="Copy code"
            >
              {copiedIndex === 1 ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-background/50 border border-border rounded-lg p-4">
        <p className="text-sm font-semibold text-foreground mb-2">What Changed:</p>
        <p className="text-sm text-foreground">{example.explanation}</p>
      </div>
    </div>
  );
}
