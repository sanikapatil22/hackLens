# 🎯 HackLens - Advanced Security Learning Platform

A playful, educational web application that analyzes websites for security, performance, compliance, SEO, and accessibility issues. Learn from a "friendly hacker's" perspective in simple, non-scary terms!

## 🌟 Core Features

### Analysis & Comparison
- **🔍 Website Analysis** - Scan any public website for vulnerabilities
- **⚖️ Compare Sites** - Side-by-side comparison of two websites' security posture
- **📁 HTML Upload** - Analyze local .html files instantly
- **📊 Risk Scoring** - Overall risk score with severity breakdown and category filtering

### Five Risk Categories (Not Just Hacking!)
- **🔓 Security/Hacking** - HTTPS, headers, exploits, attack vectors
- **⚡ Performance** - Compression, speed, bandwidth optimization
- **📋 Compliance & Privacy** - GDPR, privacy policies, data protection
- **🔎 SEO & Discoverability** - Search optimization, metadata, structured data
- **♿ Accessibility** - WCAG compliance, screen readers, keyboard navigation

### Interactive Learning
- **🧪 Try Attack Sandbox** - Type actual payloads to see how attacks work (safely!)
- **🎮 Hack or Safe Quiz** - Gamified challenges with difficulty levels and scoring
- **📈 Attack Timeline** - Step-by-step visualization of exploitation process
- **📊 Before vs After** - Visualize impact of implementing security fixes
- **💻 Code Examples** - Vulnerable vs secure code side-by-side comparison

### Backend & AI Engine Features
- **🤖 Hybrid Scenario Generation** - LLM-backed scenario generation with cache fallback
- **🔁 Stateful Simulation Loop** - Multi-step simulation progression with attacker reactions
- **🧠 Adaptive Difficulty** - Learner-aware scenario selection and difficulty tuning
- **🗄 PostgreSQL + Guest Mode** - Authenticated persistence plus local fallback for guests
- **🧱 Service Layer Architecture** - API routes delegate to focused backend services
- **🪵 Structured Logging** - Environment-aware logging with configurable log levels

### Educational Features
- **🧠 Hacker Confidence Meter** - Shows exploit difficulty, common attack vectors, success rates
- **🎤 Explain Like I'm 5** - Toggle for simplified explanations with real-world analogies
- **📚 Learn Security Tab** - Pre-built example findings demonstrating all features
- **🎨 Beautiful Dark UI** - Modern, tech-forward design optimized for learning

### Results Interface
- **Category Filtering** - Filter findings by Security, Performance, Compliance, SEO, Accessibility
- **Severity Breakdown** - View Critical, High, Medium, Low issue counts
- **Expandable Details** - Click findings to see code examples, attack timelines, and confidence scores
- **Multi-perspective** - Each finding explained from hacker, user, developer perspectives

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm

### Installation

```bash
# Clone and setup
git clone <your-repo>
cd hackerbuddy
pnpm install

# Run development server
pnpm dev
```

### Database Setup (Optional, Recommended)

The app supports hybrid user tracking:
- Database-first with PostgreSQL when `DATABASE_URL` is configured.
- Automatic local fallback on the client when database access fails.

1. Copy environment values from `.env.example` into `.env.local`.
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. Initialize tables and indexes:

```bash
pnpm db:init
```

If PostgreSQL is unavailable, the simulation experience still works using client-side storage fallback.

### Logging Configuration

`LOG_LEVEL` controls backend logging verbosity:

- `info` (default)
- `warn`
- `error`

When `NODE_ENV=test`, backend logger output is suppressed for clean test runs.

