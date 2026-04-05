# HackLens - AI Security Learning Platform

HackLens is a Next.js App Router application for learning web security through guided analysis and safe simulation. It combines AI-assisted explanations with deterministic fallback logic so core flows remain reliable even when AI is unavailable.

## Current Product Surface

### Main experiences
- Analyze Website: URL-based findings with explainer cards, risk summaries, and report generation.
- Live Hacking Demo: staged simulation with AI narration, branching defensive choices, and safety disclaimers.
- Try Attack: sandboxed attack input practice with reasoning, classification, coaching, strategy scoring, and replay.
- Simulate Attack: stateful scenario training with adaptive mode and memory-based attacker behavior.

### Intelligence layer
- User Intelligence Profile: weak_areas, strengths, behavior_pattern, avg_score.
- Global AI Summary: compact personalized summary shown near top of the app.
- Guided Learning Path: recommended next 3 training steps.
- Strategy Scoring: score and insights based on recent user decisions.

### AI + cache dual mode
- AI routes execute on backend only (no frontend secret exposure).
- Deterministic fallbacks are available for:
    - security explainer content
    - fix code snippets
    - learning path and global summary
    - strategy scoring
    - report generation
    - narration/choice fallbacks in live demo

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm

### Install and run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Environment

Create .env.local from .env.example and configure:

```dotenv
OPENAI_API_KEY=...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
LOG_LEVEL=info
```

### Database bootstrap

```bash
pnpm db:init
```

The app is database-first for authenticated and anonymous tracking where available, with safe local fallbacks for guests or transient DB failures.

## API Surface

### Existing routes
- POST /api/analyze
- POST /api/analysis
- POST /api/scenario
- POST /api/simulate-attack
- GET,POST /api/user
- GET /api/analytics
- POST /api/explainer

### New additive route
- POST /api/report

No existing endpoint contract was removed or renamed.

## High-Level Architecture

### App and UI
- app/page.tsx: tabbed shell + global intelligence panel
- components/analysis-result.tsx: findings, explanations, and report UX
- components/visual-vulnerability-simulator.tsx: narration + branching choices
- components/try-attack-sandbox.tsx: coaching + strategy feedback + replay
- components/ai-simulation/simulate-attack.tsx: scenario flow and replay capture
- components/ai-simulation/scenario-result.tsx: detailed result + replay view

### Services
- lib/services/user-intelligence.ts
- lib/services/strategy-scoring.ts
- lib/services/ai-summary.ts
- lib/services/learning-path.ts
- lib/services/replay-timeline.ts
- lib/services/user-service.ts

### AI and simulation
- lib/ai/simulation-engine.ts: stateful progression with attacker memory
- app/api/explainer/route.ts: secure backend explainer and fallback

## Safety and Education Notes

- Simulations are educational and sandboxed.
- No real-world attack execution is performed by the app.
- Live demo and sandbox views include explicit simulation/safety messaging.

## Deployment

Deploy on Vercel (recommended) or any Node-compatible Next.js host.

## License

MIT
