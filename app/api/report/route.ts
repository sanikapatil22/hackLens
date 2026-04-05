import { NextRequest, NextResponse } from 'next/server';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 7000;

type ReportInput = {
  vulnerabilities: Array<{
    id: string;
    title: string;
    severity: string;
    category?: string;
    fix?: string;
    impact?: string;
  }>;
  explanations?: Record<string, {
    insight?: string;
    risk?: string;
    fix?: string;
  }>;
  userProfile?: {
    weak_areas?: string[];
    strengths?: string[];
    behavior_pattern?: string;
    avg_score?: number;
  };
};

type ReportResponse = {
  summary: string;
  vulnerabilities: Array<{
    title: string;
    severity: string;
    priority: 'High' | 'Medium' | 'Low';
    risk: string;
    fix: string;
  }>;
  recommendations: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSeverity(value: string): string {
  return value.toLowerCase().trim();
}

function priorityFromSeverity(severity: string): 'High' | 'Medium' | 'Low' {
  const normalized = normalizeSeverity(severity);
  if (normalized === 'critical' || normalized === 'high') {
    return 'High';
  }

  if (normalized === 'medium') {
    return 'Medium';
  }

  return 'Low';
}

function buildCachedReport(input: ReportInput): ReportResponse {
  const vulnerabilities = (input.vulnerabilities ?? []).map((item) => {
    const explanation = input.explanations?.[item.id];
    return {
      title: item.title,
      severity: item.severity,
      priority: priorityFromSeverity(item.severity),
      risk: explanation?.risk || item.impact || 'Potential security impact if exploited.',
      fix: explanation?.fix || item.fix || 'Apply secure defaults and validate all untrusted input.',
    };
  });

  const highCount = vulnerabilities.filter((item) => item.priority === 'High').length;
  const mediumCount = vulnerabilities.filter((item) => item.priority === 'Medium').length;
  const weakAreas = input.userProfile?.weak_areas ?? [];

  const summary = [
    `Detected ${vulnerabilities.length} vulnerabilities (${highCount} high priority, ${mediumCount} medium priority).`,
    weakAreas.length > 0
      ? `Prioritize remediation in user focus areas: ${weakAreas.join(', ')}.`
      : 'Prioritize remediation by severity and exploitability.',
  ].join(' ');

  const recommendations: string[] = [
    'Remediate all High priority issues first and retest after fixes.',
    'Apply defense-in-depth controls: validation, output encoding, and least privilege.',
    'Establish recurring security reviews to prevent regression.',
  ];

  if (weakAreas.length > 0) {
    recommendations.push(`Add targeted practice for weak areas: ${weakAreas.join(', ')}.`);
  }

  return {
    summary,
    vulnerabilities,
    recommendations,
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

function parseAiReport(content: string): ReportResponse {
  const parsed = JSON.parse(extractJsonBlock(content)) as Partial<ReportResponse>;

  if (
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.vulnerabilities) ||
    !Array.isArray(parsed.recommendations)
  ) {
    throw new Error('Invalid report payload from model');
  }

  const vulnerabilities = parsed.vulnerabilities
    .filter((item): item is ReportResponse['vulnerabilities'][number] => {
      if (!isObject(item)) {
        return false;
      }

      return (
        typeof item.title === 'string' &&
        typeof item.severity === 'string' &&
        typeof item.priority === 'string' &&
        typeof item.risk === 'string' &&
        typeof item.fix === 'string'
      );
    })
    .map((item) => ({
      title: item.title,
      severity: item.severity,
      priority: item.priority === 'High' || item.priority === 'Medium' || item.priority === 'Low'
        ? item.priority
        : priorityFromSeverity(item.severity),
      risk: item.risk,
      fix: item.fix,
    }));

  const recommendations = parsed.recommendations
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);

  if (vulnerabilities.length === 0 || recommendations.length === 0) {
    throw new Error('AI report missing required sections');
  }

  return {
    summary: parsed.summary.trim(),
    vulnerabilities,
    recommendations,
  };
}

async function buildAiReport(input: ReportInput): Promise<ReportResponse> {
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
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are a concise cybersecurity reporting assistant. Return strict JSON only.',
          },
          {
            role: 'user',
            content: [
              'Generate a structured cybersecurity report including vulnerabilities, risks, fixes, and priority.',
              'Return JSON with exactly these fields:',
              '- summary: string',
              '- vulnerabilities: array of { title, severity, priority, risk, fix }',
              '- recommendations: string[]',
              '',
              `Input: ${JSON.stringify(input)}`,
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
      throw new Error('Missing AI report content');
    }

    return parseAiReport(content);
  } finally {
    clearTimeout(timeout);
  }
}

function isValidReportInput(value: unknown): value is ReportInput {
  if (!isObject(value)) {
    return false;
  }

  return Array.isArray(value.vulnerabilities);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidReportInput(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
      const report = await buildAiReport(body);
      return NextResponse.json(report);
    } catch {
      const report = buildCachedReport(body);
      return NextResponse.json(report);
    }
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
