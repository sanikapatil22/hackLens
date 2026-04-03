'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (url: string) => void;
  disabled?: boolean;
}

export function AnalysisForm({ onAnalyze, disabled }: AnalysisFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic URL validation
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      onAnalyze(urlObj.toString());
    } catch {
      setError('Please enter a valid URL (e.g., example.com)');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 text-center">
      <div className="space-y-3">
        <label htmlFor="url" className="block text-sm font-mono font-semibold text-foreground">
          target_url.scan()
        </label>
        <div className="flex w-full justify-center gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm">$</span>
            <Input
              id="url"
              type="text"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
              className="w-full pl-8 bg-secondary/40 border-border/40 text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <Button
            type="submit"
            disabled={disabled || !url}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-semibold gap-2 border border-primary/50"
          >
            {disabled ? 'Scanning...' : 'Scan'} <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">
        💡 Tip: You can analyze any public website. We&apos;ll fetch basic security info without
        attacking anything.
      </p>
    </form>
  );
}
