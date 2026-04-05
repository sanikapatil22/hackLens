'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Scenario } from '@/lib/ai/scenario-types';

interface ScenarioDisplayProps {
  scenario: Scenario;
  onAction: (option: string) => void;
}

interface EmailParts {
  from?: string;
  body: string;
}

function parseEmailContent(content: string): EmailParts {
  const lines = content.split('\n').map((line) => line.trim());
  const from = lines.find((line) => line.toLowerCase().startsWith('from:'));
  const body = lines.filter((line) => !line.toLowerCase().startsWith('from:') && !line.toLowerCase().startsWith('subject:')).join('\n').trim();

  return {
    from,
    body: body || content,
  };
}

function EmailScenario({ scenario }: { scenario: Scenario }) {
  const parsed = parseEmailContent(scenario.content);

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
      <div className="rounded-md border border-border/60 bg-card p-3 space-y-2">
        <p className="text-sm text-muted-foreground">{parsed.from ?? 'From: unknown-sender@external-mail.com'}</p>
        <p className="text-sm font-semibold text-foreground">Subject: {scenario.title}</p>
      </div>
      <div className="rounded-md border border-border/60 bg-background/70 p-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{parsed.body}</p>
      </div>
    </div>
  );
}

function SmsScenario({ scenario }: { scenario: Scenario }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md border border-cyan-500/30 bg-cyan-900/20 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-cyan-300/80">SMS</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{scenario.content}</p>
      </div>
    </div>
  );
}

function ChatScenario({ scenario }: { scenario: Scenario }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
      <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">Project Director</p>
        <p className="mt-1 text-sm text-foreground">{scenario.title}</p>
      </div>
      <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md border border-amber-500/30 bg-amber-900/20 px-4 py-3">
        <p className="whitespace-pre-wrap text-sm text-foreground">{scenario.content}</p>
      </div>
    </div>
  );
}

function WebsiteScenario({ scenario }: { scenario: Scenario }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-destructive">Potential Fake Security Portal</p>
        <p className="text-sm text-foreground/90">{scenario.content}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            disabled
            className="h-9 rounded-md border border-border/60 bg-background/70 px-3 text-sm text-muted-foreground"
            placeholder="Username"
          />
          <input
            disabled
            className="h-9 rounded-md border border-border/60 bg-background/70 px-3 text-sm text-muted-foreground"
            placeholder="Password"
          />
        </div>
        <Button type="button" variant="destructive" disabled className="w-full">
          Sign in
        </Button>
      </div>
    </div>
  );
}

function InterfaceRenderer({ scenario }: { scenario: Scenario }) {
  if (scenario.interface === 'email') {
    return <EmailScenario scenario={scenario} />;
  }

  if (scenario.interface === 'sms') {
    return <SmsScenario scenario={scenario} />;
  }

  if (scenario.interface === 'chat') {
    return <ChatScenario scenario={scenario} />;
  }

  return <WebsiteScenario scenario={scenario} />;
}

export function ScenarioDisplay({ scenario, onAction }: ScenarioDisplayProps) {
  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{scenario.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <InterfaceRenderer scenario={scenario} />

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What would you do next?</p>
          <div className="grid gap-2">
            {scenario.options.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                className="h-auto min-h-10 justify-start whitespace-normal text-left leading-relaxed"
                onClick={() => onAction(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
