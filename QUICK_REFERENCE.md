# HackerBuddy Quick Reference

## All Features at a Glance

### Main Tabs
```
🌍 Analyze Website  →  Scan single URL for all risks
⚖️ Compare Sites    →  Compare two URLs side-by-side  [NEW]
📁 Upload HTML      →  Analyze local .html files
⚡ Hack or Safe     →  Gamified security quiz
📚 Learn Security   →  Educational examples
```

### Risk Categories
```
🔓 Security/Hacking     [Red]     - HTTPS, headers, exploits
⚡ Performance          [Orange]  - Compression, speed
📋 Compliance/Privacy   [Purple]  - GDPR, privacy policies
🔎 SEO                  [Blue]    - Search optimization
♿ Accessibility        [Cyan]    - WCAG compliance
```

### Each Finding Shows
```
🔍 What I Noticed          →  Observable issue
😈 How I'd Attack This     →  Exploitation method
💥 What Could Happen       →  Potential impact
🛠 How to Fix It           →  Solution steps
```

### Expandable Content
```
┌─ Code Examples           →  Vulnerable vs secure code
├─ Attack Timeline         →  Step-by-step exploitation
├─ Hacker Confidence       →  0-100% exploit difficulty
├─ ELI5 Explanation        →  Simplified version
├─ Before/After            →  Fix improvement visualization
└─ Try Attack Sandbox      →  Safe payload testing
```

## Quick Start

### For Website Analysis
```
1. Enter URL
2. Click Analyze
3. View findings
4. Filter by category (optional)
5. Click finding to expand
```

### For Comparison
```
1. Enter URL 1
2. Enter URL 2
3. Click Compare
4. View side-by-side results
5. See winner badge
```

### For Learning
```
1. Go to Learn Security tab
2. Browse examples
3. Expand findings
4. Study explanations
5. Review code
```

### For Assessment
```
1. Go to Hack or Safe tab
2. Read scenario
3. Choose SAFE or VULNERABLE
4. Get instant feedback
5. Earn points
```

## Key Metrics Explained

### Overall Risk Score
```
0-25%   ✅ Good       - Minimal issues, good practices
25-50%  ⚠️ Fair       - Some improvements suggested
50-75%  ⚠️ Concerning - Multiple significant issues
75-100% 🔴 Critical   - Urgent attention required
```

### Severity Levels
```
🔴 Critical   - Immediate exploitation possible
🔴 High       - Serious vulnerability
🟡 Medium     - Should be fixed soon
🔵 Low        - Nice to fix
```

### Hacker Confidence
```
Exploit Difficulty  →  0-100 (lower = easier)
Attack Vector       →  Common or rare?
User Interaction    →  Requires user click?
Authentication      →  Requires login?
Success Rate        →  0-100% (higher = likely)
```

## Color Reference

### Risk Categories
```
🔴 Red       = Hacking/Security (Critical)
🟠 Orange    = Performance
🟣 Purple    = Compliance/Privacy
🔵 Blue      = SEO
🔷 Cyan      = Accessibility
```

### Severity
```
🔴 Red       = Critical/High severity
🟡 Yellow    = Medium severity
🔵 Blue      = Low severity
🟢 Green     = Fixed/Safe
```

## Component Guide

### Analyze Results Page
```
┌──────────────────────────────────────────┐
│  📊 ANALYSIS REPORT                      │
│  Risk Score: 45% | Total: 12 findings   │
│  Critical: 0 | High: 2 | Medium: 4      │
├──────────────────────────────────────────┤
│  [All] [🔓 Security] [⚡ Performance]   │
│  [📋 Compliance] [🔎 SEO] [♿ Access]   │
├──────────────────────────────────────────┤
│  ▼ Finding 1 (High)                     │
│  ▼ Finding 2 (Medium)                   │
│  ▼ Finding 3 (Low)                      │
└──────────────────────────────────────────┘
```

### Compare Results Page
```
┌──────────────────────────────────────────┐
│  🏆 SECURITY CHAMPION: site1.com        │
│  45% safer than site2.com               │
├────────────────┬────────────────────────┤
│ site1.com      │ site2.com             │
│ Risk: 35%      │ Risk: 80%             │
│ Critical: 0    │ Critical: 2           │
│ High: 1        │ High: 5               │
│ Medium: 2      │ Medium: 8             │
│ Low: 1         │ Low: 3                │
└────────────────┴────────────────────────┘
```

### Expanded Finding
```
┌──────────────────────────────────────────┐
│ 🔴 Missing HTTPS (High Risk)            │
│ Security | Hacking                       │
├──────────────────────────────────────────┤
│ 🔍 What I Noticed                       │
│ Your site uses HTTP...                   │
├──────────────────────────────────────────┤
│ 😈 How I'd Attack This                  │
│ I'd intercept traffic...                 │
├──────────────────────────────────────────┤
│ 💥 What Could Happen                    │
│ Attackers steal passwords...             │
├──────────────────────────────────────────┤
│ 🛠 How to Fix It                        │
│ Get SSL certificate...                   │
├──────────────────────────────────────────┤
│ [▼] Code Examples  [▼] Attack Timeline  │
│ [▼] Hacker Meter   [▼] ELI5 Explanation│
│ [▼] Before/After   [▼] Try Sandbox     │
└──────────────────────────────────────────┘
```

