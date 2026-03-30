'use client';

import { InteractiveDemo } from '@/types/security';
import { AlertCircle, Copy, Zap } from 'lucide-react';
import { useState } from 'react';

interface TryAttackSandboxProps {
  demo: InteractiveDemo;
}

export function TryAttackSandbox({ demo }: TryAttackSandboxProps) {
  const [input, setInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSimulateAttack = () => {
    setIsSimulating(true);
    
    // Simulate attack execution
    setTimeout(() => {
      let success = false;
      let message = '';
      let data = '';

      if (demo.type === 'sql-injection') {
        const hasInjection = input.includes("'") || input.includes('--') || input.includes('/*');
        success = hasInjection;
        if (hasInjection) {
          message = '💥 SQL Injection Successful! Database query was manipulated.';
          data = `SELECT * FROM users WHERE username = '${input}' AND password = 'anything'`;
        } else {
          message = 'Query executed safely - no injection detected.';
        }
      } else if (demo.type === 'xss') {
        const hasScript = input.includes('<') && input.includes('>');
        success = hasScript;
        if (hasScript) {
          message = '💥 XSS Attack Successful! Malicious script injected into page.';
          data = `User input rendered: ${input}`;
        } else {
          message = 'Input rendered safely - no XSS detected.';
        }
      } else if (demo.type === 'command-injection') {
        const hasCommand = input.includes(';') || input.includes('|') || input.includes('&&');
        success = hasCommand;
        if (hasCommand) {
          message = '💥 Command Injection Successful! System command executed.';
          data = `Executed: ping ${input}`;
        } else {
          message = 'Command executed safely - no injection detected.';
        }
      }

      setResult({
        success,
        message,
        data,
      });
      setIsSimulating(false);
    }, 800);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(demo.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border">
      <div>
        <h3 className="text-lg font-semibold text-accent flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Try the Attack
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          This is a safe sandbox. Try to exploit the vulnerable system below.
        </p>
      </div>

      {/* Attack type info */}
      <div className="bg-secondary/30 p-3 rounded border border-border/50">
        <p className="text-xs font-semibold text-accent uppercase mb-1">Attack Type: {demo.type}</p>
        <p className="text-sm text-foreground">{demo.description}</p>
      </div>

      {/* Input area */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Attack Input:
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try entering something malicious..."
          className="w-full px-3 py-2 rounded-lg bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Hint: Try: <code className="bg-secondary/50 px-2 py-1 rounded text-accent">{demo.payload}</code>
        </p>
      </div>

      {/* Suggested payloads */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Common Payloads:</p>
        <div className="grid grid-cols-1 gap-2">
          {demo.tips.map((tip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(tip);
                setResult(null);
              }}
              className="text-left px-3 py-2 rounded bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors"
            >
              {tip}
            </button>
          ))}
        </div>
      </div>

      {/* Simulate button */}
      <button
        onClick={handleSimulateAttack}
        disabled={!input || isSimulating}
        className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSimulating ? (
          <>
            <span className="inline-block animate-spin">⚙️</span>
            Simulating Attack...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Execute Attack
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className={`p-4 rounded-lg border-2 ${
          result.success
            ? 'bg-destructive/10 border-destructive'
            : 'bg-green-500/10 border-green-500'
        }`}>
          <div className="flex gap-2 mb-2">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
              result.success ? 'text-destructive' : 'text-green-500'
            }`} />
            <p className={`font-semibold ${result.success ? 'text-destructive' : 'text-green-500'}`}>
              {result.message}
            </p>
          </div>
          {result.data && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                System Output:
              </p>
              <div className="bg-background/80 p-2 rounded font-mono text-xs text-foreground break-all border border-border">
                {result.data}
              </div>
            </div>
          )}
          <div className="mt-3 p-2 bg-background/60 rounded text-sm text-foreground">
            {result.success ? (
              <p>
                This attack worked because the system didn&apos;t validate or sanitize user input. A hacker could use this to steal data, modify records, or take control of the system.
              </p>
            ) : (
              <p>
                This input was safely handled. The system either validated the input or escaped special characters, preventing the injection attack.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
