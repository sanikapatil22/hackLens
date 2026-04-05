import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STAGES = [
  { id: 'foothold', label: 'Initial Access' },
  { id: 'privilege_escalation', label: 'Privilege Escalation' },
  { id: 'lateral_movement', label: 'Lateral Movement' },
  { id: 'exfiltration', label: 'Exfiltration' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

interface AttackProgressProps {
  attackerProgress?: StageId;
}

export function AttackProgress({ attackerProgress = 'foothold' }: AttackProgressProps) {
  const currentIndex = Math.max(
    0,
    STAGES.findIndex((stage) => stage.id === attackerProgress)
  );

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Attack Progression</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-4">
          {STAGES.map((stage, index) => {
            const isCurrent = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div key={stage.id} className="flex items-center gap-2">
                <div
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300',
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300'
                        : 'border-border/60 bg-background/50 text-muted-foreground',
                  ].join(' ')}
                >
                  {index + 1}
                </div>
                <p
                  className={[
                    'text-xs leading-tight transition-colors duration-300',
                    isCurrent
                      ? 'font-semibold text-foreground'
                      : isCompleted
                        ? 'text-emerald-300/90'
                        : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