Open [http://localhost:3000](http://localhost:3000) to start learning!

### How to Use

1. **Analyze Website Tab** - Enter any URL to scan for security, performance, compliance, SEO, and accessibility issues
2. **Compare Sites Tab** - Enter two URLs to compare their security posture side-by-side
3. **Upload HTML Tab** - Upload a local .html file for instant analysis
4. **Hack or Safe Tab** - Take the security knowledge quiz with difficulty levels
5. **Learn Security Tab** - Study pre-built examples showing all features in action

Each finding includes:
- 🔍 What was observed
- 😈 How hackers would exploit it
- 💥 What could happen
- 🛠 How to fix it
- Optional: Code examples, attack timeline, confidence metrics, simplified ELI5 explanation

## 📋 Complete Analysis Checklist

### Security & Hacking
- HTTPS/SSL encryption status
- Security headers (X-Frame-Options, X-Content-Type-Options, HSTS)
- Server banner exposure
- Attack vector analysis
- Vulnerability confidence scoring

### Performance
- Content compression (gzip) availability
- Page load optimization opportunities
- Bandwidth reduction recommendations
- User experience impact analysis

### Compliance & Privacy
- GDPR compliance requirements
- Privacy policy presence
- Data protection measures
- Legal risk assessment
- Cookie consent mechanisms

### SEO & Discoverability
- Meta tags and descriptions
- Structured data (Schema.org)
- Mobile responsiveness
- Search engine optimization
- Sitemap configuration
- Traffic impact estimation

### Accessibility
- WCAG compliance verification
- Screen reader compatibility
- Keyboard navigation support
- Color contrast analysis
- Inclusive design recommendations

## 🛡️ Security Notes

- This analyzer performs **read-only operations** - no data is modified
- Only checks publicly available HTTP headers and basic site information
- Respects robots.txt and website blocking policies
- No payloads are sent; analysis is passive and non-intrusive
- Results are for educational purposes

## 🏗️ Project Structure

```
app/
├── page.tsx                  # Main app with tab navigation
├── layout.tsx                # Root layout with dark theme
├── globals.css               # Tailwind & design tokens
└── api/
    ├── analyze/route.ts        # Website security analysis
    ├── analyze-html/route.ts   # HTML file analysis
    ├── analysis/route.ts       # Analysis service entry route
    ├── scenario/route.ts       # Scenario generation endpoint
    ├── simulate-attack/route.ts# Simulation endpoint
    ├── analytics/route.ts      # User analytics endpoint
    └── user/route.ts           # User interaction + stats endpoint

components/
├── analysis-form.tsx              # URL input form
├── analysis-result.tsx            # Results with category filtering
├── security-finding.tsx           # Individual finding display
├── attack-timeline.tsx            # Step-by-step exploitation
├── before-after-comparison.tsx    # Fix impact visualization
├── before-after-metrics.tsx       # Improvement tracking
├── code-fix-snippets.tsx          # Code examples
├── compare-sites.tsx              # Comparison form
├── compare-results.tsx            # Site comparison display
├── explain-like-im-five.tsx       # Simplified explanations
├── fix-before-after-showcase.tsx  # Before/after code showcase
├── fix-improvement-tracker.tsx    # Impact metrics
├── hack-or-safe-quiz.tsx          # Gamified quiz
├── hacker-confidence-meter.tsx    # Risk metrics display
├── html-upload.tsx                # File upload component
├── learn-security.tsx             # Educational examples
├── tabs-navigation.tsx            # Tab system
├── try-attack-sandbox.tsx         # Interactive testing
└── ui/                            # shadcn/ui components

types/
└── security.ts               # TypeScript interfaces & types

lib/
├── ai/
│   ├── scenario-engine.ts      # Scenario orchestration (live + fallback)
│   ├── adaptive-engine.ts      # Difficulty adaptation engine
│   ├── user-tracking.ts        # Learning profile tracking
│   └── simulation-engine.ts    # Stateful simulation step engine
├── server/
│   ├── llm-client.ts           # Shared LLM client + schema-safe parsing
│   ├── logger.ts               # Structured logger with log-level filter
│   ├── rate-limiter.ts         # Rate-limiting helpers
│   ├── cache.ts                # In-memory cache helpers
│   └── db.ts                   # PostgreSQL query helper
├── services/
│   ├── analysis-service.ts     # Analysis business logic
│   ├── scenario-service.ts     # Scenario business logic
│   └── user-service.ts         # User and stats business logic
├── validation/
│   ├── analysis-schema.ts      # Analysis payload validation
│   └── scenario-schema.ts      # Scenario payload validation
└── quiz-questions.ts           # Gamified quiz questions

.env.example                  # Environment template
FEATURES.md                   # Detailed feature documentation
```

## 🎨 Design System

- **Color Scheme**: Dark tech-forward aesthetic with vibrant accent colors
- **Typography**: Clean, readable fonts optimized for learning
- **Components**: Built with shadcn/ui for consistency and accessibility

## 🔧 Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Frontend**: React 19 with Server Components
- **Styling**: Tailwind CSS v4 with semantic design tokens
- **UI Components**: shadcn/ui (buttons, cards, inputs, etc.)
- **Icons**: Lucide React
- **Architecture**: Component-based with API routes
- **Backend Pattern**: Route + service + validation layering
- **Testing**: Vitest route/service/AI coverage
- **Deployment**: Optimized for Vercel, works anywhere with Node.js

## 📚 Learning Resources

For deeper learning:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common vulnerabilities
- [MDN Web Docs - Security](https://developer.mozilla.org/en-US/docs/Web/Security) - In-depth guides
- [Security Headers](https://securityheaders.com) - Check your security headers
- [Mozilla Observatory](https://observatory.mozilla.org/) - Similar analysis tool
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide) - SEO basics

See [FEATURES.md](./FEATURES.md) for complete documentation of all interactive features.

## 💡 Tips for Using HackLens

1. **Test your own sites** - Use this to learn about your own security posture
2. **Read the explanations** - Understanding the "why" is more important than the findings
3. **Share with teams** - Use this as a teaching tool for developers
4. **Remember: No fix is forever** - Security requires ongoing maintenance

## 🤝 Disclaimer

This tool is for **educational purposes only**. 

- Only analyze websites you own or have permission to test
- Results are based on basic header analysis and are not comprehensive
- Professional security audits require much deeper analysis
- Always report real vulnerabilities responsibly to site owners

## 🚀 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or deploy anywhere that supports Next.js!

## 📝 License

MIT License - Feel free to use for learning and teaching!

---

Built with ❤️ for curious developers who want to understand security better.
