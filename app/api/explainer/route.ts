import { NextRequest, NextResponse } from 'next/server';
import { logApi } from '@/lib/server/logger';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 5000;

type SecurityExplainer = {
  title: string;
  insight: string;
  risk: string;
  fix: string;
  fix_code?: string;
  attack_scenario?: string;
  fix_effort?: 'Easy' | 'Moderate' | 'Advanced';
  impact?: {
    before: string;
    after: string;
  };
  confidence?: 'High' | 'Medium' | 'Low';
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function detectNormalizedType(vulnerabilityType: string): string {
  return normalizeText(vulnerabilityType);
}

function mapFixEffort(normalizedType: string): 'Easy' | 'Moderate' | 'Advanced' {
  if (normalizedType.includes('sql') || normalizedType.includes('sqli')) {
    return 'Moderate';
  }

  if (normalizedType.includes('xss')) {
    return 'Moderate';
  }

  if (normalizedType.includes('auth') || normalizedType.includes('crypto')) {
    return 'Advanced';
  }

  return 'Easy';
}

function getCachedExplanation(vulnerabilityType: string, title: string): SecurityExplainer {
  const normalized = detectNormalizedType(vulnerabilityType);

  if (normalized.includes('sql injection') || normalized.includes('sqli')) {
    return {
      title,
      insight: 'Allows attackers to alter database queries using crafted input.',
      risk: 'Sensitive records can be leaked, changed, or deleted.',
      fix: 'Use parameterized queries and validate untrusted input on the server.',
      fix_code: "const query = 'SELECT * FROM users WHERE id = ?';\ndb.execute(query, [userId]);",
      attack_scenario:
        'An attacker submits a crafted login payload and extracts user account data from the database.',
      fix_effort: 'Moderate',
      impact: {
        before: 'User input can change query behavior and expose protected data.',
        after: 'Query parameters isolate user input, preventing SQL command injection.',
      },
      confidence: 'Medium',
    };
  }

  if (normalized.includes('xss')) {
    return {
      title,
      insight: 'Allows injected scripts to run in a victim browser context.',
      risk: 'Can lead to cookie theft, account takeover, and malicious redirects.',
      fix: 'Escape output by context and sanitize untrusted content before rendering.',
      fix_code: 'sanitize(input);',
      attack_scenario:
        'A malicious script is posted in user content and executes whenever another user opens the page.',
      fix_effort: 'Moderate',
      impact: {
        before: 'Browser executes untrusted content as active script.',
        after: 'Sanitized and escaped output is rendered as text, not executable code.',
      },
      confidence: 'Medium',
    };
  }

  if (normalized.includes('open port') || normalized.includes('port')) {
    return {
      title,
      insight: 'Exposes unnecessary services to the internet.',
      risk: 'Attackers can scan and target exposed endpoints for unauthorized access.',
      fix: 'Close unused ports and restrict network access to trusted sources only.',
      fix_code: 'allowFromTrustedIPsOnly();\ncloseUnusedPorts();',
      attack_scenario:
        'Automated scanners discover an exposed admin service and brute-force weak credentials.',
      fix_effort: 'Easy',
      impact: {
        before: 'More externally reachable services increase attack surface.',
        after: 'Only required services remain reachable, reducing exploit opportunities.',
      },
      confidence: 'Medium',
    };
  }

  return {
    title,
    insight: 'This issue indicates a security weakness that can be abused if left unresolved.',
    risk: 'It may enable data exposure, service disruption, or privilege escalation.',
    fix: 'Apply least-privilege controls, tighten configuration, and validate untrusted inputs.',
    fix_code: 'validateInput(request.body);\napplySecurityHeaders(response);',
    attack_scenario:
      'An attacker combines this weakness with reconnaissance to increase access and impact.',
    fix_effort: mapFixEffort(normalized),
    impact: {
      before: 'The system remains easier to probe and exploit.',
      after: 'Mitigations lower exploitability and improve defensive posture.',
    },
    confidence: 'Medium',
  };
}

function extractJsonBlock(text: string): string {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');

  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No JSON object found in model response');
  }

  return text.slice(first, last + 1);
}

function parseAiExplanation(rawText: string, title: string, vulnerabilityType: string): SecurityExplainer {
  const parsed = JSON.parse(extractJsonBlock(rawText)) as Partial<SecurityExplainer>;

  if (
    typeof parsed.insight !== 'string' ||
    typeof parsed.risk !== 'string' ||
    typeof parsed.fix !== 'string'
  ) {
    throw new Error('Invalid explanation fields from model');
  }

  const normalized = detectNormalizedType(vulnerabilityType);

  return {
    title,
    insight: parsed.insight.trim(),
    risk: parsed.risk.trim(),
    fix: parsed.fix.trim(),
    fix_code:
      typeof parsed.fix_code === 'string' && parsed.fix_code.trim().length > 0
        ? parsed.fix_code.trim()
        : undefined,
    attack_scenario:
      typeof parsed.attack_scenario === 'string' && parsed.attack_scenario.trim().length > 0
        ? parsed.attack_scenario.trim()
        : undefined,
    fix_effort:
      parsed.fix_effort === 'Easy' || parsed.fix_effort === 'Moderate' || parsed.fix_effort === 'Advanced'
        ? parsed.fix_effort
        : mapFixEffort(normalized),
    impact:
      parsed.impact &&
      typeof parsed.impact.before === 'string' &&
      typeof parsed.impact.after === 'string'
        ? {
            before: parsed.impact.before.trim(),
            after: parsed.impact.after.trim(),
          }
        : undefined,
    confidence: 'High',
  };
}

function isValidRequestBody(value: unknown): value is { vulnerabilityType: string; title: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.vulnerabilityType === 'string' && typeof candidate.title === 'string';
}

async function getAiExplanation(vulnerabilityType: string, title: string): Promise<SecurityExplainer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise security explainer for beginners. Return strict JSON only with no markdown.',
          },
          {
            role: 'user',
            content: [
              'Explain the following security vulnerability in simple terms:',
              '',
              `Vulnerability: ${vulnerabilityType}`,
              '',
              'Return JSON with:',
              '- insight: what it means',
              '- risk: real-world consequence',
              '- fix: how to solve it',
              '- attack_scenario: short real-world attack scenario',
              '- fix_code: short secure code fix snippet (2-4 lines max)',
              '- fix_effort: Easy | Moderate | Advanced',
              '- impact: { before: string, after: string }',
              '',
              'Also generate a short secure code fix example for this vulnerability.',
              'Keep it concise and beginner-friendly.',
            ].join('\n'),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response did not include content');
    }

    return parseAiExplanation(content, title, vulnerabilityType);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidRequestBody(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
      const explanation = await getAiExplanation(body.vulnerabilityType, body.title);
      return NextResponse.json({ explanation, source: 'ai' });
    } catch (error) {
      const explanation = getCachedExplanation(body.vulnerabilityType, body.title);
      logApi('/api/explainer', 'error', {
        fallback: true,
        error: error instanceof Error ? error.message : 'Explainer generation failed',
      });
      return NextResponse.json({ explanation, source: 'cache', fallback: true });
    }
  } catch (error) {
    logApi('/api/explainer', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
