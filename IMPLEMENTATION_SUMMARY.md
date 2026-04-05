# HackLens Implementation Summary

## Current Scope

HackLens is an AI-assisted, educational security platform with four active product areas:

1. Analyze Website
2. Live Hacking Demo
3. Try Attack
4. Simulate Attack

The implementation is additive and fallback-first, with deterministic behavior preserved when AI is unavailable.

## Architecture Overview

### Frontend
- Next.js App Router with client-first interactive modules.
- Feature-specific components for analysis, simulation, sandbox coaching, and narration.
- Top-level intelligence panel for summary and guided learning path.

### Backend
- Route + service architecture.
- Existing endpoints retained; additive endpoint introduced for report generation.
- Secure AI routing through backend only (no frontend key exposure).

### Data
- PostgreSQL for users, interactions, and user_stats.
- Additive profile fields in user_stats:
  - weak_areas (jsonb)
  - strengths (jsonb)
  - behavior_pattern (text)
  - avg_score (float)
- Database-first with client fallback when needed.

## Key Implemented Systems

### 1) Security Explainer + Fix Generator

- Optional `fix_code` included in explainer model.
- AI generation via backend route with strict parse and fallback.
- Deterministic fix-code templates for common vulnerability types.
- UI rendering of fix code only when present.

### 2) Branching Story Mode (Live Demo)

- Per-stage defensive choice model.
- AI-driven choices through existing secure backend route.
- Deterministic cached choices by stage.
- User choice updates narration and attacker momentum in UI.

### 3) Strategy Scoring (Try Attack)

- Strategy scoring service with:
  - AI mode (backend route usage)
  - deterministic fallback rules
- Signal extraction includes repeated mistakes, delayed correctness, investigation gaps, and missed root cause patterns.
- UI shows score and insight bullets.

### 4) Memory-Based Attacker Simulation

- Internal attacker memory stored in simulation state:
  - previous_failures
  - preferred_style (stealth/aggressive)
- Memory updated each step and influences attacker adaptation.
- Prompt context includes memory and defense history.

### 5) Security Report Generator

- New additive endpoint: POST /api/report
- Input: vulnerabilities, explanations, optional user profile.
- Output: summary, vulnerabilities, recommendations.
- AI mode and deterministic fallback mode.
- Frontend supports report generation and print/export.

### 6) Global Intelligence Layer

- User profile synthesis from interactions.
- Global AI Summary service with deterministic fallback template.
- Guided Learning Path service returning 3 next steps with fallback rules.
- Displayed in compact top-level intelligence panel.

### 7) Session Replay System

- Shared replay timeline helper.
- Try Attack replay with auto-play + speed controls.
- Simulate Attack replay from captured session history.
- Replay is stored-data based (no AI required for playback).

## Reliability and Safety Patterns

- All AI features have deterministic fallback behavior.
- Existing endpoint contracts remain stable.
- Existing response structures remain stable.
- Additive changes only; no core-service removals.
- Educational simulation messaging preserved.

## Main Files Added/Extended

### New services
- lib/services/user-intelligence.ts
- lib/services/strategy-scoring.ts
- lib/services/ai-summary.ts
- lib/services/learning-path.ts
- lib/services/replay-timeline.ts

### New route
- app/api/report/route.ts

### Extended routes/components
- app/api/explainer/route.ts
- components/security-explainer.ts
- components/security-finding.tsx
- components/analysis-result.tsx
- components/visual-vulnerability-simulator.tsx
- components/try-attack-sandbox.tsx
- components/ai-simulation/simulate-attack.tsx
- components/ai-simulation/scenario-result.tsx
- components/global-intelligence-panel.tsx
- app/page.tsx
- lib/ai/simulation-engine.ts
- lib/services/user-service.ts
- lib/server/sql/schema.sql

## Outcome

HackLens now delivers a connected intelligence experience across analysis, sandbox practice, and simulation:

- Personalized focus and recommendations.
- Adaptive and memory-aware simulation behavior.
- Replayable learning sessions.
- Report-ready analysis artifacts.
- AI enhancement with robust deterministic fallback.
