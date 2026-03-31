'use client';

import { Card } from '@/components/ui/card';
import { AlertCircle, Lock, Globe, Maximize2 } from 'lucide-react';

interface WebsiteMockupProps {
  url: string;
  isVulnerable: boolean;
  vulnerabilityType: string;
  content?: React.ReactNode;
}

export function WebsiteMockup({
  url,
  isVulnerable,
  vulnerabilityType,
  content,
}: WebsiteMockupProps) {
  const domain = url.replace('https://', '').replace('http://', '').split('/')[0];
  const hasHttps = url.startsWith('https');

  return (
    <div className="w-full bg-background rounded-lg border border-border overflow-hidden shadow-2xl">
      {/* Browser Chrome */}
      <div className="bg-secondary/40 border-b border-border">
        {/* Toolbar */}
        <div className="px-4 py-3 flex items-center gap-3 bg-secondary/20">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-secondary/50 rounded transition-colors disabled" disabled>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-secondary/50 rounded transition-colors disabled" disabled>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Address Bar */}
          <div className="flex-1 bg-background/50 rounded-full px-4 py-2 flex items-center gap-2 border border-border/50">
            {hasHttps ? (
              <Lock className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm text-muted-foreground truncate">{url}</span>
          </div>

          <button className="p-1.5 hover:bg-secondary/50 rounded transition-colors">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Website Content */}
      <div className="bg-white text-foreground min-h-96">
        {content || <DefaultWebsiteContent url={domain} isVulnerable={isVulnerable} vulnerabilityType={vulnerabilityType} />}
      </div>

      {/* Vulnerability Indicator */}
      {isVulnerable && (
        <div className="bg-destructive/10 border-t border-destructive/20 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            <p className="font-semibold">{vulnerabilityType}</p>
            <p className="text-xs text-destructive/80">This website has an unpatched vulnerability</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface DefaultWebsiteContentProps {
  url: string;
  isVulnerable: boolean;
  vulnerabilityType: string;
}

function DefaultWebsiteContent({
  url,
  isVulnerable,
  vulnerabilityType,
}: DefaultWebsiteContentProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">{url}</h1>
        <p className="text-muted-foreground">Secure Online Banking & Financial Services</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 text-sm font-medium">
        <a href="#" className="text-primary hover:text-accent">
          Home
        </a>
        <a href="#" className="text-primary hover:text-accent">
          Services
        </a>
        <a href="#" className="text-primary hover:text-accent">
          Account
        </a>
        <a href="#" className="text-primary hover:text-accent">
          Support
        </a>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="bg-secondary/10 p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Welcome Back!</h2>
          
          {/* Login Form */}
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                defaultValue="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                defaultValue="password123"
              />
            </div>

            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </div>
        </div>

        {/* Info Box */}
        {isVulnerable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <p className="font-semibold mb-1">Vulnerability Detected</p>
            <p>{vulnerabilityType}: This site is vulnerable to attack</p>
          </div>
        )}
      </div>
    </div>
  );
}
