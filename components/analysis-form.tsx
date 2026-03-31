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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-mono font-semibold mb-3 text-foreground">
          target_url.scan()
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm">$</span>
            <Input
              id="url"
              type="text"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
              className="flex-1 pl-8 bg-secondary/40 border-border/40 text-foreground placeholder:text-muted-foreground focus:border-primary"
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        💡 Tip: You can analyze any public website. We&apos;ll fetch basic security info without
        attacking anything.
      </p>
    </form>
  );
}
