'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { HackerAssistant } from './hacker-assistant';
import { AttackScenarios } from './attack-scenarios';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: number;
}

const VULNERABILITY_PATTERNS = {
  sqlInjection: {
    pattern: /('|(--)|;|\/\*|\*\/|xp_|sp_)/i,
    alert: {
      type: 'critical' as const,
      title: 'SQL Injection Detected!',
      message:
        'Your input contains SQL syntax. A hacker could manipulate the database query!',
    },
  },
  xss: {
    pattern: /(<script|javascript:|onerror=|onload=|<img|<svg|<iframe)/i,
    alert: {
      type: 'critical' as const,
      title: 'XSS (Cross-Site Scripting) Detected!',
      message:
        'This looks like code injection. Hackers could steal cookies or sessions!',
    },
  },
  commandInjection: {
    pattern: /([;|&`$()\\]|cat|rm|ls|curl|wget)/i,
    alert: {
      type: 'critical' as const,
      title: 'Command Injection Risk!',
      message:
        'Your input contains shell command patterns. Server could be compromised!',
    },
  },
  sensitiveData: {
    pattern: /password|credit.?card|ssn|api.?key|secret|token|visa|mastercard/i,
    alert: {
      type: 'warning' as const,
      title: 'Sensitive Data Warning!',
      message: 'Never enter real passwords or credit cards in unencrypted forms!',
    },
  },
  noHttps: {
    shouldTrigger: true,
    alert: {
      type: 'warning' as const,
      title: 'No HTTPS Detected!',
      message: 'This connection is not encrypted. Your data could be intercepted!',
    },
  },
};

export function InteractiveDemo() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    search: '',
    comment: '',
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkedField, setCheckedField] = useState<string>('');

  const checkForVulnerabilities = useCallback((fieldName: string, value: string) => {
    const newAlerts: Alert[] = [];
    const timestamp = Date.now();

    if (!value.trim()) {
      setAlerts([]);
      return;
    }

    // Check SQL Injection
    if (VULNERABILITY_PATTERNS.sqlInjection.pattern.test(value)) {
      newAlerts.push({
        id: `sql-${timestamp}`,
        type: VULNERABILITY_PATTERNS.sqlInjection.alert.type,
        title: VULNERABILITY_PATTERNS.sqlInjection.alert.title,
        message: VULNERABILITY_PATTERNS.sqlInjection.alert.message,
        timestamp,
      });
    }

    // Check XSS
    if (VULNERABILITY_PATTERNS.xss.pattern.test(value)) {
      newAlerts.push({
        id: `xss-${timestamp}`,
        type: VULNERABILITY_PATTERNS.xss.alert.type,
        title: VULNERABILITY_PATTERNS.xss.alert.title,
        message: VULNERABILITY_PATTERNS.xss.alert.message,
        timestamp,
      });
    }

    // Check Command Injection
    if (VULNERABILITY_PATTERNS.commandInjection.pattern.test(value)) {
      newAlerts.push({
        id: `cmd-${timestamp}`,
        type: VULNERABILITY_PATTERNS.commandInjection.alert.type,
        title: VULNERABILITY_PATTERNS.commandInjection.alert.title,
        message: VULNERABILITY_PATTERNS.commandInjection.alert.message,
        timestamp,
      });
    }

    // Check Sensitive Data
    if (VULNERABILITY_PATTERNS.sensitiveData.pattern.test(value)) {
      newAlerts.push({
        id: `sensitive-${timestamp}`,
        type: VULNERABILITY_PATTERNS.sensitiveData.alert.type,
        title: VULNERABILITY_PATTERNS.sensitiveData.alert.title,
        message: VULNERABILITY_PATTERNS.sensitiveData.alert.message,
        timestamp,
      });
    }

    setAlerts(newAlerts);
    setCheckedField(fieldName);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    checkForVulnerabilities(name, value);
  };

  const handleReset = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      search: '',
      comment: '',
    });
    setAlerts([]);
    setCheckedField('');
  };

  const alertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const alertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-600';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-background/50 border border-border rounded-lg p-6">
        <div className="flex items-start gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Interactive Demo</h2>
            <p className="text-muted-foreground">
              Type malicious payloads below to see real-time security alerts. Watch how hackers exploit vulnerabilities!
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Form Section */}
        <div className="md:col-span-2.5">
          <Card className="bg-card border border-border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Vulnerable Login Form</h3>
            <p className="text-sm text-muted-foreground">
              This form is NOT protected. Try entering attack payloads to see security alerts appear.
            </p>

            <div className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Try: admin' OR '1'='1"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hint: Try entering SQL injection payloads
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Try: '); DROP TABLE users;--"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hint: Try database manipulation commands
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Try: <script>alert('XSS')</script>"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hint: Try JavaScript code injection
                </p>
              </div>

              {/* Search Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <input
                  type="text"
                  name="search"
                  value={formData.search}
                  onChange={handleInputChange}
                  placeholder="Try: ; rm -rf /"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hint: Try command line injection
                </p>
              </div>

              {/* Comment Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Comment</label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Try: <img src=x onerror='alert(1)'>"
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hint: Try event handler injection
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-secondary/20 text-foreground rounded-lg hover:bg-secondary/30 transition-colors font-medium"
              >
                Clear Form
              </button>
            </div>
          </Card>
        </div>

        {/* Alerts Section */}
        <div className="md:col-span-1.5">
          <Card className="bg-card border border-border p-6 h-full sticky top-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Live Alerts</h3>

            {alerts.length === 0 ? (
              <div className="space-y-3 text-center py-8">
                <Shield className="w-12 h-12 text-primary/50 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {checkedField
                    ? 'No vulnerabilities detected in this input'
                    : 'Start typing in the form to see security alerts'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3 animate-in fade-in slide-in-from-top-2 ${alertColor(alert.type)}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{alertIcon(alert.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-xs opacity-90 mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Hacker Assistant */}
            <div className="border-t border-border pt-4">
              <HackerAssistant activeInput={Object.values(formData).join('')} />
            </div>
          </Card>
        </div>
      </div>

      {/* Attack Scenarios */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Pre-Built Attack Scenarios</h2>
        <AttackScenarios />
      </div>

      {/* Educational Info */}
      <Card className="bg-background/50 border border-border p-6">
        <h3 className="font-semibold text-foreground mb-3">Quick Payload Reference:</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-primary mb-2">SQL Injection Payloads:</p>
            <ul className="text-muted-foreground space-y-1 text-xs font-mono">
              <li>admin&apos; OR &apos;1&apos;=&apos;1</li>
              <li>&apos;); DROP TABLE users;--</li>
              <li>1 UNION SELECT * FROM users</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-primary mb-2">XSS Payloads:</p>
            <ul className="text-muted-foreground space-y-1 text-xs font-mono">
              <li>&lt;script&gt;alert(&apos;XSS&apos;)&lt;/script&gt;</li>
              <li>&lt;img src=x onerror=alert(1)&gt;</li>
              <li>javascript:alert(&apos;test&apos;)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