## Keyboard Shortcuts
```
Tab             → Navigate elements
Enter/Space     → Toggle finding expansion
Ctrl+F          → Find on page (browser)
```

## Mobile Tips
```
✓ Responsive design - Works on all devices
✓ Touch-friendly - Tap to expand findings
✓ Readable - Proper contrast and sizing
✓ Fast - Optimized for mobile networks
```

## API Endpoints

### Website Analysis
```
POST /api/analyze
Body: { "url": "example.com" }
Returns: { findings: [...], overallRiskScore: 45 }
```

### HTML Analysis
```
POST /api/analyze-html
Body: { "html": "<html>...", "fileName": "file.html" }
Returns: { findings: [...], overallRiskScore: 35 }
```

### Scenario Generation
```
POST /api/scenario
Body: { mode?: "demo"|"live", adaptive?: boolean, params?: { type?, difficulty?, context? } }
Returns: { scenario: {...} } or fallback payload
```

### Simulation
```
POST /api/simulate-attack
Body: simulation input payload
Returns: simulation evaluation + progression state
```

### User Tracking
```
GET  /api/user         -> user stats (auth required)
POST /api/user         -> log interaction (auth or guest fallback)
GET  /api/analytics    -> analytics summary (auth required)
```

## Environment Quick Keys

```
OPENAI_API_KEY=...
DATABASE_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
LOG_LEVEL=info|warn|error
```

Notes:
- `LOG_LEVEL` defaults to `info`.
- Logger output is suppressed in tests (`NODE_ENV=test`).

## Finding Structure

### Every Finding Has
```
{
  id: string,                    // Unique identifier
  title: string,                 // Issue title
  category: string,              // hacking|performance|compliance|seo|accessibility
  severity: string,              // critical|high|medium|low
  observed: string,              // What was found
  impact: string,                // What could happen
  fix: string,                   // How to fix it
  hackerPerspective?: string,   // Optional: how to exploit
  
  // Optional: Interactive features
  eli5?: { simple, analogy, example },
  codeExample?: { vulnerable, fixed, explanation },
  attackTimeline?: [...],
  hackerConfidence?: { ... },
  interactiveDemo?: { ... },
  beforeAfterComparison?: { ... }
}
```

## Common Findings by Category

### Security Findings
- Missing HTTPS
- Missing security headers
- Server banner exposure
- Vulnerable frameworks
- Weak configuration

### Performance Findings
- Missing compression
- Large unoptimized assets
- Slow response times
- Inefficient caching
- Bandwidth waste

### Compliance Findings
- Missing privacy policy
- GDPR violations
- Missing terms of service
- Cookie consent issues
- Data retention problems

### SEO Findings
- Missing meta tags
- Poor mobile optimization
- Missing structured data
- Slow page speed
- Duplicate content

### Accessibility Findings
- Missing alt text
- Poor color contrast
- No keyboard navigation
- Missing form labels
- Poor heading structure

## Best Practices

### For Site Owners
1. Analyze your site monthly
2. Fix critical issues first
3. Track improvements over time
4. Compare against competitors
5. Update security regularly

### For Developers
1. Study vulnerable code examples
2. Review secure implementations
3. Understand attack vectors
4. Learn best practices
5. Apply fixes to your code

### For Learners
1. Start with Easy quiz questions
2. Read ELI5 explanations
3. Study code examples
4. Review attack timelines
5. Graduate to Hard questions

### For Educators
1. Use Learn Security tab
2. Have students take quiz
3. Compare site examples
4. Discuss vulnerabilities
5. Assign real-world analysis

## Troubleshooting

### Site Won't Analyze
- Check URL is public
- Verify internet connection
- Try different site
- Ensure proper URL format

### Quiz Not Scoring
- Browser may be blocking storage
- Try incognito mode
- Refresh page loses scores
- Take screenshots to save

### HTML Upload Fails
- File must be .html
- Check file size (< 10MB)
- Ensure valid HTML
- Try simplified version

## Support Resources

- **README.md** - Project overview
- **USER_GUIDE.md** - How to use features
- **FEATURES.md** - Complete feature list
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **CHANGELOG.md** - What's new

## Fun Facts

- 5 risk categories analyzed
- 10+ interactive features
- 25+ React components
- 500+ lines of API code
- 1,200+ lines of docs
- 100% educational focus
- 0 tracking/analytics
- 0 data storage

## Version Info
- **Current**: v2.0 (Multi-category)
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4

---

**Start exploring now! 🚀**
