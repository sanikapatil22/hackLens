import type { SecurityFinding } from '@/types/security';

export type SecurityExplainer = {
  title: string;
  insight: string;
  risk: string;
  fix: string;
  attack_scenario?: string;
  fix_effort?: 'Easy' | 'Moderate' | 'Advanced';
  impact?: {
    before: string;
    after: string;
  };
  confidence?: 'High' | 'Medium' | 'Low';
};

type ExplainerMode = 'ai' | 'cache';

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function detectVulnerabilityType(finding: SecurityFinding): string {
  const candidates = [
    finding.riskType,
    finding.type,
    finding.title,
    finding.description,
    finding.observed,
  ]
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .join(' ')
    .toLowerCase();

  if (candidates.includes('sql') || candidates.includes('sqli')) {
    return 'sql injection';
  }

  if (candidates.includes('xss') || candidates.includes('cross-site scripting')) {
    return 'xss';
  }

  if (candidates.includes('open port') || candidates.includes('port')) {
    return 'open ports';
  }

  if (candidates.includes('https') || candidates.includes('tls') || candidates.includes('hsts')) {
    return 'transport security';
  }

  if (candidates.includes('header') || candidates.includes('misconfiguration')) {
    return 'security misconfiguration';
  }

  return normalizeText(finding.title || 'security issue');
}

export function getCachedExplanation(vulnerabilityType: string, title: string): SecurityExplainer {
  const normalized = normalizeText(vulnerabilityType);

  if (normalized.includes('sql injection') || normalized.includes('sqli')) {
    return {
      title,
      insight: 'Allows attackers to send crafted input that changes database queries.',
      risk: 'Sensitive data can be leaked, modified, or deleted.',
      fix: 'Use parameterized queries and strict server-side input validation.',
      attack_scenario:
        'A login form accepts crafted SQL payloads, letting an attacker dump user records from the database.',
      fix_effort: 'Moderate',
      impact: {
        before: 'Database queries can be manipulated by attacker-controlled input.',
        after: 'Queries are parameterized, so malicious input is treated as plain data.',
      },
      confidence: 'Medium',
    };
  }

  if (normalized.includes('xss')) {
    return {
      title,
      insight: 'Allows attackers to inject scripts that run in a victim browser.',
      risk: 'Can lead to session hijacking, account abuse, or data theft.',
      fix: 'Sanitize and escape untrusted input before rendering it in the page.',
      attack_scenario:
        'A comment field stores malicious JavaScript that executes for every visitor and steals active session tokens.',
      fix_effort: 'Moderate',
      impact: {
        before: 'User content can execute scripts in other users’ browsers.',
        after: 'Untrusted content is escaped, so injected scripts no longer execute.',
      },
      confidence: 'Medium',
    };
  }

  if (normalized.includes('open ports') || normalized.includes('port')) {
    return {
      title,
      insight: 'Exposes network services to external access.',
      risk: 'Increases chances of unauthorized access and targeted attacks.',
      fix: 'Close unused ports and restrict access with firewall rules.',
      attack_scenario:
        'An internet-facing admin port is discovered by scanners and brute-forced until unauthorized access is gained.',
      fix_effort: 'Easy',
      impact: {
        before: 'Unnecessary services remain exposed to internet scanning and probing.',
        after: 'Only required services are reachable, shrinking the external attack surface.',
      },
      confidence: 'Medium',
    };
  }

  if (normalized.includes('transport security') || normalized.includes('https') || normalized.includes('hsts')) {
    return {
      title,
      insight: 'Data transport is not fully protected between users and the site.',
      risk: 'Attackers may intercept credentials or sensitive traffic.',
      fix: 'Enforce HTTPS everywhere and configure HSTS with strong TLS settings.',
      attack_scenario:
        'On public Wi-Fi, a man-in-the-middle captures plaintext login traffic from users visiting the site over HTTP.',
      fix_effort: 'Easy',
      impact: {
        before: 'Traffic can be intercepted or modified on untrusted networks.',
        after: 'Encrypted transport prevents passive interception and tampering in transit.',
      },
      confidence: 'Medium',
    };
  }

  if (normalized.includes('header') || normalized.includes('misconfiguration')) {
    return {
      title,
      insight: 'Important browser-side protections are missing or weak.',
      risk: 'Can make common attacks easier to execute against users.',
      fix: 'Apply recommended security headers and harden default server settings.',
      attack_scenario:
        'Without strict browser headers, injected content is executed more easily during a reflected XSS attempt.',
      fix_effort: 'Easy',
      impact: {
        before: 'Browser protections are weaker, increasing exploit reliability.',
        after: 'Security headers enforce safer browser behavior and reduce exploit paths.',
      },
      confidence: 'Medium',
    };
  }

  return {
    title,
    insight: 'This indicates a security weakness that could be abused if unaddressed.',
    risk: 'May impact confidentiality, integrity, or availability of your system.',
    fix: 'Apply least-privilege controls, validate inputs, and patch configuration gaps.',
    attack_scenario:
      'An attacker chains this weakness with reconnaissance to escalate access and move deeper into the application.',
    fix_effort: 'Moderate',
    impact: {
      before: 'The weakness can be combined with other issues to expand attacker access.',
      after: 'Mitigations reduce exploitability and limit attacker movement.',
    },
    confidence: 'Medium',
  };
}

async function getBackendExplanation(vulnerabilityType: string, title: string): Promise<SecurityExplainer> {
  const response = await fetch('/api/explainer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vulnerabilityType,
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Explainer API failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    explanation?: SecurityExplainer;
  };

  if (!payload.explanation || typeof payload.explanation.insight !== 'string') {
    throw new Error('Explainer API payload is invalid');
  }

  return payload.explanation;
}

export async function buildSecurityExplanation(
  finding: SecurityFinding,
  requestedMode: ExplainerMode
): Promise<SecurityExplainer> {
  const title = finding.title;
  const vulnerabilityType = detectVulnerabilityType(finding);

  if (requestedMode === 'cache') {
    return getCachedExplanation(vulnerabilityType, title);
  }

  try {
    return await getBackendExplanation(vulnerabilityType, title);
  } catch {
    return getCachedExplanation(vulnerabilityType, title);
  }
}
