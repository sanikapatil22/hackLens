import { SecurityFinding } from '@/types/security';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let urlObj: URL;
    try {
      urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const findings: SecurityFinding[] = [];

    try {
      // Fetch website
      const response = await fetch(urlObj.toString(), {
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }).catch(() =>
        fetch(urlObj.toString(), {
          method: 'GET',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        }),
      );

      // Check HTTPS
      if (!urlObj.protocol.startsWith('https')) {
        findings.push({
          id: 'no-https',
          category: 'Connection Security',
          title: 'No HTTPS Encryption',
          severity: 'critical',
          observed: `Your site is using HTTP instead of HTTPS. That means data flowing between users and your server is sent in plain text.`,
          hackerPerspective: `I could sit on your WiFi network and intercept login credentials, credit card numbers, or any sensitive data users enter.`,
          impact:
            'Users\' personal data, passwords, and payment info could be stolen. Your site could also be blocked by modern browsers.',
          fix:
            'Get an SSL certificate (many are free!) and redirect all HTTP traffic to HTTPS. It\'s one of the easiest wins for security.',
          codeExample: {
            vulnerable: `# HTTP - Not Encrypted
https://example.com -> redirects to HTTP`,
            fixed: `# HTTPS - Encrypted
https://example.com (direct connection)
# Add HSTS header to prevent fallback`,
            explanation:
              'HTTPS encrypts all communication using TLS/SSL. Even if intercepted, data cannot be read without the key.',
          },
          eli5: {
            simple:
              'HTTPS is like sending a letter in a locked box. HTTP is like sending a postcard that anyone can read.',
            analogy:
              'Think of HTTP as shouting your password in a crowded train. HTTPS is whispering it in a locked room.',
            example:
              'If your bank used HTTP, any hacker on the same WiFi could steal your login password.',
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
              title: 'Join Network',
              description: 'Connect to the same WiFi network',
              action: 'Connect laptop to coffee shop WiFi',
              result: 'Now on the same network',
            },
            {
              step: 2,
              title: 'Capture Traffic',
              description: 'Use packet sniffer to monitor HTTP traffic',
              action: 'Run Wireshark and filter HTTP',
              result: 'See all unencrypted requests',
            },
            {
              step: 3,
              title: 'Extract Data',
              description: 'Find login requests with credentials',
              action: 'Look for username/password in plain text',
              result: 'Obtain credentials instantly',
            },
          ],
        });
      }

      // Check security headers
      const headers = response.headers;
      const headerChecks = [
        {
          name: 'X-Frame-Options',
          id: 'x-frame-options',
          title: 'Missing X-Frame-Options Header',
          severity: 'high' as const,
          observed:
            'The X-Frame-Options header is missing, which means your site could be embedded in another website without your knowledge.',
          hackerPerspective:
            'I could embed your site in an invisible frame on my malicious site and trick users into clicking buttons they think are safe.',
          impact:
            "Your users might accidentally transfer money, change settings, or delete data while thinking they're on your real site.",
          fix:
            'Add the header X-Frame-Options: SAMEORIGIN or DENY. This tells browsers not to let your site be framed by others.',
        },
        {
          name: 'X-Content-Type-Options',
          id: 'x-content-type-options',
          title: 'Missing X-Content-Type-Options Header',
          severity: 'low' as const,
          observed:
            'Without this header, browsers might guess what type of content is being served, which could lead to security issues.',
          hackerPerspective:
            'If you accidentally serve a file with the wrong content type, I might be able to exploit it as a different type of file.',
          impact:
            'In rare cases, this could lead to XSS attacks where attackers inject malicious scripts.',
          fix:
            'Add X-Content-Type-Options: nosniff. This prevents browsers from guessing file types.',
        },
        {
          name: 'Strict-Transport-Security',
          id: 'hsts',
          title: 'No HSTS Protection',
          severity: 'high' as const,
          observed:
            'Strict-Transport-Security (HSTS) header is missing. This means users could accidentally connect via HTTP on their next visit.',
          hackerPerspective:
            "Even if you fix HTTPS, I could wait for users to visit your HTTP version and intercept their first connection.",
          impact:
            'User data could be intercepted on that first visit, bypassing your HTTPS protection.',
          fix:
            'Add Strict-Transport-Security header with a max-age (e.g., max-age=31536000). This forces HTTPS for future visits.',
        },
      ];

      for (const check of headerChecks) {
        if (!headers.get(check.name)) {
          findings.push({
            id: check.id,
            category: 'HTTP Headers',
            title: check.title,
            severity: check.severity,
            observed: check.observed,
            hackerPerspective: check.hackerPerspective,
            impact: check.impact,
            fix: check.fix,
          });
        }
      }

      // Server header check
      const serverHeader = headers.get('server');
      if (serverHeader) {
        findings.push({
          id: 'server-banner',
          category: 'Information Disclosure',
          title: 'Server Banner Exposed',
          severity: 'low',
          observed: `Your site is advertising its web server as "${serverHeader}". This is like putting a sign on your door saying what brand of lock you use.`,
          hackerPerspective:
            'I now know exactly what server software you use, which helps me search for known vulnerabilities specific to that version.',
          impact:
            'Attackers can target known vulnerabilities in that specific server version more easily.',
          fix:
            'Configure your server to hide or obfuscate the Server header. In most web servers, you can set Server header to something generic or remove it.',
          eli5: {
            simple:
              'Server banners are like advertising your lock type. Better to keep it secret.',
            analogy:
              'Disclosing software versions is like telling a burglar exactly which locks you have.',
            example:
              'Apache 2.4.1 reveals known vulnerabilities. Hide it behind a proxy or change the header.',
          },
          hackerConfidence: {
            exploitDifficulty: 20,
            commonAttackVector: false,
            requiresUserInteraction: false,
            requiresAuthentication: false,
            estimatedSuccessRate: 40,
          },
        });
      }
    } catch (fetchError) {
      // If we can't reach the site, it might be blocked or down
      const errorMsg =
        fetchError instanceof Error ? fetchError.message : 'Could not reach site';

      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Could not reach this website. It might be offline, blocked, or the domain might not exist.',
          },
          { status: 400 },
        );
      }
    }

    // Add general recommendations if no critical issues
    if (findings.filter((f) => f.severity === 'critical').length === 0) {
      findings.push({
        id: 'general-security',
        category: 'General Recommendations',
        title: 'Keep Security Updated',
        severity: 'medium',
        observed: 'Security isn\'t a one-time thing—threats and best practices evolve constantly.',
        hackerPerspective:
          'New vulnerabilities are discovered all the time. If you don\'t stay on top of updates, I could find a vulnerability you weren\'t aware of.',
        impact:
          'Outdated software is one of the most common entry points for attackers.',
        fix:
          'Regularly update your software, frameworks, and dependencies. Use security scanning tools. Follow security blogs and newsletters. Conduct regular security audits.',
      });
    }

    // Calculate overall risk score
    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const highCount = findings.filter((f) => f.severity === 'high').length;
    const mediumCount = findings.filter((f) => f.severity === 'medium').length;
    const riskScore = Math.min(
      (criticalCount * 30 + highCount * 15 + mediumCount * 5) / Math.max(findings.length, 1),
      100
    );

    return NextResponse.json({
      findings,
      overallRiskScore: Math.round(riskScore),
      summary: `Found ${findings.length} security considerations for this site.`,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'An error occurred while analyzing the website' },
      { status: 500 },
    );
  }
}
