'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface CompareSitesProps {
  onCompare: (url1: string, url2: string) => void;
  loading?: boolean;
}

export function CompareSites({ onCompare, loading = false }: CompareSitesProps) {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [error, setError] = useState('');

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url1.trim() || !url2.trim()) {
      setError('Please enter both URLs to compare');
      return;
    }

    if (url1.trim() === url2.trim()) {
      setError('URLs must be different');
      return;
    }

    onCompare(url1.trim(), url2.trim());
  };

  return (
    <div className="w-full space-y-6">
      <Card className="bg-card border border-border p-6">
        <h2 className="text-2xl font-bold mb-2">Compare Two Sites</h2>
        <p className="text-muted-foreground mb-6">
          Analyze and compare the security posture of two websites side by side
        </p>

        <form onSubmit={handleCompare} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Website 1</label>
              <input
                type="text"
                value={url1}
                onChange={(e) => setUrl1(e.target.value)}
                placeholder="example.com or https://example.com"
                disabled={loading}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website 2</label>
              <input
                type="text"
                value={url2}
                onChange={(e) => setUrl2(e.target.value)}
                placeholder="example.com or https://example.com"
                disabled={loading}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Comparing...' : 'Compare Websites'}
          </button>
        </form>
      </Card>

      <Card className="bg-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">How Comparison Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Risk Score Comparison</p>
              <p className="text-sm text-muted-foreground">
                See which site has a higher overall security risk
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Finding Breakdown</p>
              <p className="text-sm text-muted-foreground">
                Compare counts of critical, high, medium, and low severity issues
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Category Analysis</p>
              <p className="text-sm text-muted-foreground">
                Identify which site excels in different security categories
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
