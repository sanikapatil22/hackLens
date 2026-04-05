'use client';

import { Globe, Zap as ZapIcon, Play, ShieldAlert, type LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  routeId: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { id: 'analyze', label: 'Analyze Website', routeId: 'website', icon: Globe },
  { id: 'live', label: 'Live Hacking Demo', routeId: 'live-demo', icon: Play },
  { id: 'try', label: 'Try Attack', routeId: 'interactive', icon: ZapIcon },
  { id: 'simulate', label: 'Simulate Attack', routeId: 'simulate', icon: ShieldAlert },
];

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0 border-b border-border/40 bg-background/50">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.routeId)}
          className={`flex items-center gap-2 px-4 py-3 rounded-none whitespace-nowrap transition-all font-medium text-sm font-mono relative group ${
            activeTab === tab.routeId
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
          {activeTab === tab.routeId && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-accent to-primary"></div>
          )}
        </button>
      ))}
    </div>
  );
}
