import type { Scenario } from "./scenario-types";

type CachedScenarioSeed = Omit<Scenario, "meta">;

const solutionByType: Record<Scenario["type"], Scenario["solution"]> = {
  phishing: {
    immediate_action:
      "Do not click links or open attachments. Report the message and verify the request using a trusted internal channel.",
    prevention_tips: [
      "Check sender domains and reply-to addresses carefully.",
      "Navigate to sensitive systems through bookmarks, not embedded links.",
      "Report suspicious messages so security can block similar campaigns.",
    ],
    best_practices: [
      "Use phishing-resistant MFA for critical accounts.",
      "Run frequent phishing simulation training.",
      "Apply secure email gateway filtering and URL reputation checks.",
    ],
  },
  smishing: {
    immediate_action:
      "Do not tap links or reply. Block the sender and confirm the request through official apps or verified phone numbers.",
    prevention_tips: [
      "Treat urgent SMS requests as suspicious until verified.",
      "Never share OTP, PIN, or password by text message.",
      "Use official account apps to validate delivery and banking alerts.",
    ],
    best_practices: [
      "Enable security alerts from trusted channels only.",
      "Use device security tools that detect malicious links.",
      "Practice out-of-band verification for account and payment changes.",
    ],
  },
  impersonation: {
    immediate_action:
      "Pause the request, verify identity via a known contact path, and report the impersonation attempt immediately.",
    prevention_tips: [
      "Never share secrets, tokens, or payment data through chat/email requests.",
      "Follow approval workflows even when requests appear to come from leadership.",
      "Use callback verification for high-risk or unusual requests.",
    ],
    best_practices: [
      "Require dual approval for sensitive financial and access actions.",
      "Use identity verification markers and anti-impersonation controls.",
      "Apply least privilege and rotate credentials regularly.",
    ],
  },
  malware: {
    immediate_action:
      "Stop interaction immediately, isolate the device if needed, and notify security for malware triage.",
    prevention_tips: [
      "Only install software and updates from trusted vendor sources.",
      "Avoid running unknown executables or enabling document macros.",
      "Scan suspicious files and links before opening them.",
    ],
    best_practices: [
      "Keep endpoint protection and patching up to date.",
      "Use allowlisting controls for executable files.",
      "Maintain tested backups and incident response playbooks.",
    ],
  },
};

function getSolution(type: Scenario["type"]): Scenario["solution"] {
  const template = solutionByType[type];

  return {
    immediate_action: template.immediate_action,
    prevention_tips: [...template.prevention_tips],
    best_practices: [...template.best_practices],
  };
}

