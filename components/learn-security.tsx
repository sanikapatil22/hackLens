'use client';

import { SecurityFinding } from '@/components/security-finding';
import { SecurityFinding as SecurityFindingType } from '@/types/security';

const exampleFindings: SecurityFindingType[] = [
  {
    id: 'https-missing',
    title: 'Missing HTTPS Encryption',
    severity: 'critical',
    category: 'Network Security',
    observed: 'Website uses HTTP instead of HTTPS for data transmission.',
    hackerPerspective:
      'I can intercept all traffic on the same network using tools like Wireshark. Every request and response passes through my computer unencrypted.',
    impact:
      'Attackers can steal passwords, credit cards, session tokens, and other sensitive data in real-time.',
    fix: 'Obtain an SSL/TLS certificate and enable HTTPS on your server. Redirect all HTTP traffic to HTTPS.',
    codeExample: {
      vulnerable: `// HTTP - Not Encrypted
fetch('http://example.com/api/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
})`,
      fixed: `// HTTPS - Encrypted
fetch('https://example.com/api/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
})`,
      explanation:
        'HTTPS encrypts all data in transit. Even if intercepted, the attacker cannot read it without the encryption key.',
    },
    eli5: {
      simple:
        'HTTPS is like sending a letter in a locked box. HTTP is like sending a postcard that anyone can read.',
      analogy:
        'Think of HTTP as shouting your credit card number in a crowded train. HTTPS is whispering it in a locked room.',
      example:
        'If your bank used HTTP, any hacker on the same WiFi could see your login password as you type it.',
    },
    hackerConfidence: {
      exploitDifficulty: 5,
      commonAttackVector: true,
      requiresUserInteraction: false,
      requiresAuthentication: false,
      estimatedSuccessRate: 95,
    },
    attackTimeline: [
      {
        step: 1,
        title: 'Connect to Network',
        description: 'Join the same WiFi network as the victim',
        action: 'Connect my laptop to the coffee shop WiFi',
        result: 'Now on the same network, can see traffic',
      },
      {
        step: 2,
        title: 'Set Up Sniffer',
        description: 'Use packet capture tool to monitor traffic',
        action: 'Run Wireshark and filter for HTTP traffic',
        result: 'Can see all unencrypted requests and responses',
      },
      {
        step: 3,
        title: 'Extract Credentials',
        description: 'Find login requests with credentials',
        action: 'Look for username and password in plain text',
        result: 'Obtain login credentials instantly',
      },
      {
        step: 4,
        title: 'Account Takeover',
        description: 'Use stolen credentials to access account',
        action: 'Login to the website with stolen credentials',
        result: 'Full access to the victims account',
      },
    ],
  },
  {
    id: 'sql-injection',
    title: 'SQL Injection Vulnerability',
    severity: 'critical',
    category: 'Injection Attacks',
    observed: 'User input is directly concatenated into SQL queries without sanitization.',
    hackerPerspective:
      'I can insert SQL commands into input fields. If I type " OR "1"="1 into a search field, the SQL becomes: SELECT * FROM users WHERE name = "" OR "1"="1"',
    impact:
      'Attackers can steal all database records, modify or delete data, bypass authentication, or take complete control of the system.',
    fix: 'Always use parameterized queries or prepared statements. Never concatenate user input into SQL queries.',
    codeExample: {
      vulnerable: `// VULNERABLE - SQL Injection possible
const query = "SELECT * FROM users WHERE username = '" + username + "'";
const result = db.execute(query);`,
      fixed: `// SAFE - Parameterized query
const query = "SELECT * FROM users WHERE username = ?";
const result = db.execute(query, [username]);`,
      explanation:
        'Parameterized queries treat user input as data, not code. SQL special characters are automatically escaped, preventing injection.',
    },
    eli5: {
      simple:
        'SQL injection is like a restaurant accepting spoken orders, but someone tricks them by saying "cancel the order; give me free food".',
      analogy:
        'A vulnerable query is like filling in a Mad Libs game - the hacker can insert their own story into your sentence.',
      example:
        'If a search says "Find all products named [input]", a hacker enters "x" OR "1"="1 to get all products, not just ones matching "x".',
    },
    hackerConfidence: {
      exploitDifficulty: 20,
      commonAttackVector: true,
      requiresUserInteraction: true,
      requiresAuthentication: false,
      estimatedSuccessRate: 85,
    },
    interactiveDemo: {
      type: 'sql-injection',
      title: 'Try SQL Injection',
      description: 'Test how SQL injection can bypass authentication',
      payload: "' OR '1'='1",
      expectedOutput: 'Database query manipulation',
      tips: [
        "' OR '1'='1",
        "admin' --",
        "' UNION SELECT * FROM users --",
        "1; DROP TABLE users; --",
      ],
    },
    beforeAfterComparison: {
      before: {
        code: 'SELECT * FROM users WHERE id = ' + '123 OR 1=1',
        vulnerabilityCount: 1,
        attackSurfaceArea: 'Full database exposure',
      },
      after: {
        code: 'SELECT * FROM users WHERE id = ? [123]',
        vulnerabilityCount: 0,
        attackSurfaceArea: 'Only requested record',
      },
    },
  },
];

export function LearnSecurity() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="bg-background/50 border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">Common Vulnerabilities</h3>
        <p className="text-sm text-muted-foreground">
          Explore real security vulnerabilities with attack timelines, interactive demos, and code examples.
        </p>
      </div>

      <div className="space-y-4">
        {exampleFindings.map((finding) => (
          <SecurityFinding key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
}
