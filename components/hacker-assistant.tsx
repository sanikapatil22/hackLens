'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MessageCircle, Zap, Target, Users } from 'lucide-react';

interface HackerMessage {
  id: string;
  message: string;
  type: 'observation' | 'exploitation' | 'warning' | 'success';
  timestamp: number;
}

const HACKER_INSIGHTS = {
  sqlInjection: [
    "I can see unvalidated input in the query. This is a classic SQL injection vector!",
    "The database query is constructed directly with user input. I could manipulate the query logic.",
    "With this vulnerability, I could extract entire databases or modify records.",
    "No parameterized queries detected. This is a textbook SQL injection vulnerability.",
  ],
  xss: [
    "User input is being rendered directly in the DOM without sanitization.",
    "I can inject JavaScript that will execute in every user's browser who views this.",
    "Once I inject code, I can steal session cookies and hijack user accounts.",
    "This opens the door for persistent attacks affecting all site visitors.",
  ],
  commandInjection: [
    "The application is passing unsanitized user input to shell commands.",
    "I could execute arbitrary system commands with the web server's privileges.",
    "This could give me complete control over the server and access to all files.",
    "A command injection here could lead to full system compromise.",
  ],
  noValidation: [
    "I notice there's no client-side validation happening here.",
    "Even without validation, a competent attacker can bypass it by directly modifying the request.",
    "Server-side validation is critical, but I don't see any checks on the input.",
    "The application trusts user input implicitly. Time to exploit it.",
  ],
  noHttps: [
    "The connection is unencrypted. I can intercept everything between the user and server.",
    "Passwords, tokens, and sensitive data are transmitted in plain text.",
    "With HTTPS, I couldn't read the traffic even if I intercepted it.",
    "This is the first vulnerability I'd exploit to hijack legitimate users.",
  ],
};

const VULNERABILITY_INSIGHTS: Record<string, string[]> = HACKER_INSIGHTS;

export function HackerAssistant({ activeInput: activeinput }: { activeInput: string }) {
  const [messages, setMessages] = useState<HackerMessage[]>([]);

  useEffect(() => {
    if (!activeinput.trim()) {
      setMessages([]);
      return;
    }

    const newMessages: HackerMessage[] = [];
    const timestamp = Date.now();

    // Detect vulnerability types
    if (/('|(--)|;|\/\*|\*\/|xp_|sp_)/i.test(activeinput)) {
      const insights = VULNERABILITY_INSIGHTS.sqlInjection;
      newMessages.push({
        id: `sql-${timestamp}`,
        message: insights[Math.floor(Math.random() * insights.length)],
        type: 'exploitation',
        timestamp,
      });
    }

    if (/(<script|javascript:|onerror=|onload=|<img|<svg|<iframe)/i.test(activeinput)) {
      const insights = VULNERABILITY_INSIGHTS.xss;
      newMessages.push({
        id: `xss-${timestamp}`,
        message: insights[Math.floor(Math.random() * insights.length)],
        type: 'exploitation',
        timestamp,
      });
    }

    if (/([;|&`$()\\]|cat|rm|ls|curl|wget)/i.test(activeinput)) {
      const insights = VULNERABILITY_INSIGHTS.commandInjection;
      newMessages.push({
        id: `cmd-${timestamp}`,
        message: insights[Math.floor(Math.random() * insights.length)],
        type: 'exploitation',
        timestamp,
      });
    }

    if (newMessages.length === 0 && activeinput.length > 3) {
      const insights = VULNERABILITY_INSIGHTS.noValidation;
      newMessages.push({
        id: `observe-${timestamp}`,
        message: insights[Math.floor(Math.random() * insights.length)],
        type: 'observation',
        timestamp,
      });
    }

    setMessages(newMessages);
  }, [activeinput]);

  const getIcon = (type: HackerMessage['type']) => {
    switch (type) {
      case 'exploitation':
        return <Target className="w-4 h-4" />;
      case 'warning':
        return <Zap className="w-4 h-4" />;
      case 'success':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getColor = (type: HackerMessage['type']) => {
    switch (type) {
      case 'exploitation':
        return 'bg-destructive/5 border-destructive/30 text-destructive';
      case 'warning':
        return 'bg-yellow-500/5 border-yellow-500/30 text-yellow-600';
      case 'success':
        return 'bg-green-500/5 border-green-500/30 text-green-600';
      default:
        return 'bg-purple-500/5 border-purple-500/30 text-purple-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
        <p className="text-sm font-medium text-foreground">Live Hacker Assistant</p>
      </div>

      {messages.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Waiting for suspicious input to analyze...
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border p-3 animate-in fade-in slide-in-from-left-2 text-xs ${getColor(msg.type)}`}
            >
              <div className="flex gap-2 items-start">
                <div className="flex-shrink-0 mt-0.5">{getIcon(msg.type)}</div>
                <p className="flex-1">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
