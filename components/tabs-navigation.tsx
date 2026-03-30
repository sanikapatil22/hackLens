'use client';

import { Globe, Upload, BookOpen, Zap, BarChart3, Zap as ZapIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'website', label: 'Analyze Website', icon: <Globe className="w-4 h-4" /> },
  { id: 'compare', label: 'Compare Sites', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'interactive', label: 'Try Attack', icon: <ZapIcon className="w-4 h-4" /> },
  { id: 'html', label: 'Upload HTML', icon: <Upload className="w-4 h-4" /> },
  { id: 'quiz', label: 'Hack or Safe', icon: <Zap className="w-4 h-4" /> },
  { id: 'learn', label: 'Learn Security', icon: <BookOpen className="w-4 h-4" /> },
];

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg whitespace-nowrap transition-colors font-medium text-sm ${
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
