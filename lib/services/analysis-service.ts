import 'server-only';

import type { SecurityFinding } from '@/types/security';
import { log } from '@/lib/server/logger';

const LIGHTWEIGHT_DISCLAIMER =
  'This analysis is based on publicly accessible data and does not guarantee full security. It is intended for educational purposes only.';

function buildPatternFinding(input: {
  id: string;
  type: 'xss' | 'sqli' | 'misconfiguration';
  severity: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium';
  title: string;
  description: string;
  recommendation: string;
}): SecurityFinding {
  return {
    id: input.id,
    type: input.type,
    confidence: input.confidence,
    title: input.title,
    severity: input.severity,
    category: 'hacking',
    description: input.description,
    observed: input.description,
    impact: 'Potential vulnerability pattern detected. Manual verification is recommended.',
    recommendation: input.recommendation,
    fix: input.recommendation,
  };
}

function detectPatternFindings(urlObj: URL, htmlSample: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const html = htmlSample.toLowerCase();

  if (/<script[^>]*>[\s\S]*?<\/script>/i.test(htmlSample)) {
    findings.push(
      buildPatternFinding({
        id: 'pattern-inline-script',
        type: 'xss',
        severity: 'medium',
        confidence: 'medium',
        title: 'Potential Vulnerability: Inline Script Usage',
        description:
          'Possible risk detected: inline script blocks were found, which can increase XSS exposure if user input is rendered unsafely.',
        recommendation:
          'Prefer external scripts with Content Security Policy and strict output encoding for dynamic content.',
      })
    );
  }

  if (/on(click|load|error|mouseover|focus|submit)\s*=\s*["'][^"']*["']/i.test(htmlSample)) {
    findings.push(
      buildPatternFinding({
        id: 'pattern-inline-events',
        type: 'xss',
        severity: 'medium',
        confidence: 'medium',
        title: 'Potential Vulnerability: Inline Event Handlers',
        description:
          'Possible risk detected: inline JavaScript event handlers were found. These can create script injection surfaces in unsafe templates.',
        recommendation:
          'Move inline handlers to external event listeners and enforce CSP to reduce script injection risk.',
      })
    );
  }

  if (/\beval\s*\(/i.test(htmlSample)) {
    findings.push(
      buildPatternFinding({
        id: 'pattern-eval-usage',
        type: 'misconfiguration',
        severity: 'high',
        confidence: 'medium',
        title: 'Potential Vulnerability: eval() Pattern Found',
        description:
          'Possible risk detected: eval() usage pattern identified in page content. Dynamic code execution can be dangerous when influenced by user-controlled data.',
        recommendation:
          'Avoid eval-like execution paths; replace with explicit parsers and strict input validation.',
      })
    );
  }

  if (/<form[^>]*>/i.test(htmlSample) && /<input[^>]*(type\s*=\s*["']?(text|search|email|url|password)["']?)?/i.test(htmlSample)) {
    findings.push(
      buildPatternFinding({
        id: 'pattern-form-input-risk',
        type: 'xss',
        severity: 'low',
        confidence: 'low',
        title: 'Possible Risk: Unsanitized Input Surface',
        description:
          'Potential vulnerability pattern: form input fields were detected. If backend/output encoding is weak, this surface may allow reflected or stored XSS.',
        recommendation:
          'Apply server-side validation, context-aware output encoding, and input normalization on all form fields.',
      })
    );
  }

  const sqliPattern = /('|"|%27|%22)?\s*(or|and)\s+1\s*=\s*1|union\s+select|--|;\s*drop\s+table/i;
  if (sqliPattern.test(urlObj.search) || sqliPattern.test(urlObj.pathname) || sqliPattern.test(html)) {
    findings.push(
      buildPatternFinding({
        id: 'pattern-sqli-hint',
        type: 'sqli',
        severity: 'medium',
        confidence: 'low',
        title: 'Possible Risk: SQL Injection-like Pattern',
        description:
          'Possible risk detected: query-like patterns associated with SQL injection were observed in URL/content context.',
        recommendation:
          'Use parameterized queries, avoid string-concatenated SQL, and validate request input strictly.',
      })
    );
  }

  return findings;
}

export async function performLightweightAnalysis(url: string) {
  try {
    let urlObj: URL;
    try {
      urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      throw new Error('Invalid URL format');
    }

    const findings: SecurityFinding[] = [];

    try {
      const response = await fetch(urlObj.toString(), {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }).catch(() =>
        fetch(urlObj.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        })
      );

      if (!urlObj.protocol.startsWith('https')) {
        findings.push({
          id: 'no-https',
          type: 'misconfiguration',
          confidence: 'medium',
          description: 'Potential vulnerability: the target does not use HTTPS.',
          recommendation: 'Enable HTTPS and redirect all HTTP traffic to HTTPS.',
          category: 'hacking',
          title: 'No HTTPS Encryption',
          severity: 'critical',
          observed: 'Your site is using HTTP instead of HTTPS.',
          hackerPerspective: 'Unencrypted traffic can be intercepted by network attackers.',
          impact: 'Credentials and sensitive user data may be exposed in transit.',
          fix: 'Configure TLS and force HTTPS using redirects and HSTS.',
        });
      }

      const headers = response.headers;
      const headerChecks = [
        {
          name: 'X-Frame-Options',
          id: 'x-frame-options',
          title: 'Missing X-Frame-Options Header',
          severity: 'high' as const,
          observed: 'Potential vulnerability: X-Frame-Options is missing.',
          fix: 'Add X-Frame-Options: SAMEORIGIN or DENY.',
        },
        {
          name: 'X-Content-Type-Options',
          id: 'x-content-type-options',
          title: 'Missing X-Content-Type-Options Header',
          severity: 'low' as const,
          observed: 'Possible risk detected: X-Content-Type-Options is missing.',
          fix: 'Add X-Content-Type-Options: nosniff.',
        },
        {
          name: 'Strict-Transport-Security',
          id: 'hsts',
          title: 'No HSTS Protection',
          severity: 'high' as const,
          observed: 'Potential vulnerability: Strict-Transport-Security header is missing.',
          fix: 'Add Strict-Transport-Security with an appropriate max-age value.',
        },
      ];

      for (const check of headerChecks) {
        if (!headers.get(check.name)) {
          findings.push({
            id: check.id,
            type: 'misconfiguration',
            confidence: 'medium',
            description: check.observed,
            recommendation: check.fix,
            category: 'hacking',
            title: check.title,
            severity: check.severity,
            observed: check.observed,
            impact: 'Possible risk detected due to missing defensive browser header.',
            fix: check.fix,
          });
        }
      }

      const serverHeader = headers.get('server');
      if (serverHeader) {
        findings.push({
          id: 'server-banner',
          type: 'misconfiguration',
          confidence: 'low',
          description: `Possible risk detected: server banner discloses '${serverHeader}'.`,
          recommendation: 'Suppress or generalize server banner headers.',
          category: 'hacking',
          title: 'Server Banner Exposed',
          severity: 'low',
          observed: `Your site is advertising its web server as ${serverHeader}.`,
          impact: 'Exposed server info can assist targeted reconnaissance.',
          fix: 'Hide specific server version strings where possible.',
        });
      }

      let htmlSample = '';
      const contentType = headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        try {
          const htmlResponse = await fetch(urlObj.toString(), {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
          });

          if (htmlResponse.ok) {
            const rawHtml = await htmlResponse.text();
            htmlSample = rawHtml.slice(0, 50000);
          }
        } catch {
          // Keep analysis passive; skip pattern scan if HTML retrieval fails.
        }
      }

      findings.push(...detectPatternFindings(urlObj, htmlSample));

      if (!headers.get('content-encoding')) {
        findings.push({
          id: 'no-compression',
          category: 'performance',
          riskType: 'Performance Bottleneck',
          title: 'Missing Content Compression',
          severity: 'medium',
          observed: 'Potential issue: content compression may be missing.',
          impact: 'Larger transfer size can degrade page load performance.',
          fix: 'Enable gzip or Brotli compression on server responses.',
        });
      }

      findings.push({
        id: 'privacy-policy',
        category: 'compliance',
        riskType: 'Compliance Issue',
        title: 'Privacy & Compliance',
        severity: 'medium',
        observed: 'Possible risk detected: privacy and compliance posture cannot be verified automatically.',
        impact: 'Missing privacy controls can create legal and trust risks.',
        fix: 'Ensure privacy disclosures, consent handling, and data governance are implemented.',
        confidence: 'low',
        type: 'misconfiguration',
        description:
          'Potential compliance gap identified from passive analysis context; manual review is recommended.',
        recommendation:
          'Review GDPR/CCPA obligations and ensure public privacy documentation is up to date.',
      });
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Could not reach site';

      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed')) {
        throw new Error('Could not reach this website. It might be offline, blocked, or the domain might not exist.');
      }

      throw new Error('Failed to analyze this website');
    }

    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const highCount = findings.filter((f) => f.severity === 'high').length;
    const mediumCount = findings.filter((f) => f.severity === 'medium').length;
    const riskScore = Math.min(
      (criticalCount * 30 + highCount * 15 + mediumCount * 5) / Math.max(findings.length, 1),
      100
    );

    return {
      analysis_type: 'lightweight',
      disclaimer: LIGHTWEIGHT_DISCLAIMER,
      findings,
      overallRiskScore: Math.round(riskScore),
      summary: `Found ${findings.length} security considerations for this site.`,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    log('error', 'service:analysis-service:performLightweightAnalysis_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