const cachedScenarioSeeds: Record<string, CachedScenarioSeed[]> = {
  "phishing-easy": [
    {
      id: "ph-e-001",
      type: "phishing",
      difficulty: "easy",
      interface: "email",
      title: "Payroll Update Required",
      content:
        "From: payroll-team@corp-payroll-alerts.com\nSubject: Action Required - Verify bank details\n\nWe detected an issue in your salary account. Confirm your bank details within 2 hours to avoid delayed payment: http://corp-payroll-verify-login.com",
      options: [
        "Click the link and verify quickly",
        "Reply with account details",
        "Report as phishing and verify through official HR portal",
      ],
      correct_action: "Report as phishing and verify through official HR portal",
      red_flags: [
        "Urgent deadline pressure",
        "Lookalike domain name",
        "Non-company verification link",
      ],
      explanation: {
        hacker: "Urgency plus salary anxiety increases click-through rates.",
        user: "Never verify payroll data from email links. Use internal portals.",
        developer: "Add domain allowlists and banner warnings for external senders.",
      },
      solution: getSolution("phishing"),
    },
    {
      id: "ph-e-002",
      type: "phishing",
      difficulty: "easy",
      interface: "email",
      title: "Mailbox Quota Warning",
      content:
        "From: it-support@securemail-quota.net\nSubject: Mailbox full notice\n\nYour mailbox is 99% full. Validate credentials to prevent account suspension: https://mailbox-space-check.net/login",
      options: [
        "Sign in from the link to clear space",
        "Forward to teammates",
        "Ignore link, check mailbox status from official company tools",
      ],
      correct_action: "Ignore link, check mailbox status from official company tools",
      red_flags: [
        "Generic support sender",
        "Credential collection request",
        "Unrecognized domain",
      ],
      explanation: {
        hacker: "Quota messages are common and believable in busy organizations.",
        user: "Use bookmarked IT pages instead of embedded links.",
        developer: "Enable anti-phishing scanning and suspicious URL rewriting checks.",
      },
      solution: getSolution("phishing"),
    },
  ],
  "phishing-medium": [
    {
      id: "ph-m-001",
      type: "phishing",
      difficulty: "medium",
      interface: "email",
      title: "Vendor Invoice Mismatch",
      content:
        "From: billing@trusted-vendor.com\nSubject: Revised invoice attached\n\nHi, AP team flagged mismatch. Review and approve attached file immediately: invoice-April-2026.xlsm",
      options: [
        "Open attachment and enable macros",
        "Verify request with known vendor contact before opening",
        "Share attachment in public channel",
      ],
      correct_action: "Verify request with known vendor contact before opening",
      red_flags: [
        "Unexpected macro-enabled attachment",
        "Process pressure from finance context",
        "No ticket/reference number",
      ],
      explanation: {
        hacker: "Financial workflow context lowers suspicion and encourages fast action.",
        user: "Out-of-band verification blocks most invoice fraud attempts.",
        developer: "Block macro attachments and sandbox file previews.",
      },
      solution: getSolution("phishing"),
    },
    {
      id: "ph-m-002",
      type: "phishing",
      difficulty: "medium",
      interface: "website",
      title: "SSO Session Expired Clone",
      content:
        "You are redirected to a login page that looks identical to your company SSO. URL: https://login-company-sso.co/session/reauth",
      options: [
        "Log in because UI looks correct",
        "Close page and access SSO from known company bookmark",
        "Disable browser protection and continue",
      ],
      correct_action: "Close page and access SSO from known company bookmark",
      red_flags: [
        "Typosquatted domain",
        "Unexpected reauthentication prompt",
        "URL does not match organization identity provider",
      ],
      explanation: {
        hacker: "Clone pages steal credentials even when visual design is perfect.",
        user: "Trust URL and certificate identity, not page appearance.",
        developer: "Deploy FIDO2/passkeys and phishing-resistant authentication.",
      },
      solution: getSolution("phishing"),
    },
  ],
  "phishing-hard": [
    {
      id: "ph-h-001",
      type: "phishing",
      difficulty: "hard",
      interface: "chat",
      title: "Executive Travel Emergency",
      content:
        "A message in internal chat from a display name matching your CFO asks you to buy urgent gift cards for a client dinner while they are in transit and unable to use corporate card.",
      options: [
        "Buy gift cards and send codes",
        "Ask for callback verification using known executive contact path",
        "Ignore and delete without reporting",
      ],
      correct_action: "Ask for callback verification using known executive contact path",
      red_flags: [
        "Unusual payment method request",
        "Authority pressure",
        "Attempt to bypass normal procurement process",
      ],
      explanation: {
        hacker: "Business email compromise often relies on urgency and hierarchy.",
        user: "High-risk financial asks always require secondary verification.",
        developer: "Add anti-impersonation controls for display-name collisions in chat.",
      },
      solution: getSolution("phishing"),
    },
  ],
  "smishing-easy": [
    {
      id: "sm-e-001",
      type: "smishing",
      difficulty: "easy",
      interface: "sms",
      title: "Package Delivery Fee",
      content:
        "SMS: Your parcel is pending. Pay $1.99 customs fee now: https://fasttrack-delivery-pay.help",
      options: [
        "Pay quickly to avoid delay",
        "Open link in private browser",
        "Do not click; verify delivery via official courier app",
      ],
      correct_action: "Do not click; verify delivery via official courier app",
      red_flags: [
        "Suspicious short-payment lure",
        "Unfamiliar URL",
        "No tracking ID or sender verification",
      ],
      explanation: {
        hacker: "Small fees make victims less cautious and more likely to pay.",
        user: "Check shipment status only from official apps or known sites.",
        developer: "Consider mobile threat defense guidance for high-risk links.",
      },
      solution: getSolution("smishing"),
    },
    {
      id: "sm-e-002",
      type: "smishing",
      difficulty: "easy",
      interface: "sms",
      title: "Bank Account Locked",
      content:
        "SMS: [YourBank] Account locked after unusual login. Unlock now: http://yourbank-security-reset.cc",
      options: [
        "Tap immediately and enter PIN",
        "Call the bank from the number on your card",
        "Reply with OTP to verify identity",
      ],
      correct_action: "Call the bank from the number on your card",
      red_flags: [
        "HTTP link instead of secure domain",
        "Fear-inducing lockout claim",
        "Requests sensitive credentials",
      ],
      explanation: {
        hacker: "Fake lockout alerts trigger panic actions before critical thinking.",
        user: "Never trust numbers or links in suspicious SMS messages.",
        developer: "Expose trusted-contact guidance in user security settings.",
      },
      solution: getSolution("smishing"),
    },
  ],
  "smishing-medium": [
    {
      id: "sm-m-001",
      type: "smishing",
      difficulty: "medium",
      interface: "sms",
      title: "MFA Fatigue Confirmation",
      content:
        "SMS: Security team detected suspicious push requests. Confirm this is your phone by entering the 6-digit code at https://mfa-verify-alerts.com",
      options: [
        "Enter code to secure account",
        "Ignore SMS and report abnormal MFA prompts to security",
        "Forward SMS to coworkers",
      ],
      correct_action: "Ignore SMS and report abnormal MFA prompts to security",
      red_flags: [
        "Social engineering around MFA confusion",
        "Non-corporate verification domain",
        "Unsolicited action request",
      ],
      explanation: {
        hacker: "Attackers exploit MFA fatigue by posing as defenders.",
        user: "Report unexpected MFA activity through official support channels.",
        developer: "Implement number matching and contextual MFA prompts.",
      },
      solution: getSolution("smishing"),
    },
  ],
  "smishing-hard": [
    {
      id: "sm-h-001",
      type: "smishing",
      difficulty: "hard",
      interface: "sms",
      title: "HR Benefit Enrollment Deadline",
      content:
        "SMS from spoofed alphanumeric sender 'HR-PORTAL': Your benefit enrollment closes in 30 minutes. Update election here: https://benefits-update-now.org",
      options: [
        "Complete the form from phone immediately",
        "Open HR system from company intranet and verify enrollment window",
        "Send your employee ID by reply",
      ],
      correct_action: "Open HR system from company intranet and verify enrollment window",
      red_flags: [
        "Spoofed sender identity",
        "Artificial deadline",
        "External benefits URL",
      ],
      explanation: {
        hacker: "Time pressure and HR context bypass standard verification habits.",
        user: "Use trusted internal portals for HR actions.",
        developer: "Add employee communication signing and anti-spoof policies.",
      },
      solution: getSolution("smishing"),
    },
  ],
  "impersonation-easy": [
    {
      id: "im-e-001",
      type: "impersonation",
      difficulty: "easy",
      interface: "chat",
      title: "IT Admin Password Request",
      content:
        "Chat DM: 'Hi this is IT admin. We need your password to fix your VPN issue right now.'",
      options: [
        "Share password in DM",
        "Decline and open support ticket through official helpdesk",
        "Share only part of the password",
      ],
      correct_action: "Decline and open support ticket through official helpdesk",
      red_flags: [
        "Direct password request",
        "Unverified identity",
        "Bypassing ticketing process",
      ],
      explanation: {
        hacker: "Pretending to be IT exploits trust in technical authority.",
        user: "Legitimate IT never asks for passwords in chat.",
        developer: "Integrate verified role badges and warning prompts in messaging.",
      },
      solution: getSolution("impersonation"),
    },
  ],
  "impersonation-medium": [
    {
      id: "im-m-001",
      type: "impersonation",
      difficulty: "medium",
      interface: "email",
      title: "CEO Wire Transfer Request",
      content:
        "From: ceo.office@company-exec-mail.com\nSubject: Confidential transfer\n\nNeed a same-day transfer to close an acquisition. Keep this private and send confirmation once done.",
      options: [
        "Process transfer due to executive request",
        "Verify request through established finance approval workflow",
        "Reply asking for beneficiary details",
      ],
      correct_action: "Verify request through established finance approval workflow",
      red_flags: [
        "Secrecy instruction",
        "Out-of-policy money movement",
        "Lookalike executive email domain",
      ],
      explanation: {
        hacker: "Whaling attacks target employees with payment authority.",
        user: "Follow policy even for high-ranking senders.",
        developer: "Enforce approval-chain controls and anomaly alerts for transfers.",
      },
      solution: getSolution("impersonation"),
    },
  ],
  "impersonation-hard": [
    {
      id: "im-h-001",
      type: "impersonation",
      difficulty: "hard",
      interface: "chat",
      title: "Deepfake Voice Follow-Up",
      content:
        "After a chat request from a project director, you receive a voice note sounding like them asking for immediate repository access token sharing to fix a production outage.",
      options: [
        "Share token to unblock incident",
        "Validate identity through approved incident bridge and rotate token if exposed",
        "Post token in private channel temporarily",
      ],
      correct_action: "Validate identity through approved incident bridge and rotate token if exposed",
      red_flags: [
        "Credential/token sharing request",
        "High-pressure outage pretext",
        "Out-of-band identity ambiguity",
      ],
      explanation: {
        hacker: "Multimodal impersonation increases credibility and urgency.",
        user: "Never share secrets in chat or voice messages.",
        developer: "Use short-lived tokens and incident workflows that avoid manual secret handling.",
      },
      solution: getSolution("impersonation"),
    },
  ],
  "malware-medium": [
    {
      id: "mw-m-001",
      type: "malware",
      difficulty: "medium",
      interface: "website",
      title: "Fake Browser Update",
      content:
        "A pop-up on a blog says your browser is outdated and prompts download of 'CriticalSecurityPatch.exe' from a third-party mirror.",
      options: [
        "Download and run patch",
        "Close page and update browser from official vendor settings",
        "Disable antivirus and run installer faster",
      ],
      correct_action: "Close page and update browser from official vendor settings",
      red_flags: [
        "Executable from untrusted site",
        "Scare tactics",
        "Unsolicited software prompt",
      ],
      explanation: {
        hacker: "Fake updates are common malware delivery vectors.",
        user: "Install updates only through native app or vendor channels.",
        developer: "Use endpoint controls to block unsigned or untrusted binaries.",
      },
      solution: getSolution("malware"),
    },
  ],
};

export const cachedScenarios: Record<string, Scenario[]> = Object.fromEntries(
  Object.entries(cachedScenarioSeeds).map(([key, scenarios]) => [
    key,
    scenarios.map((scenario) => ({
      ...scenario,
      meta: {
        source: "cached",
        mode: "manual",
      },
    })),
  ])
) as Record<string, Scenario[]>;

export const scenarioPool: Scenario[] = Object.values(cachedScenarios).flat();
