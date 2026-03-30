import { SecurityFinding } from '@/types/security';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { html, fileName } = await req.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    const findings: SecurityFinding[] = [];

    // Check for inline scripts
    if (/<script[^>]*>[\s\S]*?<\/script>/i.test(html)) {
      findings.push({
        id: 'inline-scripts',
        title: 'Inline JavaScript Found',
        severity: 'medium',
        category: 'Code Quality',
        observed: 'The HTML file contains inline <script> tags with JavaScript code.',
        hackerPerspective:
          'Inline scripts are harder to audit and can potentially execute malicious code. If this file is served from an untrusted source or modified in transit, arbitrary code could run.',
        impact:
          'Attackers could inject malicious JavaScript to steal data, redirect users, or perform actions in the users browser.',
        fix: 'Move JavaScript to separate .js files and load them with proper CSP (Content Security Policy) headers. Use script src="..." instead of inline code.',
        codeExample: {
          vulnerable: `<html>
  <body>
    <script>
      // Inline JavaScript - harder to audit
      function sendData() { /* ... */ }
    </script>
  </body>
</html>`,
          fixed: `<html>
  <body>
    <script src="/js/app.js"></script>
  </body>
</html>`,
          explanation:
            'External scripts can be audited, versioned, and cached. They allow for Content Security Policy restrictions and better code organization.',
        },
        eli5: {
          simple:
            'Inline scripts are like having code written directly on your page. External scripts are like having code in a library you reference.',
          analogy:
            'Inline = writing instructions in the book itself. External = reading instructions from a separate manual.',
          example:
            'Inline: <script>alert("test")</script> vs External: <script src="test.js"></script>',
        },
        hackerConfidence: {
          exploitDifficulty: 40,
          commonAttackVector: false,
          requiresUserInteraction: false,
          requiresAuthentication: false,
          estimatedSuccessRate: 30,
        },
      });
    }

    // Check for event handlers (onclick, onload, etc)
    if (/on\w+\s*=\s*["'][\s\S]*?["']/i.test(html)) {
      findings.push({
        id: 'event-handlers',
        title: 'Inline Event Handlers Detected',
        severity: 'medium',
        category: 'Code Quality',
        observed: 'HTML elements have inline event handlers (onclick, onload, onmouseover, etc).',
        hackerPerspective:
          'Event handlers in HTML are execution points. If user input can be injected into these handlers, it becomes an XSS vulnerability.',
        impact:
          'Attackers could trigger malicious code on user interactions or page load events.',
        fix: 'Use event listeners in external JavaScript files instead of inline handlers. This allows for proper input validation and separation of concerns.',
        codeExample: {
          vulnerable: `<button onclick="alert('clicked')">Click me</button>`,
          fixed: `<button id="myBtn">Click me</button>
<script>
  document.getElementById('myBtn').addEventListener('click', () => {
    // Handle click safely
  });
</script>`,
          explanation:
            'Event listeners in JavaScript can be more easily validated and secured. They also allow for event delegation and cleaner code organization.',
        },
        eli5: {
          simple:
            'Inline event handlers are like attaching instructions to a button. Event listeners are like having a manager watch buttons and decide what to do.',
          analogy:
            'Inline = instructions written on the button. Listeners = a supervisor monitoring buttons and executing proper procedures.',
          example:
            'Instead of putting code on the button (onclick), add a listener that checks and executes code safely.',
        },
        hackerConfidence: {
          exploitDifficulty: 35,
          commonAttackVector: true,
          requiresUserInteraction: true,
          requiresAuthentication: false,
          estimatedSuccessRate: 50,
        },
      });
    }

    // Check for unescaped output (template variables)
    if (/\{\{[\s\S]*?\}\}|\$\{[\s\S]*?\}/i.test(html)) {
      findings.push({
        id: 'template-variables',
        title: 'Template Variables Detected',
        severity: 'high',
        category: 'Data Output',
        observed: 'HTML contains template variable syntax ({{ }} or ${ }) that might output user data.',
        hackerPerspective:
          'If these variables contain unescaped user input, I can inject HTML/JavaScript. The server might render my malicious code directly into the page.',
        impact:
          'XSS attacks: Attackers can steal cookies, hijack sessions, redirect users, or deface the page.',
        fix: 'Always escape output based on context (HTML escape, URL escape, JavaScript escape). Use templating engines that auto-escape by default.',
        codeExample: {
          vulnerable: `<p>Welcome {{ userName }}</p>
<!-- If userName = "<img src=x onerror='alert(1)'>" -->
<!-- Output becomes vulnerable -->`,
          fixed: `<p>Welcome {{ userName | htmlEscape }}</p>
<!-- OR in JavaScript -->
document.textContent = userName; // Safe for text content`,
          explanation:
            'Escaping converts dangerous characters to their HTML entities. <img> becomes &lt;img&gt; and cannot execute.',
        },
        eli5: {
          simple:
            'Unescaped template variables are like writing user comments directly on your page without checking for bad code.',
          analogy:
            'Unescaped = printing something as-is. Escaped = making dangerous parts harmless before printing.',
          example:
            'User says: "<script>steal data</script>" Unescaped: executes. Escaped: displays as text.',
        },
        hackerConfidence: {
          exploitDifficulty: 15,
          commonAttackVector: true,
          requiresUserInteraction: false,
          requiresAuthentication: false,
          estimatedSuccessRate: 80,
        },
      });
    }

    // Check for forms without CSRF protection
    if (/<form[^>]*method\s*=\s*["']?post["']?[^>]*>/i.test(html)) {
      const formMatch = html.match(/<form[^>]*method\s*=\s*["']?post["']?[^>]*>[\s\S]*?<\/form>/i);
      if (formMatch && !formMatch[0].includes('csrf')) {
        findings.push({
          id: 'missing-csrf',
          title: 'Missing CSRF Protection on Forms',
          severity: 'high',
          category: 'Form Security',
          observed: 'HTML contains POST forms without CSRF tokens or protection.',
          hackerPerspective:
            'I can trick a logged-in user into submitting a malicious form from my website. Since theyre already logged in, the server accepts it.',
          impact:
            'Unauthorized actions performed on behalf of the user: transfers, password changes, account takeover.',
          fix: 'Add CSRF tokens to all POST forms. Server should validate the token matches the session.',
          codeExample: {
            vulnerable: `<form method="POST" action="/transfer">
  <input type="text" name="amount">
  <button>Transfer Money</button>
</form>`,
            fixed: `<form method="POST" action="/transfer">
  <input type="hidden" name="csrf_token" value="abc123xyz">
  <input type="text" name="amount">
  <button>Transfer Money</button>
</form>`,
            explanation:
              'CSRF tokens are unique per session. A hacker cannot know the token, so their forged request fails.',
          },
          eli5: {
            simple:
              'CSRF protection is like a password for forms. Hackers cant trick your bank into processing requests without it.',
            analogy:
              'Without CSRF: A hacker can make a fake check in your name. With CSRF: Only you can authorize transactions.',
            example:
              'Hacker tricks you into visiting evil.com. It tries to send money from your bank account, but fails because it doesnt have the CSRF token.',
          },
          hackerConfidence: {
            exploitDifficulty: 30,
            commonAttackVector: true,
            requiresUserInteraction: true,
            requiresAuthentication: false,
            estimatedSuccessRate: 70,
          },
        });
      }
    }

    // Check for deprecated or dangerous HTML elements
    if (/<(frame|iframe|object|embed)[^>]*>/i.test(html)) {
      findings.push({
        id: 'deprecated-elements',
        title: 'Potentially Dangerous HTML Elements',
        severity: 'medium',
        category: 'HTML Practices',
        observed: 'HTML uses deprecated or high-risk elements like <frame>, <iframe>, <object>, or <embed>.',
        hackerPerspective:
          'These elements can load external content. If I control the src attribute or it comes from user input, I can load a malicious site.',
        impact:
          'Content injection, clickjacking, cross-site attacks, or execution of malicious code.',
        fix: 'Avoid deprecated elements. Use modern alternatives. If using iframes, set proper sandbox attributes and Content Security Policy.',
        codeExample: {
          vulnerable: `<iframe src="https://user-controlled.com"></iframe>
<object data="user-input.swf"></object>`,
          fixed: `<iframe src="trusted-source.com" sandbox="allow-scripts"></iframe>
<!-- Use sandboxing and CSP headers -->`,
          explanation:
            'Sandbox attribute restricts what an iframe can do. CSP headers prevent unauthorized external content.',
        },
        eli5: {
          simple:
            'Iframes and embeds are windows to other websites. Without controls, a hacker can put a malicious website in that window.',
          analogy:
            'Uncontrolled iframe = leaving your window open to any website. Sandboxed iframe = locking the window but allowing safe features.',
          example:
            'Embed YouTube safely with sandbox. Dont embed untrusted user-provided URLs.',
        },
        hackerConfidence: {
          exploitDifficulty: 45,
          commonAttackVector: false,
          requiresUserInteraction: true,
          requiresAuthentication: false,
          estimatedSuccessRate: 40,
        },
      });
    }

    // Check for missing security headers in meta tags
    const metaTags = html.match(/<meta[^>]*>/gi) || [];
    const hasCSP = metaTags.some(tag => tag.includes('Content-Security-Policy'));

    if (!hasCSP) {
      findings.push({
        id: 'missing-csp',
        title: 'Content Security Policy Missing',
        severity: 'medium',
        category: 'Security Headers',
        observed: 'HTML does not include Content Security Policy meta tag.',
        hackerPerspective:
          'Without CSP, I can inject and execute arbitrary scripts. The browser wont block inline scripts or scripts from any domain.',
        impact:
          'XSS attacks are more likely to succeed. Injected scripts can steal data and compromise the application.',
        fix: 'Add CSP meta tag or header. Start with a strict policy and gradually relax as needed.',
        codeExample: {
          vulnerable: `<!-- No CSP -->
<html>
  <body>
    <script src="any-domain.com"></script>
  </body>
</html>`,
          fixed: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' trusted-cdn.com">`,
          explanation:
            'CSP tells the browser where scripts can load from. Only scripts from whitelisted sources are allowed.',
        },
        eli5: {
          simple:
            'CSP is a bouncer for your website. It only lets trusted scripts enter.',
          analogy:
            'Without CSP: Anyone can walk into your event. With CSP: Only people on the guest list.',
          example:
            'CSP: default-src self = Only load resources from my own website.',
        },
        hackerConfidence: {
          exploitDifficulty: 25,
          commonAttackVector: true,
          requiresUserInteraction: false,
          requiresAuthentication: false,
          estimatedSuccessRate: 65,
        },
      });
    }

    return NextResponse.json({
      fileName,
      findings,
      overallRiskScore: findings.length > 0 ? Math.min(findings.length * 15, 100) : 0,
      summary: `Found ${findings.length} potential security issues in your HTML file.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze HTML: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
