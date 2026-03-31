import { NextRequest, NextResponse } from 'next/server';

interface AttackSimulation {
  vulnerabilityId: string;
  vulnerabilityType: string;
  url: string;
  demonstration: {
    title: string;
    scenario: string;
    steps: Array<{
      stepNumber: number;
      action: string;
      payload?: string;
      result: string;
      impact: string;
    }>;
  };
  attackPlayground: {
    formFields: Array<{
      name: string;
      type: string;
      placeholder: string;
      vulnerable: boolean;
    }>;
    testPayloads: Array<{
      name: string;
      payload: string;
      description: string;
    }>;
  };
  visualization: {
    before: string;
    after: string;
    attackSurface: string;
  };
}

const ATTACK_SIMULATIONS: Record<string, (url: string) => AttackSimulation> = {
  'no-https': (url: string) => ({
    vulnerabilityId: 'no-https',
    vulnerabilityType: 'Missing HTTPS Encryption',
    url,
    demonstration: {
      title: 'Man-in-the-Middle Attack on Unencrypted HTTP',
      scenario: 'An attacker on the same WiFi network intercepts login credentials sent over HTTP.',
      steps: [
        {
          stepNumber: 1,
          action: 'Attacker connects to same WiFi network as victim',
          result: 'Network traffic becomes visible to attacker',
          impact: 'All unencrypted data can be captured',
        },
        {
          stepNumber: 2,
          action: 'Victim visits your site (HTTP, not HTTPS)',
          payload: 'User visits http://example.com and sees login form',
          result: 'Login form loads without encryption',
          impact: 'Form data will be sent in plaintext',
        },
        {
          stepNumber: 3,
          action: 'Victim enters credentials and submits form',
          payload: 'username=john&password=secret123',
          result: 'Credentials transmitted in plaintext over network',
          impact: 'Attacker captures credentials instantly',
        },
        {
          stepNumber: 4,
          action: 'Attacker uses captured credentials',
          result: 'Full account takeover achieved',
          impact: 'Complete unauthorized access to victim account',
        },
      ],
      
    },
    attackPlayground: {
      formFields: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Enter username',
          vulnerable: true,
        },
        {
          name: 'password',
          type: 'password',
          placeholder: 'Enter password',
          vulnerable: true,
        },
      ],
      testPayloads: [
        {
          name: 'Normal Login',
          payload: 'username=admin&password=mypassword',
          description: 'Regular login credentials sent in plaintext',
        },
        {
          name: 'Credential Theft Simulation',
          payload: 'username=victim@email.com&password=P@ssw0rd123',
          description: 'Shows how credentials are captured unencrypted',
        },
      ],
    },
    visualization: {
      before: 'HTTP://example.com (Plaintext) → Attacker sees: username=john password=secret',
      after: 'HTTPS://example.com (Encrypted) → Attacker sees: [Encrypted TLS handshake]',
      attackSurface: 'Every user login, API call, and form submission',
    },
  }),

  'missing-headers': (url: string) => ({
    vulnerabilityId: 'missing-headers',
    vulnerabilityType: 'Missing Security Headers',
    url,
    demonstration: {
      title: 'Clickjacking Attack Without X-Frame-Options',
      scenario: 'Attacker embeds your site in a hidden frame to trick users into performing unwanted actions.',
      steps: [
        {
          stepNumber: 1,
          action: 'Attacker creates malicious website',
          result: 'Creates fake site that embeds your site in invisible iframe',
          impact: 'Your site is now under attacker control',
        },
        {
          stepNumber: 2,
          action: 'Victim visits attacker site',
          result: 'Victim sees attacker content, unaware of hidden iframe',
          impact: 'Victim is tricked into interacting with your site',
        },
        {
          stepNumber: 3,
          action: 'Victim clicks on attacker button (e.g., "Click to win prize")',
          result: 'Click actually triggers action on your site (hidden frame)',
          impact: 'Unintended action executed on victim account',
        },
        {
          stepNumber: 4,
          action: 'Attacker transfers funds / changes password',
          result: 'Victim realizes too late what happened',
          impact: 'Account compromised through clickjacking',
        },
      ],
    },
    attackPlayground: {
      formFields: [
        {
          name: 'transferAmount',
          type: 'text',
          placeholder: 'Amount to transfer',
          vulnerable: true,
        },
        {
          name: 'toAccount',
          type: 'text',
          placeholder: 'Recipient account',
          vulnerable: true,
        },
      ],
      testPayloads: [
        {
          name: 'Hidden Frame Attack',
          payload: '<iframe src="https://bank.com/transfer?amount=1000&to=attacker" style="display:none"></iframe>',
          description: 'Iframe that performs action without user knowing',
        },
        {
          name: 'Clickjacking Overlay',
          payload: '<button style="opacity:0">Hidden Button</button>',
          description: 'Invisible button positioned over legitimate button',
        },
      ],
    },
    visualization: {
      before: 'Site can be framed → Attacker embeds → Clickjacking possible',
      after: 'X-Frame-Options: DENY → Site cannot be framed → Clickjacking prevented',
      attackSurface: 'Any user action (transfers, password changes, admin actions)',
    },
  }),

  'server-banner': (url: string) => ({
    vulnerabilityId: 'server-banner',
    vulnerabilityType: 'Server Banner Disclosure',
    url,
    demonstration: {
      title: 'Information Disclosure Leading to Targeted Exploits',
      scenario: 'Attacker uses server version info to find and exploit known vulnerabilities.',
      steps: [
        {
          stepNumber: 1,
          action: 'Attacker scans your HTTP headers',
          payload: 'curl -i https://example.com | grep Server',
          result: 'Discovers: Apache/2.4.1',
          impact: 'Attacker now knows exact server version',
        },
        {
          stepNumber: 2,
          action: 'Attacker searches for known vulnerabilities',
          result: 'Finds CVE-2024-1234 affecting Apache 2.4.1',
          impact: 'Exploit code is publicly available',
        },
        {
          stepNumber: 3,
          action: 'Attacker downloads and prepares exploit',
          result: 'Tailored exploit for your exact server version',
          impact: 'Exploit is optimized for your infrastructure',
        },
        {
          stepNumber: 4,
          action: 'Attacker runs exploit',
          result: 'Remote Code Execution achieved',
          impact: 'Full server compromise',
        },
      ],
    },
    attackPlayground: {
      formFields: [
        {
          name: 'targetUrl',
          type: 'text',
          placeholder: 'https://example.com',
          vulnerable: true,
        },
      ],
      testPayloads: [
        {
          name: 'Server Enumeration',
          payload: 'curl -i -H "User-Agent: Mozilla" targetUrl',
          description: 'Reveals Server header and version info',
        },
        {
          name: 'CVE Search',
          payload: 'nmap --script http-server-header targetUrl',
          description: 'Advanced enumeration to find exploitable versions',
        },
      ],
    },
    visualization: {
      before: 'Server: Apache/2.4.1 (Exposed) → CVE-2024-1234 available → Easy exploitation',
      after: 'Server: (Hidden/Generic) → Attacker cannot find version → Exploitation harder',
      attackSurface: 'Every connection reveals server details',
    },
  }),

  'no-compression': (url: string) => ({
    vulnerabilityId: 'no-compression',
    vulnerabilityType: 'Missing Content Compression',
    url,
    demonstration: {
      title: 'Performance Attack: Bandwidth Exhaustion',
      scenario: 'Attacker exploits uncompressed responses to launch DoS or bandwidth exhaustion attacks.',
      steps: [
        {
          stepNumber: 1,
          action: 'Attacker identifies large uncompressed responses',
          result: '1MB response without compression = 1MB per request',
          impact: 'Large bandwidth usage per request',
        },
        {
          stepNumber: 2,
          action: 'Attacker makes many rapid requests',
          payload: 'for i in {1..10000}; do curl https://example.com/large-page; done',
          result: 'Each request uses full 1MB uncompressed',
          impact: 'Total: 10GB bandwidth consumed quickly',
        },
        {
          stepNumber: 3,
          action: 'Server bandwidth limit reached',
          result: 'Site becomes slow or offline',
          impact: 'Denial of Service for legitimate users',
        },
        {
          stepNumber: 4,
          action: 'Legitimate users experience poor performance',
          result: 'Site appears broken or unresponsive',
          impact: 'User frustration and lost business',
        },
      ],
    },
    attackPlayground: {
      formFields: [
        {
          name: 'pageSize',
          type: 'text',
          placeholder: 'Page size in MB',
          vulnerable: true,
        },
        {
          name: 'requestCount',
          type: 'text',
          placeholder: 'Number of requests',
          vulnerable: true,
        },
      ],
      testPayloads: [
        {
          name: 'Bandwidth DoS',
          payload: '1MB uncompressed × 10000 requests = 10GB data transfer',
          description: 'Shows how uncompressed content enables DoS',
        },
        {
          name: 'Compression Efficiency',
          payload: '1MB uncompressed vs 200KB compressed (80% reduction)',
          description: 'Demonstrates impact of gzip compression',
        },
      ],
    },
    visualization: {
      before: 'No Compression: 1MB → 1MB × 10000 = 10GB total',
      after: 'Gzip Enabled: 1MB → 200KB × 10000 = 2GB total (80% savings)',
      attackSurface: 'Every page load, API response, and asset transfer',
    },
  }),
};

export async function POST(request: NextRequest) {
  try {
    const { vulnerabilityId, url } = await request.json();

    if (!vulnerabilityId || !url) {
      return NextResponse.json(
        { error: 'vulnerabilityId and url are required' },
        { status: 400 }
      );
    }

    const simulationGenerator = ATTACK_SIMULATIONS[vulnerabilityId];

    if (!simulationGenerator) {
      return NextResponse.json(
        { error: `No simulation available for ${vulnerabilityId}` },
        { status: 404 }
      );
    }

    const simulation = simulationGenerator(url);

    return NextResponse.json({
      success: true,
      simulation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate attack simulation' },
      { status: 500 }
    );
  }
}
