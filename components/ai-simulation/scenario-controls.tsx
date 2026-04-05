'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Scenario } from '@/lib/ai/scenario-types';

type ScenarioType = Scenario['type'];
type ScenarioDifficulty = Scenario['difficulty'];
type ScenarioMode = 'demo' | 'live';

interface ScenarioControlsProps {
  type: ScenarioType;
  setType: (value: ScenarioType) => void;
  difficulty: ScenarioDifficulty;
  setDifficulty: (value: ScenarioDifficulty) => void;
  mode: ScenarioMode;
  setMode: (value: ScenarioMode) => void;
  onGenerate: () => void | Promise<void>;
  loading?: boolean;
}

const attackTypes: ScenarioType[] = ['phishing', 'smishing', 'impersonation', 'malware'];
const difficulties: ScenarioDifficulty[] = ['easy', 'medium', 'hard'];

function toLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ScenarioControls({
  type,
  setType,
  difficulty,
  setDifficulty,
  mode,
  setMode,
  onGenerate,
  loading = false,
}: ScenarioControlsProps) {
  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="gap-3">
        <CardTitle className="text-base font-semibold">Simulate Attack</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attack Type
            </p>
            <Select value={type} onValueChange={(value: string) => setType(value as ScenarioType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select attack type" />
              </SelectTrigger>
              <SelectContent>
                {attackTypes.map((option) => (
                  <SelectItem key={option} value={option}>
                    {toLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Difficulty
            </p>
            <Select
              value={difficulty}
              onValueChange={(value: string) => setDifficulty(value as ScenarioDifficulty)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((option) => (
                  <SelectItem key={option} value={option}>
                    {toLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Execution Mode</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={mode === 'demo' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setMode('demo')}
              disabled={loading}
            >
              <span>🟡 Demo Mode (Cached AI)</span>
            </Button>
            <Button
              type="button"
              variant={mode === 'live' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setMode('live')}
              disabled={loading}
            >
              <span>🟢 Live Mode (Simulated AI)</span>
            </Button>
          </div>
        </div>

        <Button type="button" className="w-full" onClick={onGenerate} disabled={loading}>
          Generate Scenario
        </Button>
      </CardContent>
    </Card>
  );
}
