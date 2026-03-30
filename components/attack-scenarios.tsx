'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, Play, Copy, Check } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  payload: string;
  explanation: string;
  realWorldImpact: string;
  defense: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'sql-login',
    name: 'SQL Injection: Login Bypass',
    difficulty: 'easy',
    description: 'Bypass login without credentials using SQL injection',
    payload: "admin' OR '1'='1",
    explanation:
      'This payload modifies the SQL query to return true for the WHERE clause. The query becomes: SELECT * FROM users WHERE username="admin" OR "1"="1" AND password="..." which always returns the admin user.',
    realWorldImpact:
      'Attacker gains unauthorized access to admin accounts, potentially compromising the entire application and user data.',
    defense:
      'Use parameterized queries/prepared statements. Example: db.query("SELECT * FROM users WHERE username=? AND password=?", [username, password])',
  },
  {
    id: 'sql-union',
    name: 'SQL Injection: Data Extraction',
    difficulty: 'medium',
    description: 'Extract data from other database tables',
    payload: "' UNION SELECT username, password FROM users WHERE '1'='1",
    explanation:
      'Uses UNION to combine results from different tables. This allows extracting sensitive data like passwords from database tables.',
    realWorldImpact:
      'Attacker can extract entire user databases including usernames, passwords, emails, and other sensitive information.',
    defense:
      'Use prepared statements and apply the principle of least privilege. Limit database user permissions to only necessary operations.',
  },
  {
    id: 'xss-script',
    name: 'XSS: Stored Script Injection',
    difficulty: 'easy',
    description: 'Inject JavaScript that executes in other users browsers',
    payload: '<script>alert("XSS Vulnerability!")</script>',
    explanation:
      'User input containing script tags is stored and displayed to other users, causing the script to execute in their browsers.',
    realWorldImpact:
      'Attacker can steal cookies/sessions, redirect users to phishing sites, or deface page content. With stored XSS, it affects all visitors.',
    defense:
      'Sanitize all user input before storing. Use HTML encoding: replace <, >, &, ", \' with HTML entities. Use Content Security Policy headers.',
  },
  {
    id: 'xss-event',
    name: 'XSS: Event Handler Injection',
    difficulty: 'easy',
    description: 'Inject code via HTML event handlers',
    payload: '<img src=x onerror="alert(\'XSS\')">',
    explanation:
      'Event handlers like onerror, onload, onclick execute JavaScript when triggered. If user input is rendered in HTML attributes without escaping, this works.',
    realWorldImpact:
      'Attacker executes arbitrary JavaScript with full access to DOM, cookies, and user data in browser context.',
    defense:
      'Never put user input directly in HTML attributes. Use JavaScript APIs instead. Implement Content Security Policy to block inline scripts.',
  },
  {
    id: 'cmd-injection',
    name: 'Command Injection: System Control',
    difficulty: 'hard',
    description: 'Execute arbitrary system commands',
    payload: '; rm -rf /',
    explanation:
      'If user input is passed to shell commands without validation, semicolon separates commands. Attacker can chain multiple commands.',
    realWorldImpact:
      'Attacker gains command execution on the server with the privilege level of the web application. Could delete files, install malware, or pivot to other systems.',
    defense:
      'Never pass unsanitized user input to shell commands. Use parameterized functions. Better: use library functions instead of shell commands when possible.',
  },
  {
    id: 'cmd-pipe',
    name: 'Command Injection: Pipe Abuse',
    difficulty: 'medium',
    description: 'Chain commands using pipes',
    payload: '| cat /etc/passwd',
    explanation:
      'Pipe operator (|) allows chaining commands. Output of first command becomes input of second. Attacker can read sensitive files.',
    realWorldImpact:
      'Access to system files like /etc/passwd (user accounts), /etc/shadow (password hashes), configuration files with API keys or database credentials.',
    defense:
      'Use whitelist validation for user input. Only allow expected formats. Run application with minimal file system permissions.',
  },
  {
    id: 'path-traversal',
    name: 'Path Traversal: File Access',
    difficulty: 'medium',
    description: 'Access files outside intended directory',
    payload: '../../etc/passwd',
    explanation:
      '../ goes up one directory level. Using multiple ../ allows accessing files outside the intended directory. Attacker reads arbitrary files.',
    realWorldImpact:
      'Access to configuration files with database credentials, API keys, private keys, and sensitive application data.',
    defense:
      'Validate file paths. Use basename() to get filename only. Use a whitelist of allowed files. Never trust user input for file paths.',
  },
  {
    id: 'dos-payload',
    name: 'DoS: Resource Exhaustion',
    difficulty: 'hard',
    description: 'Crash the application with large input',
    payload: 'A'.repeat(1000000),
    explanation:
      'Sending extremely large input can exhaust memory, CPU, or processing time. Application becomes unresponsive for all users (Denial of Service).',
    realWorldImpact:
      'Website becomes unavailable. Users cannot access the service. Attacker blocks legitimate traffic.',
    defense:
      'Implement input size limits. Set request body size limits in web server. Add rate limiting. Use timeouts for long-running operations.',
  },
];

export function AttackScenarios() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPayload = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-900/20 text-green-400';
      case 'medium':
        return 'bg-yellow-900/20 text-yellow-400';
      case 'hard':
        return 'bg-red-900/20 text-red-400';
      default:
        return 'bg-gray-900/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-background/50 border border-border rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-foreground mb-2">Common Attack Scenarios</h3>
        <p className="text-sm text-muted-foreground">
          Click on any scenario to see the payload, explanation, and defensive measures. These are real-world attack vectors.
        </p>
      </div>

      <div className="space-y-3">
        {SCENARIOS.map((scenario) => (
          <Card
            key={scenario.id}
            className="bg-card border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
          >
            <button
              onClick={() => setExpandedId(expandedId === scenario.id ? null : scenario.id)}
              className="w-full p-4 hover:bg-secondary/10 transition-colors text-left flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty.toUpperCase()}
                  </span>
                  <h4 className="font-semibold text-foreground">{scenario.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                  expandedId === scenario.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedId === scenario.id && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                {/* Payload Section */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Attack Payload</p>
                  <div className="bg-background rounded border border-border/50 p-3 flex items-center justify-between gap-2">
                    <code className="text-xs text-muted-foreground font-mono break-all flex-1">
                      {scenario.payload}
                    </code>
                    <button
                      onClick={() => copyPayload(scenario.id, scenario.payload)}
                      className="flex-shrink-0 p-2 hover:bg-secondary/20 rounded transition-colors"
                      title="Copy payload"
                    >
                      {copiedId === scenario.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">How It Works</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{scenario.explanation}</p>
                </div>

                {/* Real World Impact */}
                <div>
                  <p className="text-sm font-semibold text-destructive mb-2">Real-World Impact</p>
                  <p className="text-sm text-destructive/80 leading-relaxed">{scenario.realWorldImpact}</p>
                </div>

                {/* Defense */}
                <div>
                  <p className="text-sm font-semibold text-green-500 mb-2">How to Defend</p>
                  <div className="bg-green-900/10 rounded border border-green-900/20 p-3">
                    <code className="text-xs text-green-400 font-mono">{scenario.defense}</code>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="bg-background/50 border border-border p-4">
        <h4 className="font-semibold text-foreground mb-2">Learning Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>Understand HOW the attack works, not just the payload</li>
          <li>Test each scenario in the interactive demo above</li>
          <li>Learn the defensive measures and implement them in your code</li>
          <li>Remember: knowing how to attack helps you build better defenses</li>
        </ul>
      </Card>
    </div>
  );
}
