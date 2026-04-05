# HackLens Quick Reference

## Tabs

- Analyze Website
- Live Hacking Demo
- Try Attack
- Simulate Attack

## Key New Capabilities

- Fix code generation in explainer cards.
- Branching Story Mode in live demo.
- Strategy scoring in Try Attack.
- Memory-based attacker behavior in simulation engine.
- Global AI Summary and Guided Learning Path panel.
- Session replay in Try Attack and simulation result.
- Security report generation with print/export.

## AI + Cache Behavior

- AI mode uses backend-only calls through API routes.
- Cache mode uses deterministic fallback templates/rules.
- No client-side secret key usage.

## Routes

### Core
- POST /api/analyze
- POST /api/analysis
- POST /api/scenario
- POST /api/simulate-attack
- GET,POST /api/user
- GET /api/analytics
- POST /api/explainer

### Additive
- POST /api/report

## Analyze Website Workflow

1. Analyze URL.
2. Expand findings.
3. Read insight/risk/fix and optional fix code.
4. Generate report when needed.
5. Print/export report if desired.

## Live Hacking Demo Workflow

1. Open live demo.
2. Observe stage and narration.
3. Pick a defensive action from Branching Story Mode.
4. Watch narration/stage adapt.

## Try Attack Workflow

1. Enter attack input.
2. Review classification and coach hints.
3. Read strategy score and insights.
4. Use Replay Attack to step through timeline.

## Simulate Attack Workflow

1. Generate scenario (manual/adaptive).
2. Choose action.
3. Review stateful result.
4. Use Replay Attack for session playback.

## Data and Profile

User profile signals are derived and reused across UI layers:
- weak_areas
- strengths
- behavior_pattern
- avg_score

## Safety Notes

- Simulations are educational and safe.
- No real attacks are executed.
- Existing endpoint contracts remain unchanged.
